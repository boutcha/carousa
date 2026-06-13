import { cn } from "@/lib/utils"

/* BORNE ZÉRO night road: a graph-paper floor tilted to a vanishing point,
   grid and centerline racing toward the viewer. Pure CSS — GPU-composited,
   server-rendered, no JS; freezes to a static floor under reduced motion. */
export function DataRoad({ className }: { className?: string }) {
  return (
    <div
      className={cn("road-scene pointer-events-none overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className="road-plane">
        <div className="road-mover" />
        <div className="road-center" />
        {/* lane edges — continuous, so they need no motion */}
        <span className="absolute inset-y-0 left-[35.5%] w-[2px] bg-signal/20" />
        <span className="absolute inset-y-0 right-[35.5%] w-[2px] bg-signal/20" />
      </div>
      {/* horizon: glow + fade that seats the floor into the tarmac */}
      <div className="road-glow" />
      <div className="road-fade" />
    </div>
  )
}
