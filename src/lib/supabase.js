import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
)

// ── Anchors ────────────────────────────────────────────────────────────────────
export const getAnchors = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('anchors').select('*').eq('user_id', user.id)
    .eq('active', true).order('time')
  if (error) throw error
  return data
}

export const addAnchor = async (label, time, color = '#a78bfa', note = null) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('anchors').insert({ user_id: user.id, label, time, color, note }).select().single()
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

// ── Seed Biological Defaults ───────────────────────────────────────────────────
const BIOLOGICAL_DEFAULTS = [
  { label: 'Rise',   time: '09:00', color: '#fbbf24', note: 'Cortisol peak — light start' },
  { label: 'Peak',   time: '10:30', color: '#34d399', note: 'Alertness highest — deep work' },
  { label: 'Midday', time: '13:00', color: '#60a5fa', note: 'Coordination — admin & replies' },
  { label: 'Move',   time: '17:00', color: '#f472b6', note: 'Physical peak — body first' },
  { label: 'Wind',   time: '20:30', color: '#a78bfa', note: 'Closing loops — surface tomorrow' },
  { label: 'Dark',   time: '21:30', color: '#7c7a96', note: 'Melatonin active — screens down' },
]

export const seedDefaultAnchors = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { count, error: countErr } = await supabase
    .from('anchors').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('active', true)
  if (countErr) throw countErr
  if (count > 0) return // already has anchors — don't seed

  const rows = BIOLOGICAL_DEFAULTS.map(a => ({ user_id: user.id, ...a }))
  const { error } = await supabase.from('anchors').insert(rows)
  if (error) throw error
}

// ── Shelf Items ────────────────────────────────────────────────────────────────
export const getShelfItems = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('shelf_items').select('*').eq('user_id', user.id)
    .eq('done', false).order('pinned', { ascending: false }).order('created_at')
  if (error) throw error
  return data
}

export const addShelfItem = async (text, dueTime = null, pinned = false) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('shelf_items').insert({ user_id: user.id, text, due_time: dueTime, pinned }).select().single()
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('checkin_log').insert({ user_id: user.id, response, anchor_id: anchorId, note })
  if (error) throw error
}

export const getCheckinLog = async (limit = 40) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('checkin_log').select('*, anchors(label, color)')
    .eq('user_id', user.id).order('fired_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

// ── Settings ───────────────────────────────────────────────────────────────────
export const getSettings = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data } = await supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle()
  if (!data) {
    const defaults = { user_id: user.id, sound_enabled: true, day_start: '08:00', day_end: '22:00' }
    await supabase.from('settings').insert(defaults)
    return defaults
  }
  return data
}

export const saveSettings = async (changes) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  await supabase.from('settings')
    .upsert({ user_id: user.id, ...changes, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
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
