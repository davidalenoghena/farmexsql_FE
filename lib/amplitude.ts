'use client'

import * as amplitude from '@amplitude/unified'

let initialized = false

export function initAmplitude() {
  if (initialized || typeof window === 'undefined') return

  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
  if (!apiKey) {
    console.warn('Amplitude API key missing — analytics disabled')
    return
  }

  amplitude.initAll(apiKey, {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
  })

  initialized = true
}

export { amplitude }
