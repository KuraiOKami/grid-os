// ── jobStore.ts ─────────────────────────────────────────────────────────────
// Tiny in-memory pub/sub so GridBrowser can emit jobs the Job Board reads.
// Jobs have an optional type, payAmount (for auto-credit on completion),
// and a completed flag set by gameplay systems (Terminal, WatchApp, etc).

export type JobType = 'hack' | 'audit' | 'courier' | 'generic'

export type Job = {
  id:          string
  type?:       JobType
  title:       string
  corp:        string
  pay:         string       // display string, e.g. "₳ 250"
  payAmount?:  number       // numeric value for auto-credit on completion
  source:      string
  briefing?:   string       // optional instruction text shown in job card
  accepted:    boolean
  completed?:  boolean
}

type Listener = (jobs: Job[]) => void

const _jobs: Job[] = [
  // ── Tutorial hack job — pre-seeded so new players see it immediately ─────
  {
    id:         'tutorial-hack-01',
    type:       'hack',
    title:      'Relay Node Data Retrieval',
    corp:       'Anonymous // PHX Referral',
    pay:        '₳ 250',
    payAmount:  250,
    source:     'internal',
    briefing:   'Node r114 is unsecured. Use the Terminal: scan → connect r114 → exfil data_packet.bin',
    accepted:   false,
    completed:  false,
  },
]

const _listeners = new Set<Listener>()

export function getJobs(): Job[] {
  return [..._jobs]
}

export function addJob(job: Omit<Job, 'id' | 'accepted'>) {
  if (_jobs.some(j => j.source === job.source)) return
  _jobs.push({ ...job, id: crypto.randomUUID(), accepted: false })
  _notify()
}

export function acceptJob(id: string) {
  const j = _jobs.find(j => j.id === id)
  if (j) { j.accepted = true; _notify() }
}

export function completeJob(id: string) {
  const j = _jobs.find(j => j.id === id)
  if (j) { j.completed = true; _notify() }
}

export function getJob(id: string): Job | undefined {
  return _jobs.find(j => j.id === id)
}

export function subscribe(fn: Listener): () => void {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

function _notify() {
  const snapshot = getJobs()
  _listeners.forEach(fn => fn(snapshot))
}
