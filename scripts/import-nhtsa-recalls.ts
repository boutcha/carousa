import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { loadEnvConfig } from "@next/env";
import { Pool, type PoolClient } from "pg";

import {
  createNhtsaRecallImportPlan,
  parseNhtsaRecallLine,
  type NhtsaCatalogGeneration,
  type NhtsaPlannedApplicability,
  type NhtsaPlannedIssue,
  type NhtsaRecallRecord,
} from "../lib/reliability/nhtsa-recalls";

type ImportOptions = {
  dryRun: boolean;
  download: boolean;
  refreshDownload: boolean;
  files: string[];
  maxUnmatchedRecords: number;
};

type FileReadSummary = {
  file: string;
  rawLines: number;
  parsedVehicleRecords: number;
  skippedLines: number;
};

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const sourceName = "NHTSA vehicle recalls bulk data";
const sourceUrl = "https://www.nhtsa.gov/nhtsa-datasets-and-apis";
const sourcePublisher = "National Highway Traffic Safety Administration";
const sourceConfidence = 0.95;
const nhtsaIssueSlugPrefix = "nhtsa-recall-";
const downloadedFiles = [
  {
    url: "https://static.nhtsa.gov/odi/ffdd/rcl/FLAT_RCL_PRE_2010.zip",
    fileName: "FLAT_RCL_PRE_2010.zip",
  },
  {
    url: "https://static.nhtsa.gov/odi/ffdd/rcl/FLAT_RCL_POST_2010.zip",
    fileName: "FLAT_RCL_POST_2010.zip",
  },
];

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to import NHTSA recall facts.");
}

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const files: string[] = [];
  let download = false;
  let refreshDownload = false;
  let maxUnmatchedRecords = 50;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--download") {
      download = true;
    } else if (arg === "--refresh-download") {
      refreshDownload = true;
    } else if (arg === "--file") {
      const file = args[index + 1];
      if (!file) throw new Error("--file requires a path");
      files.push(file);
      index++;
    } else if (arg.startsWith("--file=")) {
      files.push(arg.slice("--file=".length));
    } else if (arg === "--max-unmatched-records") {
      const value = Number.parseInt(args[index + 1] ?? "", 10);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error("--max-unmatched-records requires a non-negative integer");
      }
      maxUnmatchedRecords = value;
      index++;
    } else if (arg.startsWith("--max-unmatched-records=")) {
      const value = Number.parseInt(arg.slice("--max-unmatched-records=".length), 10);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error("--max-unmatched-records requires a non-negative integer");
      }
      maxUnmatchedRecords = value;
    }
  }

  return {
    dryRun: args.includes("--dry-run") || !args.includes("--apply"),
    download,
    refreshDownload,
    files,
    maxUnmatchedRecords,
  };
}

async function downloadFile(url: string, destination: string, refresh: boolean) {
  if (!refresh && fs.existsSync(destination) && fs.statSync(destination).size > 0) {
    return destination;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const webStream = response.body as unknown as Parameters<typeof Readable.fromWeb>[0];
  await pipeline(Readable.fromWeb(webStream), fs.createWriteStream(destination));
  return destination;
}

async function downloadDefaultFiles(refresh: boolean) {
  const outputDir = path.join(os.tmpdir(), "carsablanca-nhtsa-recalls");
  const files: string[] = [];
  for (const file of downloadedFiles) {
    files.push(await downloadFile(file.url, path.join(outputDir, file.fileName), refresh));
  }
  return files;
}

function streamZipFile(filePath: string) {
  const child = spawn("unzip", ["-p", filePath], { stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const done = new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`unzip -p failed for ${filePath}: ${stderr.trim() || `exit ${code}`}`));
      }
    });
  });

  return { input: child.stdout, done };
}

function streamInputFile(filePath: string) {
  if (filePath.toLowerCase().endsWith(".zip")) {
    return streamZipFile(filePath);
  }
  return { input: fs.createReadStream(filePath), done: Promise.resolve() };
}

async function readRecallRecords(files: string[]) {
  const records: NhtsaRecallRecord[] = [];
  const fileSummaries: FileReadSummary[] = [];

  for (const file of files) {
    const { input, done } = streamInputFile(file);
    const lines = createInterface({ input, crlfDelay: Infinity });
    let rawLines = 0;
    let parsedVehicleRecords = 0;
    let skippedLines = 0;

    for await (const line of lines) {
      rawLines++;
      const record = parseNhtsaRecallLine(line);
      if (record) {
        parsedVehicleRecords++;
        records.push(record);
      } else {
        skippedLines++;
      }
    }

    await done;
    fileSummaries.push({ file, rawLines, parsedVehicleRecords, skippedLines });
  }

  return { records, fileSummaries };
}

function toInteger(value: number | string | null) {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function loadCatalogGenerations(client: PoolClient) {
  const result = await client.query<{
    brand_id: string;
    brand_name: string;
    model_id: string;
    model_name: string;
    generation_id: string;
    generation_name: string;
    starts_year: number | string;
    ends_year: number | string | null;
  }>(`
    select
      b.id::text as brand_id,
      b.name as brand_name,
      m.id::text as model_id,
      m.name as model_name,
      g.id::text as generation_id,
      g.name as generation_name,
      g.starts_year,
      g.ends_year
    from vehicle_generations g
    join vehicle_models m on m.id = g.model_id
    join brands b on b.id = m.brand_id
    order by b.name, m.name, g.starts_year
  `);

  return result.rows.map((row): NhtsaCatalogGeneration => {
    const startsYear = toInteger(row.starts_year);
    if (!startsYear) throw new Error(`Missing starts_year for generation ${row.generation_id}`);
    return {
      brandId: row.brand_id,
      brandName: row.brand_name,
      modelId: row.model_id,
      modelName: row.model_name,
      generationId: row.generation_id,
      generationName: row.generation_name,
      startsYear,
      endsYear: toInteger(row.ends_year),
    };
  });
}

async function ensureSource(
  client: PoolClient,
  input: { retrievedAt: Date; asOfDate: string; fileSummaries: FileReadSummary[] },
) {
  const existing = await client.query<{ id: string }>(
    "select id from sources where name = $1 and coalesce(url, '') = $2 limit 1",
    [sourceName, sourceUrl],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await client.query<{ id: string }>(
    `
      insert into sources (name, type, url, publisher, retrieved_at, as_of_date, confidence, metadata)
      values ($1, 'official', $2, $3, $4, $5, $6, $7)
      returning id
    `,
    [
      sourceName,
      sourceUrl,
      sourcePublisher,
      input.retrievedAt,
      input.asOfDate,
      sourceConfidence,
      {
        importScript: "scripts/import-nhtsa-recalls.ts",
        sourceFiles: downloadedFiles,
        fileSummaries: input.fileSummaries,
        caveat: "Official US recall facts; VIN and Morocco-market applicability still require verification.",
      },
    ],
  );

  return inserted.rows[0].id;
}

function placeholders(rows: unknown[][], values: unknown[]) {
  return rows
    .map((row) => {
      const rowPlaceholders = row.map((value) => {
        values.push(value);
        return `$${values.length}`;
      });
      return `(${rowPlaceholders.join(", ")})`;
    })
    .join(", ");
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function resetPreviousImport(client: PoolClient, sourceId: string) {
  await client.query("delete from issue_applicability where source_id = $1", [sourceId]);
  await client.query("delete from known_issues where slug like $1", [`${nhtsaIssueSlugPrefix}%`]);
}

async function upsertIssues(client: PoolClient, issues: NhtsaPlannedIssue[]) {
  const issueIdBySlug = new Map<string, string>();

  for (const issueChunk of chunk(issues, 500)) {
    const values: unknown[] = [];
    const rows = issueChunk.map((issue) => [
      issue.title,
      issue.slug,
      issue.description,
      issue.severity,
      issue.affectedSystem,
      issue.typicalMileageMinKm,
      issue.typicalMileageMaxKm,
      issue.confidence,
    ]);

    const result = await client.query<{ id: string; slug: string }>(
      `
        insert into known_issues (
          title,
          slug,
          description,
          severity,
          affected_system,
          typical_mileage_min_km,
          typical_mileage_max_km,
          confidence
        )
        values ${placeholders(rows, values)}
        on conflict (slug) do update
        set
          title = excluded.title,
          description = excluded.description,
          severity = excluded.severity,
          affected_system = excluded.affected_system,
          typical_mileage_min_km = excluded.typical_mileage_min_km,
          typical_mileage_max_km = excluded.typical_mileage_max_km,
          confidence = excluded.confidence,
          updated_at = now()
        returning id, slug
      `,
      values,
    );

    for (const row of result.rows) {
      issueIdBySlug.set(row.slug, row.id);
    }
  }

  return issueIdBySlug;
}

async function insertApplicability(
  client: PoolClient,
  input: {
    sourceId: string;
    issueIdBySlug: Map<string, string>;
    applicability: NhtsaPlannedApplicability[];
  },
) {
  for (const applicabilityChunk of chunk(input.applicability, 500)) {
    const values: unknown[] = [];
    const rows = applicabilityChunk.map((item) => {
      const issueId = input.issueIdBySlug.get(item.issueSlug);
      if (!issueId) throw new Error(`Issue id not found for ${item.issueSlug}`);
      return [
        issueId,
        item.generationId,
        null,
        null,
        item.modelYearStart,
        item.modelYearEnd,
        item.marketCode,
        `${item.notes} Source record ids: ${item.sourceRecordIds.join(", ")}.`,
        input.sourceId,
      ];
    });

    await client.query(
      `
        insert into issue_applicability (
          known_issue_id,
          generation_id,
          powertrain_id,
          vehicle_version_id,
          model_year_start,
          model_year_end,
          market_code,
          notes,
          source_id
        )
        values ${placeholders(rows, values)}
      `,
      values,
    );
  }
}

async function applyPlan(
  client: PoolClient,
  input: { sourceId: string; plan: ReturnType<typeof createNhtsaRecallImportPlan> },
) {
  await resetPreviousImport(client, input.sourceId);
  const issueIdBySlug = await upsertIssues(client, input.plan.issues);
  await insertApplicability(client, {
    sourceId: input.sourceId,
    issueIdBySlug,
    applicability: input.plan.applicability,
  });
}

async function main() {
  const options = parseArgs();
  const files = [
    ...(options.download ? await downloadDefaultFiles(options.refreshDownload) : []),
    ...options.files,
  ];

  if (files.length === 0) {
    throw new Error("Pass --download for the official bulk files or --file <path> for local files.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  const retrievedAt = new Date();
  const asOfDate = retrievedAt.toISOString().slice(0, 10);

  try {
    const catalogGenerations = await loadCatalogGenerations(client);
    if (catalogGenerations.length === 0) {
      throw new Error("No vehicle_generations found; import catalog data before NHTSA recalls.");
    }

    const { records, fileSummaries } = await readRecallRecords(files);
    const plan = createNhtsaRecallImportPlan(catalogGenerations, records, {
      maxUnmatchedRecords: options.maxUnmatchedRecords,
    });

    if (options.dryRun) {
      console.log(
        JSON.stringify(
          {
            mode: "dry-run",
            source: { name: sourceName, url: sourceUrl },
            files: fileSummaries,
            ...plan.summary,
            unmatchedSample: plan.unmatchedRecords,
          },
          null,
          2,
        ),
      );
      return;
    }

    await client.query("begin");
    const sourceId = await ensureSource(client, { retrievedAt, asOfDate, fileSummaries });
    await applyPlan(client, { sourceId, plan });
    await client.query("commit");

    console.log(
      JSON.stringify(
        {
          mode: "applied",
          sourceId,
          source: { name: sourceName, url: sourceUrl },
          files: fileSummaries,
          ...plan.summary,
          unmatchedSample: plan.unmatchedRecords,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // Ignore rollback failures when no transaction was opened.
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
