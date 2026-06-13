"use client"

import { useEffect } from "react"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"

/* Mounts once and reveals any [data-reveal] element as it scrolls into view.
   Only elements still below the fold are hidden first, so above-the-fold
   content never flashes and nothing stays hidden if JS or IO is unavailable. */
export function ScrollReveals() {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || typeof IntersectionObserver === "undefined") return
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    )
    if (!els.length) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in")
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    )

    const fold = window.innerHeight * 0.9
    for (const el of els) {
      if (el.getBoundingClientRect().top > fold) {
        el.classList.add("reveal-pre")
        io.observe(el)
      }
    }
    return () => io.disconnect()
  }, [reduced])

  return null
}
