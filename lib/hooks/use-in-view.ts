"use client"

import { useEffect, useRef, useState } from "react"

type Options = {
  /** Stop observing after the first time the element enters view. */
  once?: boolean
  rootMargin?: string
  threshold?: number
}

/* Reports whether the referenced element is in the viewport. Falls back to
   `true` where IntersectionObserver is unavailable, so content never hides. */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  once = true,
  rootMargin = "0px 0px -10% 0px",
  threshold = 0.25,
}: Options = {}) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      let cancelled = false
      queueMicrotask(() => {
        if (!cancelled) {
          setInView(true)
        }
      })
      return () => {
        cancelled = true
      }
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) obs.disconnect()
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { rootMargin, threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [once, rootMargin, threshold])

  return { ref, inView }
}
