import { useEffect, useState } from 'react'
import { getJobs, acceptJob, subscribe, type Job } from '@/store/jobStore'

const C = {
  bg:      '#090b12',
  surface: '#0d111a',
  border:  '#202636',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  success: '#7bd389',
  warn:    '#ffd166',
  hidden:  '#ff6b6b',
}

export default function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>(getJobs())

  useEffect(() => subscribe(setJobs), [])

  const pending  = jobs.filter(j => !j.accepted)
  const accepted = jobs.filter(j => j.accepted)

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column',
      background:C.bg, color:C.text, fontFamily:"'JetBrains Mono', monospace",
      overflow:'hidden' }}>

      {/* header */}
      <div style={{ padding:'14px 18px 10px', borderBottom:`1px solid ${C.border}`,
        background:'#0f1320', flexShrink:0 }}>
        <div style={{ fontSize:15, color:C.accent, fontWeight:'bold', marginBottom:2 }}>
          Job Board
        </div>
        <div style={{ fontSize:11, color:C.muted }}>
          {pending.length} open · {accepted.length} accepted
        </div>
      </div>

      {/* list */}
      <div style={{ flex:1, overflow:'auto', padding:14, display:'flex',
        flexDirection:'column', gap:10 }}>

        {jobs.length === 0 && (
          <div style={{ flex:1, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:10,
            color:C.muted, fontSize:12, paddingBottom:40 }}>
            <span style={{ fontSize:26, color:C.faint }}>[ ]</span>
            <span>No jobs found.</span>
            <span style={{ color:C.faint, fontSize:11 }}>
              Browse the web — contracts surface on certain pages.
            </span>
          </div>
        )}

        {pending.length > 0 && (
          <>
            <SectionLabel label="OPEN" color={C.warn} />
            {pending.map(j => <JobCard key={j.id} job={j} onAccept={() => acceptJob(j.id)} />)}
          </>
        )}

        {accepted.length > 0 && (
          <>
            <SectionLabel label="ACCEPTED" color={C.success} />
            {accepted.map(j => <JobCard key={j.id} job={j} onAccept={() => {}} />)}
          </>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ label, color }: { label:string; color:string }) {
  return (
    <div style={{ fontSize:10, letterSpacing:'0.12em', color, marginTop:4, marginBottom:2 }}>
      — {label} —
    </div>
  )
}

function JobCard({ job, onAccept }: { job:Job; onAccept:()=>void }) {
  const corpColor = job.corp === 'GridOS' ? '#00e5ff'
    : job.corp === 'Anonymous' || job.corp.includes('anonymous') ? '#ff6b6b'
    : '#ffd166'

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`,
      borderRadius:10, padding:'12px 14px', display:'flex',
      flexDirection:'column', gap:8 }}>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
        <div>
          <div style={{ fontSize:13, color:'#eef3ff', marginBottom:4 }}>{job.title}</div>
          <div style={{ fontSize:11, color:corpColor }}>{job.corp}</div>
        </div>
        <div style={{ fontSize:12, color:'#7bd389', whiteSpace:'nowrap' }}>{job.pay}</div>
      </div>

      <div style={{ fontSize:10, color:'#3a3a4a', fontFamily:'inherit' }}>
        source: {job.source}
      </div>

      {!job.accepted ? (
        <button onClick={onAccept} style={{
          alignSelf:'flex-end', padding:'7px 14px', borderRadius:6, fontSize:11,
          border:'1px solid #7bd38966', background:'#7bd38912',
          color:'#7bd389', cursor:'pointer', fontFamily:'inherit' }}>
          Accept
        </button>
      ) : (
        <div style={{ alignSelf:'flex-end', fontSize:11, color:'#7bd389',
          padding:'7px 14px' }}>✓ Accepted</div>
      )}
    </div>
  )
}
