import { useState } from 'react'
import { addAnchor, updateAnchor, deleteAnchor } from '../lib/supabase'

const COLORS = ['#a78bfa','#f472b6','#34d399','#fbbf24','#60a5fa','#fb923c','#e879f9','#4ade80']

const formatTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}

// ── Single editable anchor row ─────────────────────────────────────────────────
function AnchorRow({ anchor, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(anchor.label)
  const [time, setTime] = useState(anchor.time)
  const [color, setColor] = useState(anchor.color)

  const save = async () => {
    await onUpdate(anchor.id, { label, time, color })
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={s.rowEdit}>
        <div style={s.editFields}>
          <input
            style={s.labelInput}
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Label"
            maxLength={24}
          />
          <input
            type="time"
            style={s.timeInput}
            value={time}
            onChange={e => setTime(e.target.value)}
          />
        </div>
        <div style={s.colorRow}>
          {COLORS.map(c => (
            <button
              key={c}
              style={{ ...s.colorSwatch, background: c, outline: c === color ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div style={s.editBtns}>
          <button style={s.saveBtn} onClick={save}>save</button>
          <button style={s.cancelBtn} onClick={() => setEditing(false)}>cancel</button>
          <button style={s.deleteBtn} onClick={() => onDelete(anchor.id)}>delete</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.row} onClick={() => setEditing(true)}>
      <div style={{ ...s.dot, background: anchor.color, boxShadow: `0 0 6px ${anchor.color}88` }} />
      <div style={s.rowContent}>
        <span style={s.rowLabel}>{anchor.label}</span>
        {anchor.note && <span style={s.rowNote}>{anchor.note}</span>}
      </div>
      <span style={s.rowTime}>{formatTime(anchor.time)}</span>
      <span style={s.editHint}>tap to edit</span>
    </div>
  )
}

// ── AddAnchorForm ──────────────────────────────────────────────────────────────
function AddAnchorForm({ onAdd, onCancel }) {
  const [label, setLabel] = useState('')
  const [time, setTime] = useState('12:00')
  const [color, setColor] = useState('#a78bfa')

  const submit = async () => {
    if (!label.trim()) return
    await onAdd(label.trim(), time, color)
    setLabel('')
    setTime('12:00')
    setColor('#a78bfa')
    onCancel()
  }

  return (
    <div style={s.rowEdit}>
      <div style={s.editFields}>
        <input
          style={s.labelInput}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Anchor name (e.g. Morning)"
          maxLength={24}
          autoFocus
        />
        <input
          type="time"
          style={s.timeInput}
          value={time}
          onChange={e => setTime(e.target.value)}
        />
      </div>
      <div style={s.colorRow}>
        {COLORS.map(c => (
          <button
            key={c}
            style={{ ...s.colorSwatch, background: c, outline: c === color ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <div style={s.editBtns}>
        <button style={s.saveBtn} onClick={submit}>add</button>
        <button style={s.cancelBtn} onClick={onCancel}>cancel</button>
      </div>
    </div>
  )
}

// ── AnchorEditor ───────────────────────────────────────────────────────────────
export default function AnchorEditor({ anchors, onRefresh }) {
  const [adding, setAdding] = useState(false)

  const handleAdd = async (label, time, color) => {
    await addAnchor(label, time, color)
    onRefresh()
  }

  const handleUpdate = async (id, changes) => {
    await updateAnchor(id, changes)
    onRefresh()
  }

  const handleDelete = async (id) => {
    await deleteAnchor(id)
    onRefresh()
  }

  const sorted = [...anchors].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.title}>Anchors</span>
        <span style={s.subtitle}>shape of your day</span>
      </div>

      {sorted.length === 0 && !adding && (
        <p style={s.empty}>No anchors yet — add one to give your day shape</p>
      )}

      {sorted.map(a => (
        <AnchorRow
          key={a.id}
          anchor={a}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      ))}

      {adding
        ? <AddAnchorForm onAdd={handleAdd} onCancel={() => setAdding(false)} />
        : (
          <button style={s.addBtn} onClick={() => setAdding(true)}>
            + add anchor
          </button>
        )
      }
    </div>
  )
}

const s = {
  wrap: { padding: '8px 0' },
  header: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: 700, color: '#e2e2f0' },
  subtitle: { fontSize: 11, color: '#4c4c6d', letterSpacing: '0.04em' },
  empty: { fontSize: 13, color: '#3d3d55', fontStyle: 'italic', marginBottom: 12 },
  row: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 10, marginBottom: 6, background: '#0f0f14',
    border: '1px solid #1e1e2e', cursor: 'pointer'
  },
  dot: { width: 12, height: 12, borderRadius: '50%', flexShrink: 0 },
  rowLabel: { flex: 1, fontSize: 14, color: '#c4c4dc' },
  rowNote: { fontSize: 11, color: '#4c4c6d', fontStyle: 'italic' },
  rowContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  rowTime: { fontSize: 12, color: '#7c7a96' },
  editHint: { fontSize: 10, color: '#2a2a3e' },
  rowEdit: {
    padding: '14px 12px', borderRadius: 10, marginBottom: 6,
    background: '#0f0f14', border: '1px solid #7c3aed'
  },
  editFields: { display: 'flex', gap: 8, marginBottom: 10 },
  labelInput: {
    flex: 1, background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: 6,
    color: '#e2e2f0', padding: '8px 10px', fontSize: 13, outline: 'none'
  },
  timeInput: {
    background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: 6,
    color: '#e2e2f0', padding: '8px 10px', fontSize: 13
  },
  colorRow: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  colorSwatch: { width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer' },
  editBtns: { display: 'flex', gap: 8 },
  saveBtn: {
    padding: '7px 16px', borderRadius: 7, background: '#7c3aed',
    color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer'
  },
  cancelBtn: {
    padding: '7px 16px', borderRadius: 7, background: 'transparent',
    color: '#7c7a96', border: '1px solid #2a2a3e', fontSize: 13, cursor: 'pointer'
  },
  deleteBtn: {
    padding: '7px 16px', borderRadius: 7, background: 'transparent',
    color: '#f87171', border: '1px solid #3d1515', fontSize: 13, cursor: 'pointer',
    marginLeft: 'auto'
  },
  addBtn: {
    width: '100%', padding: '10px', borderRadius: 10, background: 'transparent',
    color: '#7c7a96', border: '1px dashed #2a2a3e', fontSize: 13,
    cursor: 'pointer', marginTop: 4
  }
}
