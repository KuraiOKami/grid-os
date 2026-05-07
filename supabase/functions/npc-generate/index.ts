// ── supabase/functions/npc-generate/index.ts ─────────────────────────────────
// Edge Function: NPC AI generation.
// The ONLY place the LLM API key is used. Never exposed to the client.
//
// Modes:
//   post  — generate a single social feed post
//   chat  — generate a conversation reply
//
// Required env vars (set in Supabase Dashboard → Settings → Edge Functions):
//   OPENAI_API_KEY  (or ANTHROPIC_API_KEY if you prefer Claude)
//
// To deploy:
//   supabase functions deploy npc-generate

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
const MODEL          = 'gpt-4o-mini'   // fast + cheap for NPC posts; upgrade to gpt-4o for conversations
const MAX_TOKENS_POST = 120
const MAX_TOKENS_CHAT = 300

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    const { mode, systemPrompt } = body

    if (!mode || !systemPrompt) {
      return _error('Missing required fields: mode, systemPrompt', 400)
    }

    let content: string | null = null

    if (mode === 'post') {
      // Single post generation
      const { userPrompt } = body
      if (!userPrompt) return _error('Missing userPrompt for post mode', 400)
      content = await _generatePost(systemPrompt, userPrompt)

    } else if (mode === 'chat') {
      // Conversation reply generation
      const { history, playerMessage } = body
      if (!playerMessage) return _error('Missing playerMessage for chat mode', 400)
      content = await _generateChat(systemPrompt, history ?? [], playerMessage)

    } else {
      return _error(`Unknown mode: ${mode}`, 400)
    }

    if (!content) return _error('LLM returned empty response', 500)

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )

  } catch (err) {
    console.error('[npc-generate] Error:', err)
    return _error('Internal server error', 500)
  }
})

// ── Post generation ───────────────────────────────────────────────────────────

async function _generatePost(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS_POST,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
    }),
  })

  if (!res.ok) {
    console.error('[npc-generate] OpenAI error:', await res.text())
    return null
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? null
}

// ── Chat reply generation ─────────────────────────────────────────────────────

async function _generateChat(
  systemPrompt:  string,
  history:       { role: string; content: string }[],
  playerMessage: string,
): Promise<string | null> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: playerMessage },
  ]

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS_CHAT,
      messages,
    }),
  })

  if (!res.ok) {
    console.error('[npc-generate] OpenAI error:', await res.text())
    return null
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _error(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  )
}
