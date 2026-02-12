import { useMemo } from 'react'

// Converts HH:MM to minutes since midnight
const toMins = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const formatTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}

// ── DayArc ─────────────────────────────────────────────────────────────────────
// Renders a horizontal timeline of the day with anchor markers and a "now" cursor.
// Props:
//   anchors   — array of { id, label, time, color }
//   dayStart  — "HH:MM" (default "08:00")
//   dayEnd    — "HH:MM" (default "22:00")

export default function DayArc({ anchors = [], dayStart = '08:00', dayEnd = '22:00' }) {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const startMins = toMins(dayStart)
  const endMins = toMins(dayEnd)
  const totalMins = endMins - startMins

  // Position 0–1 along the arc
  const nowPos = Math.min(1, Math.max(0, (nowMins - startMins) / totalMins))
  const nowPct = `${(nowPos * 100).toFixed(1)}%`

  // Find current and next anchor
  const sortedAnchors = useMemo(() =>
    [...anchors].sort((a, b) => toMins(a.time) - toMins(b.time)), [anchors])

  const currentAnchor = useMemo(() => {
    let last = null
    for (const a of sortedAnchors) {
      if (toMins(a.time) <= nowMins) last = a
    }
    return last
  }, [sortedAnchors, nowMins])

  const nextAnchor = useMemo(() => {
    return sortedAnchors.find(a => toMins(a.time) > nowMins) || null
  }, [sortedAnchors, nowMins])

  const isAperion = nowMins < startMins || nowMins > endMins

  return (
    <div style={s.wrap}>
      {/* Current segment label */}
      <div style={s.segmentLabel}>
        {isAperion ? (
          <span style={{ color: '#7c7a96' }}>Outside your day</span>
        ) : currentAnchor ? (
          <>
            <span style={{ color: currentAnchor.color, fontWeight: 700 }}>
              {currentAnchor.label}
            </span>
            {nextAnchor && (
              <span style={s.nextLabel}>
                → {nextAnchor.label} at {formatTime(nextAnchor.time)}
              </span>
            )}
          </>
        ) : (
          <span style={{ color: '#7c7a96' }}>
            {nextAnchor ? `Before ${nextAnchor.label}` : 'No anchors set'}
          </span>
        )}
      </div>

      {/* Timeline bar */}
      <div style={s.barWrap}>
        {/* Background track */}
        <div style={s.track} />

        {/* Elapsed fill */}
        <div style={{ ...s.fill, width: nowPct }} />

        {/* Anchor markers */}
        {sortedAnchors.map(anchor => {
          const pos = (toMins(anchor.time) - startMins) / totalMins
          if (pos < 0 || pos > 1) return null
          const isPast = toMins(anchor.time) <= nowMins
          return (
            <div key={anchor.id} style={{ ...s.markerWrap, left: `${pos * 100}%` }}>
              <div style={{
                ...s.marker,
                background: anchor.color,
                opacity: isPast ? 1 : 0.45,
                boxShadow: isPast ? `0 0 8px ${anchor.color}88` : 'none'
              }} />
              <div style={{
                ...s.markerLabel,
                color: isPast ? anchor.color : '#7c7a96',
                transform: pos > 0.8 ? 'translateX(-100%)' : pos < 0.2 ? 'translateX(0)' : 'translateX(-50%)'
              }}>
                {anchor.label}
                <span style={s.markerTime}>{formatTime(anchor.time)}</span>
              </div>
            </div>
          )
        })}

        {/* Now cursor */}
        {!isAperion && (
          <div style={{ ...s.nowWrap, left: nowPct }}>
            <div style={s.nowLine} />
            <div style={s.nowDot} />
            <div style={s.nowTime}>
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}
      </div>

      {/* Day boundary labels */}
      <div style={s.bounds}>
        <span>{formatTime(dayStart)}</span>
        <span>{formatTime(dayEnd)}</span>
      </div>
    </div>
  )
}

const s = {
  wrap: { padding: '20px 0 8px' },
  segmentLabel: { fontSize: 15, fontWeight: 600, marginBottom: 18, minHeight: 22, display: 'flex', alignItems: 'center', gap: 8 },
  nextLabel: { fontSize: 12, color: '#7c7a96', fontWeight: 400 },
  barWrap: { position: 'relative', height: 36, marginBottom: 6 },
  track: { position: 'absolute', top: 14, left: 0, right: 0, height: 8, background: '#1e1e2e', borderRadius: 8 },
  fill: { position: 'absolute', top: 14, left: 0, height: 8, background: 'linear-gradient(90deg, #4c1d95, #7c3aed)', borderRadius: 8, transition: 'width 60s linear' },
  markerWrap: { position: 'absolute', top: 0, transform: 'translateX(-50%)' },
  marker: { width: 16, height: 16, borderRadius: '50%', margin: '5px auto', border: '2px solid #0f0f14', transition: 'all 0.3s' },
  markerLabel: { position: 'absolute', top: 28, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'center', letterSpacing: '0.03em' },
  markerTime: { display: 'block', fontSize: 9, opacity: 0.7, marginTop: 1 },
  nowWrap: { position: 'absolute', top: 0, transform: 'translateX(-50%)' },
  nowLine: { width: 2, height: 36, background: '#fff', margin: '0 auto', borderRadius: 2, opacity: 0.9 },
  nowDot: { width: 8, height: 8, background: '#fff', borderRadius: '50%', position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)' },
  nowTime: { position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#fff', whiteSpace: 'nowrap', fontWeight: 600 },
  bounds: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#3d3d55', marginTop: 28 }
}
