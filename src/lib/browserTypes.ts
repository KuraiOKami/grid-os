// ── Supabase browser site types ─────────────────────────────────────────────
// These mirror the DB schema in the `sites` and `site_content` tables.
// The PAGES const in GridBrowser is the local fallback; live sites use these.

export type SiteTheme = 'corp' | 'news' | 'forum' | 'blog' | 'hidden' | 'void' | 'personal'
export type GateType  = 'compliance' | 'shadow' | 'unlocked'
export type ContentKind = 'body' | 'job' | 'link' | 'forum_post'

export interface SiteContentRow {
  id: string
  site_id: string
  kind: ContentKind
  sort_order: number
  // body
  body_text:    string | null
  // link
  link_label:   string | null
  link_url:     string | null
  // job
  job_title:    string | null
  job_corp:     string | null
  job_pay:      string | null
  job_action_id: string | null
  // forum_post
  post_author:  string | null
  post_handle:  string | null
  post_body:    string | null
  post_replies: number | null
  post_removed: boolean | null
  created_at:   string
  updated_at:   string
}

export interface SiteRow {
  id:             string
  slug:           string
  site_name:      string
  title:          string
  subtitle:       string | null
  theme:          SiteTheme
  gate_type:      GateType | null
  gate_min:       number   | null
  gate_key:       string   | null
  gate_hint:      string   | null
  rep_compliance: number
  rep_shadow:     number
  content:        SiteContentRow[] | null
}
