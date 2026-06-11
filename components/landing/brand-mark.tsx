import { cn } from "@/lib/utils"

/* Identity compression: the route-bar IS the logo — two solid segments, one hatched. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex h-2 w-6 items-stretch gap-[2px]", className)}
      aria-hidden="true"
    >
      <span className="flex-[2] bg-vert-light" />
      <span className="hatch flex-[1.4]" />
      <span className="flex-1 bg-rouge" />
    </span>
  )
}
