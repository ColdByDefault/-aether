import { useEffect } from "react"

export function useOnWindowResize(handler: () => void) {
  useEffect(() => {
    window.addEventListener("resize", handler)
    handler()
    return () => window.removeEventListener("resize", handler)
  }, [handler])
}
