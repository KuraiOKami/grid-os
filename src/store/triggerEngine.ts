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

import { useStoryStore }                          from './storyStore'
import { useMissionStore }                        from './missionStore'
import { useEmailQueueStore, queueStoryEmail }    from './emailQueue'
import { useRepStore }                            from './reputationStore'
import { useMailStore }                           from './mailStore'
import { useFSStore }                             from './fsStore'

function fsAddFile(name: string, content: string) {
  useFSStore.getState().writeFile(['home', 'citizen', name], content)
}

const MINUTE = 60_000

export type TriggerEvent =
  | { type: 'page_visit';   url:      string }
  | { type: 'email_read';   emailId:  string }
  | { type: 'job_complete'; jobId:    string }
  | { type: 'file_read';    path:     string }
  | { type: 'open_app';     appId:    string }
  | { type: 'watch_submit'; decision: string }
  | { type: 'rep_change' }
  | { type: 'game_start' }

export function checkTriggers(event: TriggerEvent) {
  const story    = useStoryStore.getState()
  const missions = useMissionStore.getState()
  const queue    = useEmailQueueStore.getState()
  const rep      = useRepStore.getState()

  switch (event.type) {
    case 'game_start':    void _onGameStart(story, missions, queue);                    break
    case 'email_read':    void _onEmailRead(event.emailId, story, missions, queue);     break
    case 'page_visit':         _onPageVisit(event.url, story, missions, rep);           break
    case 'job_complete':       _onJobComplete(event.jobId, story, missions, queue, rep);break
    case 'file_read':          _onFileRead(event.path, story, missions);                break
    case 'open_app':           _onOpenApp(event.appId, story, missions);                break
    case 'watch_submit':       _onWatchSubmit(event.decision, story, missions);         break
    case 'rep_change':         _onRepChange(story, queue, rep);                         break
  }

  _checkPhaseAdvancement(story)
}

async function _onGameStart(
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
  queue:    ReturnType<typeof useEmailQueueStore.getState>,
) {
  if (story.getMission('M-01') !== 'inactive') return

  missions.setMissionStatus('M-01', 'active')
  story.setMission('M-01', 'active')

  await queueStoryEmail('E-01', 0)

  queue.queueEmail({
    deliverAt: Date.now() + 3 * MINUTE,
    mail: {
      tag: 'LORE', from: 'no-reply@pulse.news',
      subject: 'Your daily digest is ready', dot: undefined,
      body: `PULSE NETWORK  //  MORNING DIGEST
──────────────────────────────────────
ROOT BLOOM NETWORK — third cell disrupted this week. GridOS officials say containment is "proceeding as scheduled." Anonymous sources say otherwise.

CIVIC ARCHIVE — access suspended pending routine maintenance. Estimated downtime: indefinite.

GRIDMART EXPANSION — three new fulfillment nodes brought online in Sector 9. Workforce integration underway.

ANONYMOUS COURIER GUILD — two members listed as inactive. No further details provided.
──────────────────────────────────────
Stay informed. Stay compliant.
— Pulse Network`,
    },
  })

  queue.queueEmail({
    deliverAt: Date.now() + 18 * MINUTE,
    mail: {
      tag: 'NPC', from: 'anon@void.null',
      subject: 're: you were asking about the archive...', dot: undefined,
      body: `You didn't ask. But you would have eventually.

The civic archive is still partially accessible. Not through the front door.

Some apps on the official store aren't the only ones that exist.

That's all I'm saying.

— [sender scrubbed]`,
    },
  })

  queue.queueEmail({
    deliverAt: Date.now() + 35 * MINUTE,
    mail: {
      tag: 'THREAT', from: 'system@gridos.corp', dot: '#ff3b5c',
      subject: '[AUTOMATED] Suspicious activity detected on your node',
      body: `[AUTOMATED SECURITY NOTICE]

Unusual access patterns have been detected on your terminal.

This notice has been logged.

If you believe this is an error, no action is required. Your compliance record will reflect this event regardless.

— GridOS Security Division`,
    },
  })
}

async function _onEmailRead(
  emailId:  string,
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
  queue:    ReturnType<typeof useEmailQueueStore.getState>,
) {
  if (emailId === 'E-01') {
    const alreadySentE02   = useMailStore.getState().mails.some(m => m.storyId === 'E-02')
    const alreadyQueuedE02 = queue.queue.some(q => (q.mail as any).storyId === 'E-02')
    if (!alreadySentE02 && !alreadyQueuedE02) {
      await queueStoryEmail('E-02', 15_000)
    }

    const alreadySentCareers   = useMailStore.getState().mails.some(m => m.storyId === 'E-CAREERS')
    const alreadyQueuedCareers = queue.queue.some(q => (q.mail as any).storyId === 'E-CAREERS')
    if (!alreadySentCareers && !alreadyQueuedCareers) {
      await queueStoryEmail('E-CAREERS', 15_000)
    }
  }

  if (emailId === 'E-02') {
    if (story.getMission('M-02') === 'inactive') {
      missions.setMissionStatus('M-02', 'active')
      story.setMission('M-02', 'active')
    }
  }

  if (emailId === 'E-03') {
    const alreadySent   = useMailStore.getState().mails.some(m => m.storyId === 'E-04')
    const alreadyQueued = queue.queue.some(q => (q.mail as any).storyId === 'E-04')
    if (!alreadySent && !alreadyQueued) {
      await queueStoryEmail('E-04', 5 * MINUTE)
    }
  }

  const ONBOARDING_EMAIL_IDS = ['E-01', 'E-02', 'E-03', 'E-04', 'E-CAREERS']
  if (ONBOARDING_EMAIL_IDS.includes(emailId)) {
    _checkM01Objective2(story, missions)
  }

  if (emailId === 'E-10' && !story.hasFlag('UNDERGROUND_CONTACT_MADE')) {
    story.setFlag('UNDERGROUND_CONTACT_MADE')
    if (story.getMission('M-03') === 'inactive') {
      missions.setMissionStatus('M-03', 'active')
      story.setMission('M-03', 'active')
    }
  }
}

function _onPageVisit(
  url:      string,
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
  rep:      ReturnType<typeof useRepStore.getState>,
) {
  story.recordPageVisit(url)

  if (url === 'gridos.corp' && story.getMission('M-01') === 'active') {
    missions.setObjectiveComplete('M-01', 'M01-OBJ-1')
    _checkM01Completion(story, missions)
  }

  const SECTOR7_PAGES = [
    'yellowthread.forum',
    'ghostlily.blog/root-bloom',
    'pulse.news/outages',
    'gridnetnews.com/sector7',
  ]
  if (SECTOR7_PAGES.includes(url) && !story.hasFlag('SECTOR7_SUSPECTED')) {
    story.setFlag('SECTOR7_SUSPECTED')
    void queueStoryEmail('E-10', 45 * MINUTE)
  }

  const INTRANET_PAGES = ['gridos.corp/internal', 'gridos.corp/compliance']
  if (INTRANET_PAGES.includes(url) && story.getMission('M-03') === 'active') {
    missions.setObjectiveComplete('M-03', 'M03-OBJ-1')
    _checkM03Completion(story, missions, rep)
  }

  if (url === 'gridos.corp/internal') {
    story.adjustOverseer(+3)
    if (rep.compliance >= 65) {
      story.adjustOverseer(-3)
    }
  }

  if (url.startsWith('voidbay.net'))   story.adjustOverseer(+5)
  if (url.startsWith('splice.onion'))  story.adjustOverseer(+8)
  if (url.startsWith('vault.archive')) story.adjustOverseer(+10)
}

function _onJobComplete(
  jobId:    string,
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
  queue:    ReturnType<typeof useEmailQueueStore.getState>,
  rep:      ReturnType<typeof useRepStore.getState>,
) {
  story.recordJobComplete(jobId)

  if (story.getMission('M-02') === 'active') {
    missions.setObjectiveComplete('M-02', 'M02-OBJ-1')
    _completeMission02(story, missions)
  }
}

function _onFileRead(
  path:     string,
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
) {
  story.recordFileRead(path)

  if (path === '~/' && story.getMission('M-01') === 'active') {
    missions.setObjectiveComplete('M-01', 'M01-OBJ-3')
    _checkM01Completion(story, missions)
  }
}

function _onRepChange(
  story:    ReturnType<typeof useStoryStore.getState>,
  queue:    ReturnType<typeof useEmailQueueStore.getState>,
  rep:      ReturnType<typeof useRepStore.getState>,
) {
  const flag = story.overseerFlag

  if (flag >= 40 && !story.hasFlag('AGENT44_WARNED')) {
    console.warn('[OVERSEER] Flag ≥ 40 — E-14 first wave should be queued')
  }

  if (flag >= 90 && story.getMission('M-03') === 'active') {
    useMissionStore.getState().setMissionStatus('M-03', 'failed')
    story.setMission('M-03', 'failed')
    useRepStore.getState().adjust('compliance', -15)
    console.warn('[M-03] Failed — overseerFlag hit 90 before completion')
  }
}

function _checkM01Objective2(
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
) {
  const mail     = useMailStore.getState()
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

  void queueStoryEmail('E-03', 0)
}

function _completeMission02(
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
) {
  missions.setMissionStatus('M-02', 'complete')
  story.setMission('M-02', 'complete')
  story.setFlag('FIRST_JOB_DONE')
  useRepStore.getState().adjust('compliance', 1)

  fsAddFile('memo_1_it_reminder.txt',
`From: Marcus Tell <mtell@gridos.corp>
To: All Contractors
Subject: IT reminder

If you're working a contract that requires internal Gridcorp system access,
make sure your compliance score is current. Access below 65 won't route.

Also: close your unused tabs. Yes, I can see them.

— Marcus`
  )

  const alreadySent = useMailStore.getState().mails.some(m => m.storyId === 'WATCH-ACCESS')
  if (!alreadySent) {
    useEmailQueueStore.getState().queueEmail({
      deliverAt: Date.now() + 30_000,
      mail: {
        storyId:   'WATCH-ACCESS',
        tag:       'SYSTEM',
        from:      'compliance@gridos.corp',
        subject:   'Analyst Access — WATCH Intelligence System',
        dot:       '#ff3b5c',
        watchCode: 'WATCH-GRID-01',
        body:
`GRIDCORP COMPLIANCE DIVISION

Based on your contract activity, you have been selected for analyst-level access to the WATCH Citizen Intelligence System.

WATCH is used by GridOS compliance analysts to review flagged citizen behavior and issue formal verdicts. Your decisions carry operational weight.

ACCESS CODE: WATCH-GRID-01

Enter this code in the App Store to install WATCH. Review your first case file and submit a verdict to complete your analyst onboarding.

Note: All WATCH activity is logged and attributed to your analyst profile. Decisions are permanent.

— GridOS Compliance Division`,
      } as any,
    })
  }
}

function _onOpenApp(
  appId:    string,
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
) {
  if (appId === 'watch' && story.getMission('S-01') === 'inactive' && story.hasFlag('FIRST_JOB_DONE')) {
    missions.setMissionStatus('S-01', 'active')
    story.setMission('S-01', 'active')
  }
  if (appId === 'watch' && story.getMission('S-01') === 'active') {
    missions.setObjectiveComplete('S-01', 'S01-OBJ-1')
  }
}

function _onWatchSubmit(
  decision: string,
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
) {
  if (story.getMission('S-01') !== 'active') return

  if (decision === '__review__') {
    missions.setObjectiveComplete('S-01', 'S01-OBJ-2')
    return
  }

  missions.setObjectiveComplete('S-01', 'S01-OBJ-2')
  missions.setObjectiveComplete('S-01', 'S01-OBJ-3')

  if (missions.allObjectivesComplete('S-01')) {
    missions.setMissionStatus('S-01', 'complete')
    story.setMission('S-01', 'complete')
    story.addCredits(280)
    useRepStore.getState().adjust('compliance', 2)
  }
}

function _checkM03Completion(
  story:    ReturnType<typeof useStoryStore.getState>,
  missions: ReturnType<typeof useMissionStore.getState>,
  rep:      ReturnType<typeof useRepStore.getState>,
) {
  if (story.getMission('M-03') !== 'active') return

  const co   = missions.completedObjectives
  const obj1 = co['M03-OBJ-1'] ?? false
  const obj2 = co['M03-OBJ-2'] ?? false
  const obj3 = co['M03-OBJ-3'] ?? false

  const routeA = obj1 && rep.compliance >= 65
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

    console.info('[M-03 complete] E-12 should be queued for +20min delivery')
  }
}

function _checkPhaseAdvancement(
  story: ReturnType<typeof useStoryStore.getState>,
) {
  const { phase, hasFlag } = story

  if (phase === 0 && hasFlag('FIRST_JOB_DONE')) {
    story.setPhase(1)
    _onPhase1Entry()
  }

  if (phase === 1 && hasFlag('UNDERGROUND_CONTACT_MADE')) {
    story.setPhase(2)
  }

  if (phase === 2 && story.getMission('M-03') === 'complete') {
    story.setPhase(3)
  }
}

function _onPhase1Entry() {
  const queue = useEmailQueueStore.getState()

  queue.queueEmail({ deliverAt: Date.now(),             mail: { tag: 'SYSTEM', from: 'noreply@gridmart.corp', subject: 'You left items in your cart!', dot: '#aaaaaa', body: "Don't forget about your cart, citizen. Those items won't last forever.\n\n— GridMart" } })
  queue.queueEmail({ deliverAt: Date.now() + 10*MINUTE, mail: { tag: 'SYSTEM', from: 'petra.kwan@wellness.gridos.corp', subject: 'Wellness Wednesday', body: "Take a breath. You've been very productive today. Remember to hydrate.\n\n— Petra Kwan, GridOS Wellness Division" } })
  queue.queueEmail({ deliverAt: Date.now() + 20*MINUTE, mail: { tag: 'LORE', from: 'quarterly@gridcorp.net', subject: 'Gridcorp Q3 Report', body: "Q3 productivity metrics are in. Sector 7 anomalies have been classified pending review. All other sectors nominal.\n\n— Clovis Marsh, Strategic Communications" } })
  queue.queueEmail({ deliverAt: Date.now() + 15*MINUTE, mail: { tag: 'SYSTEM', from: 'newsletter@noodlehut.blog', subject: "This month's noodle pick", body: "The ramen. Always the ramen.\nVisit us at noodlehut.blog for the monthly pick and our secret cipher page.\n\n— NoodleHut" } })
}
