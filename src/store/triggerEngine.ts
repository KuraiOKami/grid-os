// ── triggerEngine.ts ──────────────────────────────────────────────────────────
// Story trigger evaluation. Called after every meaningful player action.
// Checks state, fires side effects (mission activation, email queuing,
// rep changes, flag setting, file drops).
//
// This is the ONLY place that reads story conditions and writes side effects.
// Stores are source of truth; this file is the rule book.
//
// Call checkTriggers() after:
//   - Any page navigation (pass 'page_visit', url)
//   - Any email read    (pass 'email_read', emailId)
//   - Any job completed (pass 'job_complete', jobId)
//   - Any file opened   (pass 'file_read', path)
//   - Any rep change    (call directly, no args needed)

import { useStoryStore }       from './storyStore'
import { useMissionStore }     from './missionStore'
import { useEmailQueueStore, BOOT_EMAILS } from './emailQueue'
import { useRepStore }         from './reputationStore'
import { useMailStore }        from './mailStore'
import { useFSStore } from './fsStore'

function fsAddFile(name: string, content: string) {
  useFSStore.getState().writeFile(['home', 'citizen', name], content)
}

const MINUTE = 60_000

// ── Types ─────────────────────────────────────────────────────────────────────

export type TriggerEvent =
  | { type: 'page_visit';   url:     string }
  | { type: 'email_read';   emailId: string }
  | { type: 'job_complete'; jobId:   string }
  | { type: 'file_read';    path:    string }
  | { type: 'rep_change' }
  | { type: 'game_start' }

// ── Main entry point ──────────────────────────────────────────────────────────

export function checkTriggers(event: TriggerEvent) {
  const story    = useStoryStore.getState()
  const missions = useMissionStore.getState()
  const queue    = useEmailQueueStore.getState()
  const rep      = useRepStore.getState()

  switch (event.type) {
    case 'game_start':    _onGameStart(story, missions, queue);          break
    case 'email_read':    _onEmailRead(event.emailId, story, missions, queue); break
    case 'page_visit':    _onPageVisit(event.url, story, missions, rep); break
    case 'job_complete':  _onJobComplete(event.jobId, story, missions, queue, rep); break
    case 'file_read':     _onFileRead(event.path, story, missions);      break
    case 'rep_change':    _onRepChange(story, queue, rep);               break
  }

  // Always re-evaluate phase advancement after any trigger
  _checkPhaseAdvancement(story)
}

// ── game_start ────────────────────────────────────────────────────────────────
// Phase 0.1: queue E-01 immediately.
// M-01 becomes active on first game start.

function _onGameStart(
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
  queue:    ReturnType<typeof useEmailQueueStore.getState>,
) {
  if (story.getMission('M-01') !== 'inactive') return  // already started

  // Activate M-01
  missions.setMissionStatus('M-01', 'active')
  story.setMission('M-01', 'active')

  // Phase 0.1 — deliver E-01 immediately
  queue.queueEmail({
    deliverAt: Date.now(),
    mail:      { ...BOOT_EMAILS['E-01'], storyId: 'E-01' } as any,
  })
}

// ── email_read ────────────────────────────────────────────────────────────────

function _onEmailRead(
  emailId:  string,
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
  queue:    ReturnType<typeof useEmailQueueStore.getState>,
) {
  // ── Phase 0.2: E-01 read → queue E-02 after 2 min (once only) ───────────
  if (emailId === 'E-01') {
    const alreadySent   = useMailStore.getState().mails.some(m => m.storyId === 'E-02')
    const alreadyQueued = queue.queue.some(q => (q.mail as any).storyId === 'E-02')
    if (!alreadySent && !alreadyQueued) {
      queue.queueEmail({
        deliverAt: Date.now() + 2 * MINUTE,
        mail:      { ...BOOT_EMAILS['E-02'], storyId: 'E-02' } as any,
      })
    }
  }

  // ── Phase 0.3: E-02 read → activate M-02 (once only) ────────────────────
  if (emailId === 'E-02') {
    if (story.getMission('M-02') === 'inactive') {
      missions.setMissionStatus('M-02', 'active')
      story.setMission('M-02', 'active')
    }
  }

  // ── Phase 0.5: E-03 read → queue E-04 after 5 min (once only) ───────────
  if (emailId === 'E-03') {
    const alreadySent   = useMailStore.getState().mails.some(m => m.storyId === 'E-04')
    const alreadyQueued = queue.queue.some(q => (q.mail as any).storyId === 'E-04')
    if (!alreadySent && !alreadyQueued) {
      queue.queueEmail({
        deliverAt: Date.now() + 5 * MINUTE,
        mail:      { ...BOOT_EMAILS['E-04'], storyId: 'E-04' } as any,
      })
    }
  }

  // ── M-01 objective 2: track onboarding emails read ───────────────────────
  // Objective completes when E-01 through E-04 all read (checked below)
  const ONBOARDING_EMAIL_IDS = ['E-01', 'E-02', 'E-03', 'E-04']
  if (ONBOARDING_EMAIL_IDS.includes(emailId)) {
    _checkM01Objective2(story, missions)
  }

  // ── Phase 2.3: E-10 read → activate M-03 (once only) ───────────────────
  if (emailId === 'E-10' && !story.hasFlag('UNDERGROUND_CONTACT_MADE')) {
    story.setFlag('UNDERGROUND_CONTACT_MADE')
    if (story.getMission('M-03') === 'inactive') {
      missions.setMissionStatus('M-03', 'active')
      story.setMission('M-03', 'active')
    }
  }
}

// ── page_visit ────────────────────────────────────────────────────────────────

function _onPageVisit(
  url:      string,
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
  rep:      ReturnType<typeof useRepStore.getState>,
) {
  story.recordPageVisit(url)

  // ── M-01 objective 1: visited gridos.corp ────────────────────────────────
  if (url === 'gridos.corp' && story.getMission('M-01') === 'active') {
    missions.setObjectiveComplete('M-01', 'M01-OBJ-1')
    _checkM01Completion(story, missions)
  }

  // ── Phase 1 — SECTOR7_SUSPECTED flag triggers ────────────────────────────
  const SECTOR7_PAGES = [
    'yellowthread.forum',
    'ghostlily.blog/root-bloom',
    'pulse.news/outages',
    'gridnetnews.com/sector7',
  ]
  if (SECTOR7_PAGES.includes(url) && !story.hasFlag('SECTOR7_SUSPECTED')) {
    story.setFlag('SECTOR7_SUSPECTED')
    // E-10 queued 45 min after flag set — the underground reaches out
    useEmailQueueStore.getState().queueEmail({
      deliverAt: Date.now() + 45 * MINUTE,
      mail:      { ...BOOT_EMAILS['E-10'], storyId: 'E-10' } as any,
    })
  }

  // ── M-03 objective 1: visited Gridcorp intranet ───────────────────────────
  const INTRANET_PAGES = ['gridos.corp/internal', 'gridos.corp/compliance']
  if (INTRANET_PAGES.includes(url) && story.getMission('M-03') === 'active') {
    missions.setObjectiveComplete('M-03', 'M03-OBJ-1')
    _checkM03Completion(story, missions, rep)
  }

  // ── OVERSEER pressure: intranet page visit ───────────────────────────────
  if (url === 'gridos.corp/internal') {
    story.adjustOverseer(+3)
    // compliance gate: if compliance >= 65, intranet is accessible — no extra penalty
    if (rep.compliance >= 65) {
      story.adjustOverseer(-3)  // net zero if legitimately accessed
    }
  }

  // ── OVERSEER pressure: other underground pages ────────────────────────────
  if (url.startsWith('voidbay.net'))   story.adjustOverseer(+5)
  if (url.startsWith('splice.onion'))  story.adjustOverseer(+8)
  if (url.startsWith('vault.archive')) story.adjustOverseer(+10)
}

// ── job_complete ──────────────────────────────────────────────────────────────

function _onJobComplete(
  jobId:    string,
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
  queue:    ReturnType<typeof useEmailQueueStore.getState>,
  rep:      ReturnType<typeof useRepStore.getState>,
) {
  story.recordJobComplete(jobId)

  // ── M-02 objective 1: any job completed ───────────────────────────────────
  if (story.getMission('M-02') === 'active') {
    missions.setObjectiveComplete('M-02', 'M02-OBJ-1')
    _completeMission02(story, missions)
  }

  // ── Phase 0.6: first job done → phase 1 entry (handled by phase check) ───
  // Phase advancement is checked at the end of checkTriggers()
}

// ── file_read ─────────────────────────────────────────────────────────────────

function _onFileRead(
  path:     string,
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
) {
  story.recordFileRead(path)

  // ── M-01 objective 3: home directory viewed ───────────────────────────────
  if (path === '~/' && story.getMission('M-01') === 'active') {
    missions.setObjectiveComplete('M-01', 'M01-OBJ-3')
    _checkM01Completion(story, missions)
  }
}

// ── rep_change ────────────────────────────────────────────────────────────────

function _onRepChange(
  story:    ReturnType<typeof useStoryStore.getState>,
  queue:    ReturnType<typeof useEmailQueueStore.getState>,
  rep:      ReturnType<typeof useRepStore.getState>,
) {
  // ── OVERSEER thresholds ───────────────────────────────────────────────────
  const flag = story.overseerFlag

  if (flag >= 40 && !story.hasFlag('AGENT44_WARNED')) {
    // E-14 first wave — delivered by triggerEngine (definition in Phase 3 scope)
    // Placeholder: log that threshold was hit
    console.warn('[OVERSEER] Flag ≥ 40 — E-14 first wave should be queued')
  }

  if (flag >= 90 && story.getMission('M-03') === 'active') {
    // M-03 failure condition
    missions.setMissionStatus('M-03', 'failed')
    story.setMission('M-03', 'failed')
    useRepStore.getState().adjust('compliance', -15)
    console.warn('[M-03] Failed — overseerFlag hit 90 before completion')
    // 48-hour cooldown + Agent 44 email handled by game timer
  }
}

// ── M-01 helpers ──────────────────────────────────────────────────────────────

// Called every time an onboarding email is read.
// Marks objective 2 complete when E-01 through E-04 are all in the read inbox.
function _checkM01Objective2(
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
) {
  // Only require E-01 and E-02 — E-03/E-04 arrive after M-01 completes (no circular dep)
  const mail = useMailStore.getState()
  const required = ['E-01', 'E-02']
  const readIds  = mail.mails.filter(m => !m.unread).map(m => m.storyId ?? m.id)
  if (required.every(id => readIds.includes(id))) {
    missions.setObjectiveComplete('M-01', 'M01-OBJ-2')
    _checkM01Completion(story, missions)
  }
}

function _checkM01Completion(
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
) {
  if (story.getMission('M-01') !== 'active') return
  if (!missions.allObjectivesComplete('M-01')) return

  missions.setMissionStatus('M-01', 'complete')
  story.setMission('M-01', 'complete')
  story.addCredits(100)
  story.setFlag('ONBOARDING_COMPLETE')

  // Phase 0.4: E-03 queued immediately
  useEmailQueueStore.getState().queueEmail({
    deliverAt: Date.now(),
    mail:      { ...BOOT_EMAILS['E-03'], storyId: 'E-03' } as any,
  })
}

// ── M-02 helpers ──────────────────────────────────────────────────────────────

function _completeMission02(
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
) {
  missions.setMissionStatus('M-02', 'complete')
  story.setMission('M-02', 'complete')
  story.setFlag('FIRST_JOB_DONE')
  useRepStore.getState().adjust('compliance', 1)

  // Phase 0.7: Memo 1 added to filesystem
  fsAddFile('memo_1_it_reminder.txt',
`From: Marcus Tell <mtell@gridos.corp>
To: All Contractors
Subject: IT reminder

If you're working a contract that requires internal Gridcorp system access,
make sure your compliance score is current. Access below 65 won't route.

Also: close your unused tabs. Yes, I can see them.

— Marcus`
  )
}

// ── M-03 helpers ──────────────────────────────────────────────────────────────

function _checkM03Completion(
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
  rep:      ReturnType<typeof useRepStore.getState>,
) {
  if (story.getMission('M-03') !== 'active') return

  const obj1 = missions.missions['M-03'].objectives.find(o => o.id === 'M03-OBJ-1')?.complete
  const obj2 = missions.missions['M-03'].objectives.find(o => o.id === 'M03-OBJ-2')?.complete
  const obj3 = missions.missions['M-03'].objectives.find(o => o.id === 'M03-OBJ-3')?.complete

  // Completion route A: intranet visited + compliance >= 65
  const routeA = obj1 && rep.compliance >= 65
  // Completion route B: file extracted via terminal (obj2 set externally by terminal)
  const routeB = obj2

  if ((routeA || routeB) && obj3) {
    missions.setMissionStatus('M-03', 'complete')
    story.setMission('M-03', 'complete')
    story.addCredits(600)
    useRepStore.getState().adjust('shadow', 3)

    fsAddFile('memo_2_overseer_anomaly_preliminary.txt',
`[GRIDCORP INTERNAL — PRELIMINARY]

OVERSEER anomaly — preliminary review
Date: redacted
Classification: INTERNAL / NOT FOR DISTRIBUTION

A subsystem routing discrepancy was logged in Node Cluster 7-G.
Behavioral variance exceeded standard deviation by 4.2x.

Cause: under review.
Status: not disclosed to public infrastructure.

— Office of Internal Compliance`
    )

    // E-12 queued 20 min after completion (Silas / Commune intro)
    // E-12 definition lives in Phase 2/3 scope — placeholder note
    console.info('[M-03 complete] E-12 should be queued for +20min delivery')
  }
}

// ── Phase advancement ─────────────────────────────────────────────────────────

function _checkPhaseAdvancement(
  story: ReturnType<typeof useStoryStore.getState>,
) {
  const { phase, hasFlag } = story

  // Phase 0 → 1: FIRST_JOB_DONE flag set
  if (phase === 0 && hasFlag('FIRST_JOB_DONE')) {
    story.setPhase(1)
    _onPhase1Entry()
  }

  // Phase 1 → 2: E-10 read (UNDERGROUND_CONTACT_MADE flag)
  if (phase === 1 && hasFlag('UNDERGROUND_CONTACT_MADE')) {
    story.setPhase(2)
  }

  // Phase 2 → 3: M-03 complete
  if (phase === 2 && story.getMission('M-03') === 'complete') {
    story.setPhase(3)
  }
}

function _onPhase1Entry() {
  const queue = useEmailQueueStore.getState()

  // Phase 1.1–1.4: spam/flavor emails
  // These use mailStore.send() directly since they're immediate or near-immediate
  // Actual content defined in mailStore seed or sent here:
  queue.queueEmail({ deliverAt: Date.now(),              mail: { tag: 'SYSTEM', from: 'noreply@gridmart.corp', subject: 'You left items in your cart!', dot: '#aaaaaa', body: 'Don\'t forget about your cart, citizen. Those items won\'t last forever.\n\n— GridMart' } })
  queue.queueEmail({ deliverAt: Date.now() + 10*MINUTE,  mail: { tag: 'SYSTEM', from: 'petra.kwan@wellness.gridos.corp', subject: 'Wellness Wednesday', body: 'Take a breath. You\'ve been very productive today. Remember to hydrate.\n\n— Petra Kwan, GridOS Wellness Division' } })
  queue.queueEmail({ deliverAt: Date.now() + 20*MINUTE,  mail: { tag: 'LORE', from: 'quarterly@gridcorp.net', subject: 'Gridcorp Q3 Report', body: 'Q3 productivity metrics are in. Sector 7 anomalies have been classified pending review. All other sectors nominal.\n\n— Clovis Marsh, Strategic Communications' } })
  queue.queueEmail({ deliverAt: Date.now() + 15*MINUTE,  mail: { tag: 'SYSTEM', from: 'newsletter@noodlehut.blog', subject: "This month's noodle pick", body: "The ramen. Always the ramen.\nVisit us at noodlehut.blog for the monthly pick and our secret cipher page.\n\n— NoodleHut" } })
}
