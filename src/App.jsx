import { useState, useEffect } from 'react'
import DayArc from './components/DayArc'
import Shelf from './components/Shelf'
import AnchorEditor from './components/AnchorEditor'
import KinetoraModal from './components/KinetoraModal'
import { useCheckin } from './hooks/useCheckin'
import { getShelfItems, saveSettings } from './lib/supabase'

const TABS = ['today', 'anchors', 'log']

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('today')
  const [shelfItems, setShelfItems] = useState([])
  const [notifGranted, setNotifGranted] = useState(Notification.permission === 'granted')

  const {
    showModal, dismissModal,
    currentAnchor, nextAnchor,
    anchors, refreshAnchors,
    settings
  } = useCheckin()

  // Load shelf
  const loadShelf = async () => {
    const items = await getShelfItems()
    setShelfItems(items || [])
  }

  useEffect(() => { loadShelf() }, [])

  // Notification permission prompt
  const requestNotifs = async () => {
    const result = await Notification.requestPermission()
    setNotifGranted(result === 'granted')
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.wordmark}>
          <span style={s.logo}>⬡</span>
          <span style={s.appName}>Ancoralis</span>
        </div>
        <div style={s.clockPill}>
          <LiveClock />
        </div>
      </div>

      {/* Notification nudge */}
      {!notifGranted && (
        <div style={s.nudge}>
          <span>Enable notifications for check-ins</span>
          <button style={s.nudgeBtn} onClick={requestNotifs}>allow</button>
        </div>
      )}

      {/* Content */}
      <div style={s.content}>
        {tab === 'today' && (
          <>
            <section style={s.section}>
              <DayArc
                anchors={anchors}
                dayStart={settings.day_start}
                dayEnd={settings.day_end}
              />
            </section>
            <div style={s.rule} />
            <section style={s.section}>
              <Shelf items={shelfItems} onRefresh={loadShelf} />
            </section>
          </>
        )}

        {tab === 'anchors' && (
          <section style={s.section}>
            <AnchorEditor anchors={anchors} onRefresh={refreshAnchors} />
            <DayBoundaryEditor settings={settings} onSave={async (changes) => {
              await saveSettings(changes)
              refreshAnchors()
            }} />
          </section>
        )}

        {tab === 'log' && (
          <section style={s.section}>
            <CheckinLog />
          </section>
        )}
      </div>

      {/* Tab bar */}
      <nav style={s.tabBar}>
        {TABS.map(t => (
          <button
            key={t}
            style={{ ...s.tabBtn, ...(tab === t ? s.tabActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t === 'today' && '◎'}
            {t === 'anchors' && '⬡'}
            {t === 'log' && '≡'}
            <span style={s.tabLabel}>{t}</span>
          </button>
        ))}
      </nav>

      {/* Kinetora modal */}
      {showModal && (
        <KinetoraModal
          currentAnchor={currentAnchor}
          nextAnchor={nextAnchor}
          onClose={dismissModal}
        />
      )}
    </div>
  )
}

// ── LiveClock ──────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [])
  return <span>{time}</span>
}

// ── DayBoundaryEditor ──────────────────────────────────────────────────────────
function DayBoundaryEditor({ settings, onSave }) {
  const [start, setStart] = useState(settings.day_start || '08:00')
  const [end, setEnd] = useState(settings.day_end || '22:00')
  const [saved, setSaved] = useState(false)

  const save = async () => {
    await onSave({ day_start: start, day_end: end })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={s.boundaryWrap}>
      <div style={s.boundaryTitle}>Day boundaries</div>
      <div style={s.boundaryRow}>
        <label style={s.boundaryLabel}>Start</label>
        <input type="time" style={s.timeInput} value={start} onChange={e => setStart(e.target.value)} />
        <label style={s.boundaryLabel}>End</label>
        <input type="time" style={s.timeInput} value={end} onChange={e => setEnd(e.target.value)} />
        <button style={s.saveBtn} onClick={save}>{saved ? '✓' : 'save'}</button>
      </div>
    </div>
  )
}

// ── CheckinLog ─────────────────────────────────────────────────────────────────
import { getCheckinLog } from './lib/supabase'

function CheckinLog() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCheckinLog(40).then(data => { setEntries(data || []); setLoading(false) })
  }, [])

  if (loading) return <div style={s.loading}>loading…</div>
  if (!entries.length) return <div style={s.empty}>no check-ins yet</div>

  const responseColor = { intentional: '#34d399', redirect: '#a78bfa', dismissed: '#4c4c6d' }
  const responseLabel = { intentional: 'on purpose', redirect: 'redirected', dismissed: 'dismissed' }

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e2f0', marginBottom: 16 }}>Check-in log</div>
      {entries.map(e => (
        <div key={e.id} style={s.logEntry}>
          <div style={s.logLeft}>
            <span style={{ ...s.logResponse, color: responseColor[e.response] }}>
              {responseLabel[e.response]}
            </span>
            {e.anchors?.label && (
              <span style={{ ...s.logAnchor, color: e.anchors.color }}>
                {e.anchors.label}
              </span>
            )}
            {e.note && <span style={s.logNote}>"{e.note}"</span>}
          </div>
          <span style={s.logTime}>
            {new Date(e.fired_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' '}
            {new Date(e.fired_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = {
  root: {
    minHeight: '100svh', background: '#0a0a0f', color: '#e2e2f0',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 20px 10px', borderBottom: '1px solid #1e1e2e'
  },
  wordmark: { display: 'flex', alignItems: 'center', gap: 8 },
  logo: { fontSize: 22, color: '#7c3aed' },
  appName: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#e2e2f0' },
  clockPill: {
    background: '#1e1e2e', borderRadius: 20, padding: '5px 14px',
    fontSize: 13, color: '#7c7a96', fontVariantNumeric: 'tabular-nums'
  },
  nudge: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px', background: '#1a0f1f', borderBottom: '1px solid #2a1a3e',
    fontSize: 13, color: '#c4c4dc'
  },
  nudgeBtn: {
    padding: '5px 14px', borderRadius: 6, background: '#7c3aed',
    border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer'
  },
  content: { flex: 1, overflowY: 'auto', paddingBottom: 80 },
  section: { padding: '12px 20px' },
  rule: { height: 1, background: '#1e1e2e', margin: '0 20px' },
  tabBar: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480, display: 'flex',
    background: '#0a0a0f', borderTop: '1px solid #1e1e2e',
    padding: '8px 0 calc(8px + env(safe-area-inset-bottom, 0px))'
  },
  tabBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 3, background: 'none', border: 'none', color: '#3d3d55',
    fontSize: 18, cursor: 'pointer', padding: '6px 0', transition: 'color 0.2s'
  },
  tabActive: { color: '#a78bfa' },
  tabLabel: { fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' },
  boundaryWrap: { marginTop: 24, padding: '14px 12px', background: '#0f0f14', borderRadius: 10, border: '1px solid #1e1e2e' },
  boundaryTitle: { fontSize: 13, color: '#7c7a96', marginBottom: 10 },
  boundaryRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  boundaryLabel: { fontSize: 12, color: '#4c4c6d' },
  timeInput: { background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: 6, color: '#e2e2f0', padding: '6px 10px', fontSize: 13 },
  saveBtn: { padding: '6px 14px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' },
  loading: { color: '#3d3d55', padding: 20, fontSize: 13 },
  empty: { color: '#3d3d55', fontSize: 13, fontStyle: 'italic', padding: 20 },
  logEntry: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #1e1e2e' },
  logLeft: { display: 'flex', flexDirection: 'column', gap: 3 },
  logResponse: { fontSize: 13, fontWeight: 600 },
  logAnchor: { fontSize: 11 },
  logNote: { fontSize: 11, color: '#7c7a96', fontStyle: 'italic' },
  logTime: { fontSize: 11, color: '#4c4c6d', whiteSpace: 'nowrap', paddingLeft: 12 }
}
