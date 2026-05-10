-- Seed: story emails for GridOS
-- Run after migration 20260510_mail_templates.sql
-- All emails upsert on story_id so reruns are safe.

INSERT INTO public.mail_templates
  (story_id, tag, from_address, subject, dot, watch_code, body)
VALUES

-- ── Phase 0 boot sequence ───────────────────────────────────────────────────

  (
    'E-01',
    'SYSTEM',
    'greta-7@gridos.corp',
    'Welcome to GridOS',
    '#00e5ff',
    NULL,
    'Welcome, citizen. Your node has been initialized.

GridOS is your terminal, your workspace, and your record. Everything you do here is logged.

To get started:
— Open the browser and visit gridos.corp
— Check your inbox — you have more messages waiting
— Open the file manager when you''re ready

I''ll be here if you need guidance.

— GRETA-7 // Citizen Onboarding System'
  ),

  (
    'E-02',
    'NPC',
    'mtell@gridos.corp',
    'Your first shift',
    '#aaaaaa',
    NULL,
    'Hey.

You''ve been assigned to the open contracts queue.

There are jobs listed at gridos.corp/careers and at clearpath.gridcorp.net.

Pick one. Complete it. That''s the job.

Don''t overthink it.

— Marcus Tell
Infrastructure Division, GridOS'
  ),

  (
    'E-03',
    'SYSTEM',
    'hr@gridos.corp',
    'Your employment agreement',
    '#00e5ff',
    NULL,
    'GRIDCORP CITIZEN SERVICES — EMPLOYMENT AGREEMENT

By continuing to use this terminal, you acknowledge and agree to the following:

1. All activity on this node is logged and retained indefinitely.
2. Contract earnings are disbursed in GridCredits (₳) to your registered wallet.
3. Behavioral compliance is tracked. Your score is visible to GridOS operators.
4. GridOS reserves the right to adjust, suspend, or terminate any citizen account at any time.

This agreement takes effect immediately upon first job completion.

Stay productive.

— GridOS Human Resources'
  ),

  (
    'E-04',
    'SYSTEM',
    'greta-7@gridos.corp',
    'Tips for new employees',
    '#00e5ff',
    NULL,
    'A few things that might help:

— Your reputation score has two axes: Compliance and Shadow. Compliance goes up when you work with GridOS. Shadow goes up when you don''t. You can have both high. You can have both low. Neither is better.

— The browser has a history. Things you visit leave traces.

— Some jobs require specific tools or access levels. Read carefully.

— If you have questions, I''m always listening.

— GRETA-7'
  ),

  (
    'E-10',
    'ANON',
    'null@void.null',
    '[no subject]',
    '#ff9900',
    NULL,
    'You''ve been looking at the right things. That''s unusual.

I have work, if you''re interested. The pay is real. The risk is real too.

Reply to this address if you want to know more. If you forward it, you won''t hear from me again.

— Null'
  ),

-- ── Story / lore emails ──────────────────────────────────────────────────────

  (
    'WATCH-ACCESS',
    'SYSTEM',
    'compliance@gridos.corp',
    'Analyst Access — WATCH Intelligence System',
    '#ff3b5c',
    'WATCH-GRID-01',
    'GRIDCORP COMPLIANCE DIVISION

Based on your contract activity, you have been selected for analyst-level access to the WATCH Citizen Intelligence System.

WATCH is used by GridOS compliance analysts to review flagged citizen behavior and issue formal verdicts. Your decisions carry operational weight.

ACCESS CODE: WATCH-GRID-01

Enter this code in the App Store to install WATCH. Review your first case file and submit a verdict to complete your analyst onboarding.

Note: All WATCH activity is logged and attributed to your analyst profile. Decisions are permanent.

— GridOS Compliance Division'
  ),

  (
    'LORE-PULSE-DIGEST',
    'LORE',
    'no-reply@pulse.news',
    'Your daily digest is ready',
    NULL,
    NULL,
    'PULSE NETWORK  //  MORNING DIGEST
──────────────────────────────────────
ROOT BLOOM NETWORK — third cell disrupted this week. GridOS officials say containment is "proceeding as scheduled." Anonymous sources say otherwise.

CIVIC ARCHIVE — access suspended pending routine maintenance. Estimated downtime: indefinite.

GRIDMART EXPANSION — three new fulfillment nodes brought online in Sector 9. Workforce integration underway.

ANONYMOUS COURIER GUILD — two members listed as inactive. No further details provided.
──────────────────────────────────────
Stay informed. Stay compliant.
— Pulse Network'
  ),

  (
    'LORE-ARCHIVE-TIP',
    'NPC',
    'anon@void.null',
    're: you were asking about the archive...',
    NULL,
    NULL,
    'You didn''t ask. But you would have eventually.

The civic archive is still partially accessible. Not through the front door.

Some apps on the official store aren''t the only ones that exist.

That''s all I''m saying.

— [sender scrubbed]'
  ),

  (
    'SYS-SUSPICIOUS-ACTIVITY',
    'THREAT',
    'system@gridos.corp',
    '[AUTOMATED] Suspicious activity detected on your node',
    '#ff3b5c',
    NULL,
    '[AUTOMATED SECURITY NOTICE]

Unusual access patterns have been detected on your terminal.

This notice has been logged.

If you believe this is an error, no action is required. Your compliance record will reflect this event regardless.

— GridOS Security Division'
  ),

  (
    'PHASE1-GRIDMART-CART',
    'SYSTEM',
    'noreply@gridmart.corp',
    'You left items in your cart!',
    '#aaaaaa',
    NULL,
    'Don''t forget about your cart, citizen. Those items won''t last forever.

— GridMart'
  ),

  (
    'PHASE1-WELLNESS',
    'SYSTEM',
    'petra.kwan@wellness.gridos.corp',
    'Wellness Wednesday',
    NULL,
    NULL,
    'Take a breath. You''ve been very productive today. Remember to hydrate.

— Petra Kwan, GridOS Wellness Division'
  ),

  (
    'PHASE1-Q3-REPORT',
    'LORE',
    'quarterly@gridcorp.net',
    'Gridcorp Q3 Report',
    NULL,
    NULL,
    'Q3 productivity metrics are in. Sector 7 anomalies have been classified pending review. All other sectors nominal.

— Clovis Marsh, Strategic Communications'
  ),

  (
    'PHASE1-NOODLEHUT',
    'SYSTEM',
    'newsletter@noodlehut.blog',
    'This month''s noodle pick',
    NULL,
    NULL,
    'The ramen. Always the ramen.
Visit us at noodlehut.blog for the monthly pick and our secret cipher page.

— NoodleHut'
  )

ON CONFLICT (story_id) DO UPDATE SET
  tag          = EXCLUDED.tag,
  from_address = EXCLUDED.from_address,
  subject      = EXCLUDED.subject,
  dot          = EXCLUDED.dot,
  watch_code   = EXCLUDED.watch_code,
  body         = EXCLUDED.body,
  updated_at   = NOW();
