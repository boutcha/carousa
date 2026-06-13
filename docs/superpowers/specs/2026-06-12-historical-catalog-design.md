# Historical Vehicle Catalog Design

**Date:** 2026-06-12
**Status:** Approved for first implementation slice

## Goal

Expand the matching catalog beyond current new-car rows so Carsablanca can recommend realistic used cars in Morocco, including previous Moroccan versions and common European-import trims back to model year 2000.

## Scope

V1 historical coverage has two layers:

- `morocco_official`: versions and trims officially sold in Morocco, stored as `market_origin = morocco_official` and `availability_scope = used_ma`.
- `common_import`: European trims commonly seen in Morocco, stored separately as `market_origin = morocco_used_import` and `availability_scope = imported_edge_case`.

The first implementation slice covers high-volume market models: Dacia Sandero/Logan/Duster, Renault Clio/Megane/Kangoo/Captur, Peugeot 206/207/208/307/308/2008/3008/Partner, Volkswagen Polo/Golf/Tiguan, Hyundai i10/i20/Accent/Tucson/Santa Fe, Kia Picanto/Rio/Ceed/Sportage, Toyota Yaris/Corolla/RAV4/Prado, Ford Fiesta/Focus/Kuga, Citroen C3/C4/Berlingo, Opel Corsa/Astra, Seat Ibiza/Leon/Ateca, Nissan Qashqai/Juke, and common import-only Golf/BMW/Mercedes/Audi references.

## Data Shape

The existing schema is sufficient for the first slice:

- `vehicle_generations` stores generation code/name and production years.
- `vehicle_versions` stores trim/version with `market_origin` and `availability_scope`.
- `version_years` stores each eligible model year.
- `price_observations` stores current Morocco used-market baseline prices by model year and mileage.
- `sources` and `catalog_source_records` store provenance for the imported seed row.

The historical seed CSV stores version-year ranges, market layer, fuel/transmission hints, fiscal horsepower, and current used-market price ranges. The importer expands every row into annual `version_years` and `price_observations`.

## Matching Behavior

The catalog query should produce one candidate per priced version-year, not only one row per version. Current new cars still come from `morocco_new`; historical official cars come from `morocco_used`; common imports come from `morocco_imported_seen`.

Condition filtering works as:

- `new`: current Morocco new cars only.
- `used`: historical official and common-import used candidates.
- `all`: both new and used/import candidates.

Explicit body/fuel filters remain strict. Budget remains a near-match guard so the page can show close options above budget without flooding unrelated cars.

## Trust and Limitations

The first seed is a curated baseline, not a final exhaustive market database. Rows carry low-to-medium confidence and are meant to unlock product behavior while future source-specific audits improve exact trim completeness and pricing. UI copy should continue to frame values as estimates, not offers.
