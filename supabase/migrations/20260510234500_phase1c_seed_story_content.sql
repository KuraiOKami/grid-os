-- Phase 1c seed: missions, mission_objectives, story_files, story_triggers
-- Safe to re-run (upsert on conflict).
begin;

-- ─── MISSIONS ──────────────────────────────────────────────────────────────────
insert into public.missions (
  id, title, description, prereq_flag, sort_order,
  faction_tag, phase_gate, reward_credits, reward_flags, is_side_mission
)
values
  ('M-01','First Shift','Complete your first sanctioned job and learn the GridOS work loop.',null,10,'corp',0,100,array['FIRST_JOB_DONE']::text[],false),
  ('M-02','Strange Traffic','Follow the first signs that sanctioned systems and underground routes overlap.','FIRST_JOB_DONE',20,'neutral',1,150,array['UNDERGROUND_CONTACT_MADE']::text[],false),
  ('M-03','Archive Static','Investigate anomalies spreading through civic archive mirrors.','UNDERGROUND_CONTACT_MADE',30,'underground',1,200,array['SECTOR7_SUSPECTED']::text[],false),
  ('M-04','Compliance Echo','Track how internal compliance systems respond to archive anomalies.','SECTOR7_SUSPECTED',40,'corp',2,250,array['SECTOR7_KNOWN']::text[],false),
  ('M-05','Foundation Leak','Uncover the actors shaping record suppression and recovery efforts.','SECTOR7_KNOWN',50,'neutral',3,300,array['FOUNDATION_KNOWN']::text[],false),
  ('M-06','Splice Junction','Choose who to trust as the network closes in around you.','FOUNDATION_KNOWN',60,'underground',4,350,array['SPLICE_TRUSTED']::text[],false),
  ('M-07','Vault Signal','Push deeper into sealed routes and recover what was meant to disappear.','SPLICE_TRUSTED',70,'neutral',5,400,array['VAULT_FOUND']::text[],false),
  ('M-08','Gridfall','Reach the end-state branch and decide what survives the reveal.','VAULT_FOUND',80,'neutral',6,500,array[]::text[],false),
  ('S-01','After Hours','Optional off-ledger work that opens small bits of the underground route.',null,110,'underground',0,80,array[]::text[],true),
  ('S-02','Quiet Audit','An internal compliance favor with a small reputational payoff.',null,120,'corp',0,80,array[]::text[],true),
  ('S-03','Courier Ghost','Move a package you were not supposed to notice.','FIRST_JOB_DONE',130,'underground',1,100,array[]::text[],true),
  ('S-04','Public Record','Help restore a fragment of a damaged civic record.','UNDERGROUND_CONTACT_MADE',140,'neutral',2,100,array[]::text[],true),
  ('S-05','Signal Hygiene','Clean up your trail after making contact with the wrong systems.','SECTOR7_SUSPECTED',150,'corp',3,120,array[]::text[],true),
  ('S-06','Sideband','A late-game optional thread that hints at the OVERSEER route.','FOUNDATION_KNOWN',160,'neutral',4,140,array['OVERSEER_UNDERSTOOD']::text[],true)
on conflict (id) do update set
  title          = excluded.title,
  description    = excluded.description,
  prereq_flag    = excluded.prereq_flag,
  sort_order     = excluded.sort_order,
  faction_tag    = excluded.faction_tag,
  phase_gate     = excluded.phase_gate,
  reward_credits = excluded.reward_credits,
  reward_flags   = excluded.reward_flags,
  is_side_mission = excluded.is_side_mission;

-- ─── MISSION OBJECTIVES ────────────────────────────────────────────────────────
insert into public.mission_objectives (id, mission_id, description, condition_ast, sort_order)
values
  ('M-01-OBJ-01','M-01','Complete your first job.','{"type":"job_done","jobId":"any"}'::jsonb,10),
  ('M-01-OBJ-02','M-01','Open your mail and review the response.','{"type":"true"}'::jsonb,20),
  ('M-02-OBJ-01','M-02','Visit the first suspicious page or hidden route.','{"type":"page_visited","url":"hidden://first-contact"}'::jsonb,10),
  ('M-02-OBJ-02','M-02','Reach phase 1 progression.','{"type":"phase_gte","phase":1}'::jsonb,20),
  ('M-03-OBJ-01','M-03','Find an archive-related mirror or breadcrumb.','{"type":"page_visited","url":"archive://mirror"}'::jsonb,10),
  ('M-04-OBJ-01','M-04','Raise compliance or trigger a compliance-linked branch.','{"type":"rep_gte","track":"compliance","value":55}'::jsonb,10),
  ('M-05-OBJ-01','M-05','Discover enough evidence to expose the Foundation layer.','{"type":"flag","flag":"FOUNDATION_KNOWN"}'::jsonb,10),
  ('M-06-OBJ-01','M-06','Establish trust with Splice.','{"type":"flag","flag":"SPLICE_TRUSTED"}'::jsonb,10),
  ('M-07-OBJ-01','M-07','Locate the sealed vault route.','{"type":"flag","flag":"VAULT_FOUND"}'::jsonb,10),
  ('M-08-OBJ-01','M-08','Reach end-state conditions for Gridfall.','{"type":"phase_gte","phase":6}'::jsonb,10),
  ('S-01-OBJ-01','S-01','Take one off-ledger side job.','{"type":"job_done","jobId":"side-anon-01"}'::jsonb,10),
  ('S-02-OBJ-01','S-02','Review a compliance-linked page.','{"type":"page_visited","url":"gridos.corp/compliance"}'::jsonb,10),
  ('S-03-OBJ-01','S-03','Trigger courier ghost work.','{"type":"job_done","jobId":"courier-ghost"}'::jsonb,10),
  ('S-04-OBJ-01','S-04','Read a public record file.','{"type":"true"}'::jsonb,10),
  ('S-05-OBJ-01','S-05','Raise compliance to a stable tier.','{"type":"rep_gte","track":"compliance","value":60}'::jsonb,10),
  ('S-06-OBJ-01','S-06','Push shadow high enough to glimpse the OVERSEER route.','{"type":"rep_gte","track":"shadow","value":65}'::jsonb,10)
on conflict (id) do update set
  mission_id    = excluded.mission_id,
  description   = excluded.description,
  condition_ast = excluded.condition_ast,
  sort_order    = excluded.sort_order;

-- ─── STORY FILES ───────────────────────────────────────────────────────────────
insert into public.story_files (slug, title, content, tags, visible_phase)
values
  (
    'welcome/onboarding',
    'Welcome to GridOS',
    E'Welcome to GridOS.\n\nYour citizen workstation has been provisioned. Complete your first shift, monitor your inbox, and avoid drawing unnecessary attention. Every system remembers more than it admits.',
    array['onboarding','system','corp'],
    0
  ),
  (
    'lore/root-bloom-fragment',
    'ROOT BLOOM // Fragment',
    E'Fragment recovered from an unstable civic archive mirror.\n\nThe official record shows a maintenance event. The recovered record suggests deliberate suppression, distributed across systems that should not have shared authority.',
    array['lore','archive','root-bloom'],
    1
  ),
  (
    'intel/overseer-sideband',
    'OVR // Sideband Notes',
    E'Internal note: there is no proof the OVERSEER is a single actor. Operators describe it as a pressure pattern, not an administrator. The effect is consistent: attention increases, routes close, and records normalize.',
    array['intel','overseer','late-game'],
    4
  )
on conflict (slug) do update set
  title         = excluded.title,
  content       = excluded.content,
  tags          = excluded.tags,
  visible_phase = excluded.visible_phase;

-- ─── STORY TRIGGERS ────────────────────────────────────────────────────────────
insert into public.story_triggers (
  id, label, event_type, condition_ast, effects, enabled, repeat_limit, fired_count, event_types
)
values
  (
    'trg_game_start_m01',
    'Activate M-01 at game start',
    'game_start',
    '{"type":"true"}'::jsonb,
    '[{"type":"set_mission","id":"M-01","status":"active"}]'::jsonb,
    true, 1, 0, array['game_start']
  ),
  (
    'trg_first_job_done_flag',
    'Record first job completion',
    'job_complete',
    '{"type":"no_flag","flag":"FIRST_JOB_DONE"}'::jsonb,
    '[{"type":"set_flag","flag":"FIRST_JOB_DONE"},{"type":"add_credits","amount":100},{"type":"set_mission","id":"M-01","status":"complete"},{"type":"set_mission","id":"M-02","status":"active"},{"type":"advance_phase"}]'::jsonb,
    true, 1, 0, array['job_complete']
  ),
  (
    'trg_first_job_done_mail',
    'Queue a story email after first job',
    'job_complete',
    '{"type":"flag","flag":"FIRST_JOB_DONE"}'::jsonb,
    '[{"type":"queue_email","storyId":"first_shift_complete","delayMs":0}]'::jsonb,
    true, 1, 0, array['job_complete']
  ),
  (
    'trg_hidden_page_contact',
    'Underground contact on hidden page visit',
    'page_visit',
    '{"type":"and","nodes":[{"type":"page_visited","url":"hidden://first-contact"},{"type":"no_flag","flag":"UNDERGROUND_CONTACT_MADE"}]}'::jsonb,
    '[{"type":"set_flag","flag":"UNDERGROUND_CONTACT_MADE"},{"type":"set_mission","id":"M-03","status":"active"}]'::jsonb,
    true, 1, 0, array['page_visit']
  ),
  (
    'trg_archive_signal',
    'Archive mirror reveals Sector 7 suspicion',
    'page_visit',
    '{"type":"and","nodes":[{"type":"page_visited","url":"archive://mirror"},{"type":"flag","flag":"UNDERGROUND_CONTACT_MADE"},{"type":"no_flag","flag":"SECTOR7_SUSPECTED"}]}'::jsonb,
    '[{"type":"set_flag","flag":"SECTOR7_SUSPECTED"},{"type":"set_mission","id":"M-04","status":"active"},{"type":"adjust_overseer","delta":5}]'::jsonb,
    true, 1, 0, array['page_visit']
  ),
  (
    'trg_compliance_unlock',
    'Compliance threshold marks Sector 7 as known',
    'rep_change',
    '{"type":"and","nodes":[{"type":"rep_gte","track":"compliance","value":55},{"type":"flag","flag":"SECTOR7_SUSPECTED"},{"type":"no_flag","flag":"SECTOR7_KNOWN"}]}'::jsonb,
    '[{"type":"set_flag","flag":"SECTOR7_KNOWN"},{"type":"set_mission","id":"M-05","status":"active"}]'::jsonb,
    true, 1, 0, array['rep_change']
  ),
  (
    'trg_overseer_sideband',
    'Shadow threshold hints at the OVERSEER',
    'rep_change',
    '{"type":"and","nodes":[{"type":"rep_gte","track":"shadow","value":65},{"type":"phase_gte","phase":3},{"type":"no_flag","flag":"OVERSEER_UNDERSTOOD"}]}'::jsonb,
    '[{"type":"set_flag","flag":"OVERSEER_UNDERSTOOD"},{"type":"set_mission","id":"S-06","status":"active"},{"type":"queue_email","storyId":"overseer_sideband","delayMs":0}]'::jsonb,
    true, 1, 0, array['rep_change']
  )
on conflict (id) do update set
  label         = excluded.label,
  event_type    = excluded.event_type,
  condition_ast = excluded.condition_ast,
  effects       = excluded.effects,
  enabled       = excluded.enabled,
  repeat_limit  = excluded.repeat_limit,
  event_types   = excluded.event_types;

commit;
