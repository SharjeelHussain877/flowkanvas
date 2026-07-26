import { useEffect, useState } from "react"

const REVEAL_INTERVAL_MS = 70

export function useStaggeredReveal(itemCount: number, enabled: boolean) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!enabled || itemCount === 0) {
      setVisibleCount(0)
      return
    }

    setVisibleCount(0)

    let revealed = 0
    let timeoutId = 0

    const revealNext = () => {
      revealed += 1
      setVisibleCount(revealed)

      if (revealed < itemCount) {
        timeoutId = window.setTimeout(revealNext, REVEAL_INTERVAL_MS)
      }
    }

    timeoutId = window.setTimeout(revealNext, REVEAL_INTERVAL_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [enabled, itemCount])

  return visibleCount
}
