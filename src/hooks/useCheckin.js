import { useState, useEffect, useCallback, useRef } from 'react'
import { getAnchors, getSettings } from '../lib/supabase'

const toMins = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// ── useCheckin ─────────────────────────────────────────────────────────────────
// Manages the Kinetora check-in cycle.
//
// Returns:
//   showModal        — bool: whether to show the check-in modal
//   dismissModal     — fn: close the modal
//   currentAnchor    — anchor object for current time window (or null)
//   nextAnchor       — anchor object for next upcoming anchor (or null)
//   anchors          — all loaded anchors
//   refreshAnchors   — fn: reload anchors from Supabase
//   settings         — settings object

export function useCheckin() {
  const [anchors, setAnchors] = useState([])
  const [settings, setSettings] = useState({ day_start: '08:00', day_end: '22:00', sound_enabled: true })
  const [showModal, setShowModal] = useState(false)
  const alarmRef = useRef(null)
  const lastFireRef = useRef(null)

  const loadData = useCallback(async () => {
    const [a, s] = await Promise.all([getAnchors(), getSettings()])
    setAnchors(a || [])
    setSettings(s || { day_start: '08:00', day_end: '22:00', sound_enabled: true })
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Derived: current and next anchor based on right-now time
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes()

  const sorted = [...anchors].sort((a, b) => toMins(a.time) - toMins(b.time))

  const currentAnchor = (() => {
    let last = null
    for (const a of sorted) {
      if (toMins(a.time) <= nowMins) last = a
    }
    return last
  })()

  const nextAnchor = sorted.find(a => toMins(a.time) > nowMins) || null

  // ── Alarm scheduling ─────────────────────────────────────────────────────────
  // Fires a check-in at each anchor time. Checks every 60s.
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const h = now.getHours()
      const m = now.getMinutes()
      const key = `${h}:${String(m).padStart(2,'0')}`

      // Only fire once per minute key
      if (lastFireRef.current === key) return

      // Check if any anchor matches now (within the same minute)
      const match = anchors.find(a => a.time === key)
      if (match) {
        lastFireRef.current = key
        setShowModal(true)
        if (settings.sound_enabled) playChime()

        // Also send a browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('Ancoralis', {
            body: `${match.label} — surface check`,
            icon: '/icon-192.png',
            tag: 'ancoralis-checkin'
          })
        }
      }
    }

    alarmRef.current = setInterval(check, 60000)
    check() // run immediately on mount / anchor change
    return () => clearInterval(alarmRef.current)
  }, [anchors, settings.sound_enabled])

  const dismissModal = useCallback(() => setShowModal(false), [])

  return {
    showModal,
    dismissModal,
    currentAnchor,
    nextAnchor,
    anchors,
    refreshAnchors: loadData,
    settings
  }
}

// ── Chime ──────────────────────────────────────────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99] // C5 E5 G5 — soft major chord

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
      osc.start(t)
      osc.stop(t + 0.85)
    })
  } catch (_) {
    // Audio not available — silent fail
  }
}
