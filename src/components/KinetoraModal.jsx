import { useState } from 'react'
import { logCheckin } from '../lib/supabase'

// ── KinetoraModal ──────────────────────────────────────────────────────────────
// Shows when a check-in fires. Tells user where they are in the day
// and what the next anchor is so the interruption has a direction.
//
// Props:
//   currentAnchor — { id, label, color } or null
//   nextAnchor    — { id, label, time, color } or null
//   onClose       — called when modal is dismissed (any response)

const formatTime = (hhmm) => {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const REDIRECT_PROMPTS = {
  Peak:   "What's the one cognitive thing that matters most right now?",
  Midday: "What's been sitting undone that takes under 10 minutes?",
  Move:   "Has your body moved today? Even 5 minutes counts.",
  Wind:   "What's one thing you can close before tomorrow?",
  Dark:   "What does tomorrow-you need to know right now?",
}
const getRedirectPrompt = (label) => REDIRECT_PROMPTS[label] || 'One small thing. Start there.'

export default function KinetoraModal({ currentAnchor, nextAnchor, onClose }) {
  const [note, setNote] = useState('')
  const [phase, setPhase] = useState('question') // 'question' | 'redirect'

  const respond = async (response) => {
    await logCheckin(response, currentAnchor?.id || null, note || null)
    if (response === 'redirect') {
      setPhase('redirect')
    } else {
      onClose()
    }
  }

  if (phase === 'redirect') {
    return (
      <div style={s.overlay}>
        <div style={s.modal}>
          <div style={s.symbol}>⬡</div>
          <div style={s.heading}>Kinetora</div>
          <p style={s.redirect}>
            {nextAnchor
              ? <>Next: <span style={{ color: nextAnchor.color, fontWeight: 700 }}>{nextAnchor.label}</span> at {formatTime(nextAnchor.time)}</>
              : 'The day is open.'}
          </p>
          <p style={s.promptLine}>{getRedirectPrompt(currentAnchor?.label)}</p>
          <button style={s.okBtn} onClick={onClose}>ok</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.symbol}>⏸</div>
        <div style={s.heading}>Surface check</div>

        {currentAnchor ? (
          <p style={s.contextLine}>
            You're in <span style={{ color: currentAnchor.color, fontWeight: 700 }}>{currentAnchor.label}</span>
          </p>
        ) : (
          <p style={s.contextLine}>Where are you right now?</p>
        )}

        <p style={s.question}>Is what you're doing intentional?</p>

        {/* Optional note */}
        <input
          style={s.noteInput}
          placeholder="note to self (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={120}
        />

        <div style={s.btnRow}>
          <button style={s.yesBtn} onClick={() => respond('intentional')}>
            yes, on purpose
          </button>
          <button style={s.noBtn} onClick={() => respond('redirect')}>
            no — redirect me
          </button>
        </div>

        <button style={s.dismissBtn} onClick={() => respond('dismissed')}>
          not now
        </button>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(4px)'
  },
  modal: {
    background: '#0f0f14', border: '1px solid #2a2a3e', borderRadius: 18,
    padding: '32px 28px', maxWidth: 340, width: '90%', textAlign: 'center',
    boxShadow: '0 0 40px #7c3aed33'
  },
  symbol: { fontSize: 32, marginBottom: 8 },
  heading: { fontSize: 18, fontWeight: 700, color: '#e2e2f0', marginBottom: 12, letterSpacing: '0.05em' },
  contextLine: { fontSize: 13, color: '#7c7a96', marginBottom: 8 },
  question: { fontSize: 16, color: '#c4c4dc', marginBottom: 16, lineHeight: 1.4 },
  redirect: { fontSize: 16, color: '#c4c4dc', marginBottom: 8, lineHeight: 1.5 },
  promptLine: { fontSize: 14, color: '#a78bfa', fontStyle: 'italic', marginBottom: 20, lineHeight: 1.5 },
  subtext: { fontSize: 13, color: '#7c7a96', marginBottom: 20 },
  noteInput: {
    width: '100%', background: '#1e1e2e', border: '1px solid #2a2a3e',
    borderRadius: 8, color: '#c4c4dc', padding: '9px 12px', fontSize: 13,
    outline: 'none', marginBottom: 16, boxSizing: 'border-box'
  },
  btnRow: { display: 'flex', gap: 10, marginBottom: 10 },
  yesBtn: {
    flex: 1, padding: '12px 8px', borderRadius: 10, border: '1px solid #7c3aed',
    background: 'transparent', color: '#a78bfa', fontSize: 13, fontWeight: 600,
    cursor: 'pointer'
  },
  noBtn: {
    flex: 1, padding: '12px 8px', borderRadius: 10, border: 'none',
    background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600,
    cursor: 'pointer'
  },
  dismissBtn: {
    background: 'none', border: 'none', color: '#3d3d55', fontSize: 12,
    cursor: 'pointer', padding: '4px 8px'
  },
  okBtn: {
    padding: '12px 40px', borderRadius: 10, border: 'none',
    background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', marginTop: 8
  }
}
