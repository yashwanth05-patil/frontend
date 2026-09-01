import { useCallback, useEffect, useRef, useState } from 'react'

const HOLD_MS = 1600

function GuardianDial({
  ringState = 'calm',
  caption,
  disabled = false,
  onHoldComplete,
  onCancel,
  activeLabel,
}) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [remainingMs, setRemainingMs] = useState(HOLD_MS)
  const startRef = useRef(0)
  const rafRef = useRef(null)
  const completedRef = useRef(false)

  // Live state — red. Everything else amber. Red is reserved exclusively for live SOS.
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
    setRemainingMs(HOLD_MS)
    startRef.current = 0
  }, [])

  const tick = useCallback((onComplete) => {
    const elapsed = performance.now() - startRef.current
    const next = Math.min(elapsed / HOLD_MS, 1)
    setProgress(next)
    setRemainingMs(Math.max(0, Math.ceil((HOLD_MS - elapsed) / 1000)))
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

  const isLive = visual === 'triggered'

  const ringColor = isLive
    ? 'border-signal'
    : 'border-amber'

  const ringAnim = isLive
    ? 'shadow-dial-live'
    : visual === 'arming' || visual === 'armed'
      ? 'vigil-quicken border-amber shadow-dial-glow'
      : 'vigil-breathe border-amber shadow-dial-glow'

  const centerFill = isLive
    ? 'bg-signal text-mist'
    : 'bg-panel-raised text-amber'

  const progressColor = isLive ? '#E5484D' : '#E8A33D'

  const dotColor = isLive ? 'bg-signal' : 'bg-amber'

  const statusLabel = isLive
    ? (caption || 'ALERT LIVE · SHARING LOCATION + AUDIO')
    : visual === 'arming'
      ? `HOLD ${remainingMs}s · RELEASE TO CANCEL`
      : visual === 'armed'
        ? caption || 'LISTENING FOR “EMERGENCY”…'
        : caption || 'HOLD TO ARM ALERT'

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative w-[232px] h-[232px] md:w-[260px] md:h-[260px]">
        {/* One sonar pulse only when live, then it fades out and stays off */}
        {isLive && (
          <span
            aria-hidden="true"
            className="vigil-sonar pointer-events-none absolute inset-0 rounded-full border-2 border-signal"
          />
        )}

        <div
          className={`absolute inset-0 rounded-full border-[3px] ${ringColor} ${ringAnim}`}
        />

        {/* Clockwise amber progress while arming */}
        {holding && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={progressColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${progress * 289} 289`}
            />
          </svg>
        )}

        {!isLive && (
          <span
            className={`pointer-events-none absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full motion-reduce:opacity-100 ${dotColor}`}
          />
        )}

        <button
          type="button"
          disabled={disabled || isLive}
          aria-label="Hold to arm emergency alert"
          className={`absolute inset-[18px] rounded-full ${centerFill} font-display text-display-sm tracking-wide transition-all duration-page ease-page focus:outline-none focus-visible:ring-2 focus-visible:ring-amber ${
            isLive ? 'cursor-default shadow-dial-live' : ''
          }`}
          onPointerDown={(event) => {
            if (isLive) return
            event.currentTarget.setPointerCapture?.(event.pointerId)
            beginHold(event)
          }}
          onPointerUp={isLive ? undefined : cancelHold}
          onPointerCancel={isLive ? undefined : cancelHold}
          onContextMenu={(event) => event.preventDefault()}
          style={{ touchAction: 'none' }}
        >
          {isLive ? 'LIVE' : 'SOS'}
        </button>
      </div>

      <p className="mono-readout text-center min-h-[1.4em] px-4">
        {statusLabel}
      </p>

      {/* Persistent alert strip while SOS is live — red is only here */}
      {isLive && (
        <div className="w-full max-w-sm rounded-panel bg-panel border border-signal/50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-signal animate-pulse shrink-0" />
            <span className="mono-readout text-signal truncate">
              {activeLabel || 'ALERT LIVE · SHARING LOCATION + AUDIO'}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 min-h-touch min-w-touch rounded-btn border border-signal/50 px-3 text-caption text-mist transition-colors duration-page hover:bg-signal-soft"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default GuardianDial