import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { SiteRow } from '@/lib/browserTypes'

type UseSiteResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'error'; message: string }
  | { status: 'ok'; site: SiteRow }

/**
 * Fetches a site by slug via the `get_site` RPC and subscribes to Realtime
 * changes on `site_content` for that site_id so forum posts / job listings
 * update live without a page reload.
 *
 * Usage:
 *   const result = useSite('yellowthread.forum')
 *   if (result.status === 'ok') { ... result.site ... }
 */
export function useSite(slug: string | null): UseSiteResult {
  const [result, setResult] = useState<UseSiteResult>({ status: 'idle' })
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!slug) {
      setResult({ status: 'idle' })
      return
    }

    let cancelled = false
    setResult({ status: 'loading' })

    async function load() {
      const { data, error } = await supabase.rpc('get_site', { p_slug: slug })

      if (cancelled) return

      if (error) {
        setResult({ status: 'error', message: error.message })
        return
      }

      if (!data || data.error === 'not_found') {
        setResult({ status: 'not_found' })
        return
      }

      const site = data as SiteRow
      setResult({ status: 'ok', site })

      // ── Realtime subscription ──────────────────────────────────────────────
      // Subscribe to INSERT / UPDATE / DELETE on site_content rows that belong
      // to this site_id. When the DB changes (e.g. a new forum post, a job
      // listing flipped to FILLED), we re-fetch the full site in one RPC call
      // so the component always renders from a single coherent snapshot.
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }

      const channel = supabase
        .channel(`site_content:${site.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'site_content',
            filter: `site_id=eq.${site.id}`,
          },
          async () => {
            // Re-fetch on any change — keeps snapshot coherent.
            const { data: refreshed } = await supabase.rpc('get_site', { p_slug: slug })
            if (!cancelled && refreshed && !refreshed.error) {
              setResult({ status: 'ok', site: refreshed as SiteRow })
            }
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    load()

    return () => {
      cancelled = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [slug])

  return result
}
