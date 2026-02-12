import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const UID = 'default'

// ── Anchors ────────────────────────────────────────────────────────────────────
export const getAnchors = async () => {
  const { data, error } = await supabase
    .from('anchors').select('*').eq('user_id', UID)
    .eq('active', true).order('time')
  if (error) throw error
  return data
}

export const addAnchor = async (label, time, color = '#a78bfa') => {
  const { data, error } = await supabase
    .from('anchors').insert({ user_id: UID, label, time, color }).select().single()
  if (error) throw error
  return data
}

export const updateAnchor = async (id, changes) => {
  const { error } = await supabase.from('anchors').update(changes).eq('id', id)
  if (error) throw error
}

export const deleteAnchor = async (id) => {
  const { error } = await supabase.from('anchors').update({ active: false }).eq('id', id)
  if (error) throw error
}

// ── Shelf Items ────────────────────────────────────────────────────────────────
export const getShelfItems = async () => {
  const { data, error } = await supabase
    .from('shelf_items').select('*').eq('user_id', UID)
    .eq('done', false).order('pinned', { ascending: false }).order('created_at')
  if (error) throw error
  return data
}

export const addShelfItem = async (text, dueTime = null, pinned = false) => {
  const { data, error } = await supabase
    .from('shelf_items').insert({ user_id: UID, text, due_time: dueTime, pinned }).select().single()
  if (error) throw error
  return data
}

export const markShelfItemDone = async (id) => {
  const { error } = await supabase.from('shelf_items').update({ done: true }).eq('id', id)
  if (error) throw error
}

export const togglePin = async (id, pinned) => {
  const { error } = await supabase.from('shelf_items').update({ pinned: !pinned }).eq('id', id)
  if (error) throw error
}

// ── Check-in Log ───────────────────────────────────────────────────────────────
export const logCheckin = async (response, anchorId = null, note = null) => {
  const { error } = await supabase
    .from('checkin_log').insert({ user_id: UID, response, anchor_id: anchorId, note })
  if (error) throw error
}

export const getCheckinLog = async (limit = 40) => {
  const { data, error } = await supabase
    .from('checkin_log').select('*, anchors(label, color)')
    .eq('user_id', UID).order('fired_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

// ── Settings ───────────────────────────────────────────────────────────────────
export const getSettings = async () => {
  const { data } = await supabase.from('settings').select('*').eq('user_id', UID).maybeSingle()
  if (!data) {
    const defaults = { user_id: UID, sound_enabled: true, day_start: '08:00', day_end: '22:00' }
    await supabase.from('settings').insert(defaults)
    return defaults
  }
  return data
}

export const saveSettings = async (changes) => {
  await supabase.from('settings')
    .upsert({ user_id: UID, ...changes, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
}

// ── Realtime ───────────────────────────────────────────────────────────────────
export const subscribeToAnchors = (cb) =>
  supabase.channel('anchors-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'anchors' }, cb)
    .subscribe()

export const subscribeToShelf = (cb) =>
  supabase.channel('shelf-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shelf_items' }, cb)
    .subscribe()
