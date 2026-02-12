import { useState } from 'react'
import { addShelfItem, markShelfItemDone, togglePin } from '../lib/supabase'

const formatDue = (dueTime) => {
  if (!dueTime) return null
  const [h, m] = dueTime.split(':').map(Number)
  const now = new Date()
  const due = new Date()
  due.setHours(h, m, 0, 0)
  const diffMs = due - now
  const diffMins = Math.round(diffMs / 60000)
  if (diffMins < 0) return { label: 'past due', urgent: true }
  if (diffMins < 60) return { label: `${diffMins}m`, urgent: diffMins < 30 }
  return { label: `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`, urgent: false }
}

// ── ShelfItem ──────────────────────────────────────────────────────────────────
function ShelfItem({ item, onDone, onPin }) {
  const due = item.due_time ? formatDue(item.due_time) : null

  return (
    <div style={{
      ...s.item,
      borderColor: item.pinned ? '#7c3aed' : '#1e1e2e',
      background: due?.urgent ? '#1a0f1f' : '#0f0f14'
    }}>
      <button style={s.doneBtn} onClick={() => onDone(item.id)} title="Mark done">
        <div style={s.circle} />
      </button>

      <div style={s.itemBody}>
        <span style={s.itemText}>{item.text}</span>
        {due && (
          <span style={{ ...s.due, color: due.urgent ? '#f87171' : '#a78bfa' }}>
            {due.urgent && '⚠ '}{due.label}
          </span>
        )}
      </div>

      <button
        style={{ ...s.pinBtn, color: item.pinned ? '#7c3aed' : '#3d3d55' }}
        onClick={() => onPin(item.id, item.pinned)}
        title={item.pinned ? 'Unpin' : 'Pin — keep visible'}
      >
        ⬡
      </button>
    </div>
  )
}

// ── AddItemRow ─────────────────────────────────────────────────────────────────
function AddItemRow({ onAdd }) {
  const [text, setText] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [expanded, setExpanded] = useState(false)

  const submit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    await onAdd(trimmed, dueTime || null)
    setText('')
    setDueTime('')
    setExpanded(false)
  }

  return (
    <div style={s.addWrap}>
      <div style={s.addRow}>
        <input
          style={s.input}
          placeholder="Surface something…"
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <button style={s.addBtn} onClick={submit}>+</button>
      </div>
      {expanded && (
        <div style={s.dueRow}>
          <label style={s.dueLabel}>Due time (optional)</label>
          <input
            type="time"
            style={s.timeInput}
            value={dueTime}
            onChange={e => setDueTime(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

// ── Shelf ──────────────────────────────────────────────────────────────────────
export default function Shelf({ items, onRefresh }) {
  const pinned = items.filter(i => i.pinned)
  const unpinned = items.filter(i => !i.pinned)

  const handleAdd = async (text, dueTime) => {
    await addShelfItem(text, dueTime)
    onRefresh()
  }

  const handleDone = async (id) => {
    await markShelfItemDone(id)
    onRefresh()
  }

  const handlePin = async (id, pinned) => {
    await togglePin(id, pinned)
    onRefresh()
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.title}>Surface</span>
        <span style={s.subtitle}>things that exist right now</span>
      </div>

      {items.length === 0 && (
        <div style={s.empty}>nothing surfaced — add something real</div>
      )}

      {pinned.length > 0 && (
        <div style={s.group}>
          {pinned.map(item => (
            <ShelfItem key={item.id} item={item} onDone={handleDone} onPin={handlePin} />
          ))}
        </div>
      )}

      {pinned.length > 0 && unpinned.length > 0 && <div style={s.divider} />}

      {unpinned.map(item => (
        <ShelfItem key={item.id} item={item} onDone={handleDone} onPin={handlePin} />
      ))}

      <AddItemRow onAdd={handleAdd} />
    </div>
  )
}

const s = {
  wrap: { padding: '8px 0' },
  header: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: 700, color: '#e2e2f0' },
  subtitle: { fontSize: 11, color: '#4c4c6d', letterSpacing: '0.04em' },
  empty: { fontSize: 13, color: '#3d3d55', padding: '12px 0', fontStyle: 'italic' },
  group: { marginBottom: 6 },
  divider: { height: 1, background: '#1e1e2e', margin: '8px 0' },
  item: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 10, marginBottom: 6, border: '1px solid', transition: 'border-color 0.2s'
  },
  doneBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 },
  circle: { width: 18, height: 18, borderRadius: '50%', border: '2px solid #3d3d55' },
  itemBody: { flex: 1, minWidth: 0 },
  itemText: { fontSize: 14, color: '#c4c4dc', display: 'block', wordBreak: 'break-word' },
  due: { fontSize: 11, fontWeight: 600, marginTop: 2, display: 'block' },
  pinBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: 2 },
  addWrap: { marginTop: 10 },
  addRow: { display: 'flex', gap: 8 },
  input: {
    flex: 1, background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: 8,
    color: '#e2e2f0', padding: '10px 12px', fontSize: 14, outline: 'none'
  },
  addBtn: {
    width: 38, height: 38, background: '#7c3aed', border: 'none', borderRadius: 8,
    color: '#fff', fontSize: 22, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  dueRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 },
  dueLabel: { fontSize: 12, color: '#7c7a96' },
  timeInput: {
    background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: 6,
    color: '#e2e2f0', padding: '6px 10px', fontSize: 13
  }
}
