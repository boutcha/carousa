"use client"

import { useSyncExternalStore } from "react"

const reducedMotionQuery = "(prefers-reduced-motion: reduce)"
const getServerSnapshot = () => false

function getSnapshot() {
  if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
    return false
  }

  return window.matchMedia(reducedMotionQuery).matches
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
    return () => {}
  }

  const mediaQuery = window.matchMedia(reducedMotionQuery)
  mediaQuery.addEventListener("change", callback)

  return () => mediaQuery.removeEventListener("change", callback)
}

/* Tracks the user's prefers-reduced-motion setting, live. Starts `false` so SSR
   and the first client paint match; flips on mount if the user opted out. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
