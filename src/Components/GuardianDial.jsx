import { useCallback, useEffect, useRef, useState } from 'react'

const HOLD_MS = 500

function GuardianDial({
  ringState = 'calm',
  caption,
  disabled = false,
  onHoldComplete,
}) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const startRef = useRef(0)
  const rafRef = useRef(null)
  const completedRef = useRef(false)

  const visual = ringState === 'triggered'
    ? 'triggered'
    : holding
      ? 'arming'
      : ringState

  const clearHold = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setHolding(false)
    setProgress(0)
    startRef.current = 0
  }, [])

  const tick = useCallback((onComplete) => {
    const elapsed = performance.now() - startRef.current
    const next = Math.min(elapsed / HOLD_MS, 1)
    setProgress(next)
    if (next >= 1) {
      completedRef.current = true
      clearHold()
      onComplete?.()
      return
    }
    rafRef.current = requestAnimationFrame(() => tick(onComplete))
  }, [clearHold])

  const beginHold = (event) => {
    if (disabled || ringState === 'triggered') return
    event.preventDefault()
    completedRef.current = false
    setHolding(true)
    startRef.current = performance.now()
    rafRef.current = requestAnimationFrame(() => tick(onHoldComplete))
  }

  const cancelHold = () => {
    if (completedRef.current) {
      completedRef.current = false
      return
    }
    clearHold()
  }

  useEffect(() => () => clearHold(), [clearHold])

  useEffect(() => {
    if (ringState === 'triggered') {
      completedRef.current = false
      clearHold()
    }
  }, [ringState, clearHold])

  const ringColor = visual === 'triggered'
    ? 'border-signal'
    : visual === 'arming' || visual === 'armed'
      ? 'border-dusk'
      : 'border-sage'

  const ringAnim = visual === 'triggered'
    ? ''
    : visual === 'arming' || visual === 'armed'
      ? 'vigil-quicken'
      : 'vigil-breathe'

  const centerFill = visual === 'triggered'
    ? 'bg-signal text-paper-raised'
    : 'bg-paper-raised text-ink'

  const statusLabel = caption || (
    visual === 'triggered'
      ? 'ALERT SENT · RECORDING'
      : visual === 'arming'
        ? 'HOLD TO SEND ALERT…'
        : visual === 'armed'
          ? 'LISTENING FOR “EMERGENCY”...'
          : 'HOLD TO SEND ALERT'
  )

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative w-[232px] h-[232px] md:w-[260px] md:h-[260px]">
        {visual === 'triggered' && (
          <span
            aria-hidden="true"
            className="vigil-sonar pointer-events-none absolute inset-0 rounded-full border-2 border-signal"
          />
        )}

        <div
          className={`absolute inset-0 rounded-full border-[3px] ${ringColor} ${ringAnim}`}
        />

        {holding && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#5B5F97"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${progress * 289} 289`}
            />
          </svg>
        )}

        {visual !== 'triggered' && (
          <span
            className={`pointer-events-none absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full motion-reduce:opacity-100 ${
              visual === 'armed' || visual === 'arming' ? 'bg-dusk' : 'bg-sage'
            }`}
          />
        )}

        <button
          type="button"
          disabled={disabled || ringState === 'triggered'}
          aria-label="Hold to send emergency alert"
          className={`absolute inset-[18px] rounded-full ${centerFill} font-display text-display-sm tracking-wide transition-colors duration-page focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId)
            beginHold(event)
          }}
          onPointerUp={cancelHold}
          onPointerCancel={cancelHold}
          onContextMenu={(event) => event.preventDefault()}
          style={{ touchAction: 'none' }}
        >
          SOS
        </button>
      </div>

      <p className="mono-readout text-center min-h-[1.4em] px-4">
        {statusLabel}
      </p>
    </div>
  )
}

export default GuardianDial
