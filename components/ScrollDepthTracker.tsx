'use client'

import { useEffect } from 'react'

const THRESHOLDS = [25, 50, 75, 100]

export default function ScrollDepthTracker() {
  useEffect(() => {
    const fired = new Set<number>()

    const onScroll = () => {
      if (typeof window === 'undefined') return
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      )
      const winHeight = window.innerHeight || document.documentElement.clientHeight
      const maxScroll = docHeight - winHeight
      if (maxScroll <= 0) return
      const percent = Math.round((scrollTop / maxScroll) * 100)

      for (const t of THRESHOLDS) {
        if (percent >= t && !fired.has(t)) {
          fired.add(t)
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'scroll_depth', {
              event_category: 'Engagement',
              event_label: `${t}%`,
              value: t,
              non_interaction: true,
            })
          }
        }
      }
    }

    const onScrollThrottled = throttle(onScroll, 500)
    window.addEventListener('scroll', onScrollThrottled, { passive: true })
    onScrollThrottled()

    return () => {
      window.removeEventListener('scroll', onScrollThrottled)
    }
  }, [])

  return null
}

function throttle<T extends (...args: any[]) => void>(fn: T, wait: number): T {
  let last = 0
  let timeout: any
  return function(this: any, ...args: any[]) {
    const now = Date.now()
    const remaining = wait - (now - last)
    if (remaining <= 0) {
      clearTimeout(timeout)
      last = now
      fn.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        last = Date.now()
        timeout = null
        fn.apply(this, args)
      }, remaining)
    }
  } as T
}
