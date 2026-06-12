"use client"

import { useCallback, useEffect, useState } from "react"

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
  const [element, setElement] = useState<T | null>(null)
  const [inView, setInView] = useState(false)
  const ref = useCallback((node: T | null) => {
    setElement(node)
  }, [])

  useEffect(() => {
    if (!element) return
    if (typeof IntersectionObserver === "undefined") {
      return scheduleFallback(() => setInView(true))
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
    obs.observe(element)
    return () => obs.disconnect()
  }, [element, once, rootMargin, threshold])

  return { ref, inView }
}

function scheduleFallback(callback: () => void) {
  let cancelled = false
  const run = () => {
    if (!cancelled) {
      callback()
    }
  }

  if (typeof queueMicrotask === "function") {
    queueMicrotask(run)
    return () => {
      cancelled = true
    }
  }

  const timeout = setTimeout(run, 0)
  return () => {
    cancelled = true
    clearTimeout(timeout)
  }
}
