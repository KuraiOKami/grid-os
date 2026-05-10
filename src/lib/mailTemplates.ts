// ── mailTemplates.ts ────────────────────────────────────────────────────────
// Fetches email content from the Supabase `mail_templates` table.
// All story email bodies, subjects, senders, and metadata live in the DB.
// Game code only needs to call fetchMailTemplate(storyId) — no hardcoded content.

import { supabase } from './supabase'
import type { Mail } from '../store/mailStore'

// Shape returned by Supabase (snake_case columns → camelCase)
export interface MailTemplate {
  storyId: string
  tag: Mail['tag']
  from: string
  subject: string
  dot?: string
  watchCode?: string
  body: string
}

// Fetch a single mail template by its story_id.
// Returns null if not found or on error.
export async function fetchMailTemplate(
  storyId: string
): Promise<MailTemplate | null> {
  const { data, error } = await supabase
    .from('mail_templates')
    .select('story_id, tag, from_address, subject, dot, watch_code, body')
    .eq('story_id', storyId)
    .single()

  if (error || !data) {
    console.warn(`[mailTemplates] Could not fetch template "${storyId}":`, error?.message)
    return null
  }

  return {
    storyId:   data.story_id,
    tag:       data.tag as Mail['tag'],
    from:      data.from_address,
    subject:   data.subject,
    dot:       data.dot ?? undefined,
    watchCode: data.watch_code ?? undefined,
    body:      data.body,
  }
}

// Fetch multiple templates at once (e.g. boot sequence).
// Returns a Record keyed by story_id for O(1) lookup.
export async function fetchMailTemplates(
  storyIds: string[]
): Promise<Record<string, MailTemplate>> {
  const { data, error } = await supabase
    .from('mail_templates')
    .select('story_id, tag, from_address, subject, dot, watch_code, body')
    .in('story_id', storyIds)

  if (error || !data) {
    console.warn('[mailTemplates] Bulk fetch failed:', error?.message)
    return {}
  }

  return Object.fromEntries(
    data.map(row => [
      row.story_id,
      {
        storyId:   row.story_id,
        tag:       row.tag as Mail['tag'],
        from:      row.from_address,
        subject:   row.subject,
        dot:       row.dot ?? undefined,
        watchCode: row.watch_code ?? undefined,
        body:      row.body,
      } satisfies MailTemplate,
    ])
  )
}
