// ── jobStore.ts ─────────────────────────────────────────────────────────────
// Tiny in-memory pub/sub so GridBrowser can emit jobs the Job Board reads.

export type Job = {
  id: string
  title: string
  corp: string
  pay: string
  source: string       // which URL spawned this job
  accepted: boolean
}

type Listener = (jobs: Job[]) => void

const _jobs: Job[] = []
const _listeners = new Set<Listener>()

export function getJobs(): Job[] {
  return [..._jobs]
}

export function addJob(job: Omit<Job, 'id' | 'accepted'>) {
  // de-duplicate by source URL
  if (_jobs.some(j => j.source === job.source)) return
  _jobs.push({ ...job, id: crypto.randomUUID(), accepted: false })
  _notify()
}

export function acceptJob(id: string) {
  const j = _jobs.find(j => j.id === id)
  if (j) { j.accepted = true; _notify() }
}

export function subscribe(fn: Listener): () => void {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

function _notify() {
  const snapshot = getJobs()
  _listeners.forEach(fn => fn(snapshot))
}
