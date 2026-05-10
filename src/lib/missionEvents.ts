// ── missionEvents.ts — global event bus for mission objective tracking ───────
// Any app calls MissionEvents.emit() when a player does something.
// missionStore subscribes and checks active objectives automatically.

export type MissionEvent =
  | { type: 'visit_url';       url: string }
  | { type: 'ops_scan';        target: string }
  | { type: 'ops_probe';       target: string; module: string }
  | { type: 'connect_node';    nodeId: string }
  | { type: 'exfil_file';      filename: string }
  | { type: 'run_command';     cmd: string }
  | { type: 'crack_file';      filename: string }
  | { type: 'relay_active';    hops: number }
  | { type: 'message_contact'; contactId: string }
  | { type: 'accept_job';      jobId: string }
  | { type: 'complete_job';    jobId: string }
  | { type: 'follow_handle';   handle: string }
  | { type: 'install_app';     appId: string }
  | { type: 'open_app';        appId: string }
  | { type: 'read_mail';       mailId: string }
  | { type: 'manual';          triggerId: string }

type Listener = (event: MissionEvent) => void
const _listeners = new Set<Listener>()

export const MissionEvents = {
  emit(event: MissionEvent) {
    _listeners.forEach(fn => fn(event))
  },
  on(fn: Listener): () => void {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
  },
}
