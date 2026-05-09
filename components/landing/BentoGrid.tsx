'use client'
import React from 'react'
import { motion } from 'framer-motion'

const CSS = `
:root {
  --lp-bg: #FAF9F6;
  --lp-bg-alt: #F5F4F0;
  --lp-grid: rgba(0,0,0,0.03);
  --lp-glass: rgba(255,255,255,0.68);
  --lp-glass-strong: rgba(255,255,255,0.82);
  --lp-text-1: #12111A;
  --lp-text-2: #3D3C52;
  --lp-text-3: #8C8BA4;
  --lp-border: rgba(18,17,26,0.07);
  --lp-border-md: rgba(18,17,26,0.13);
  --lp-violet: #7C3AED;
  --lp-rose: #EC4899;
  --lp-gradient: linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);
  --lp-gradient-soft: linear-gradient(135deg,rgba(124,58,237,0.07) 0%,rgba(236,72,153,0.07) 100%);
  --lp-green: #059669;
  --lp-green-bg: rgba(5,150,105,0.08);
  --sh-card: 0 1px 0 rgba(255,255,255,0.9) inset,0 2px 8px rgba(0,0,0,0.04),0 12px 32px rgba(0,0,0,0.06);
  --sh-float: 0 1px 0 rgba(255,255,255,0.95) inset,0 4px 16px rgba(0,0,0,0.05),0 24px 64px rgba(0,0,0,0.08);
  --sh-violet: 0 8px 32px rgba(124,58,237,0.22);
  --sh-panel-l: -8px 0 40px rgba(0,0,0,0.08);
  --sh-panel-r: 8px 0 40px rgba(0,0,0,0.08);
}
@keyframes lp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.5)} }
`

const CARD: React.CSSProperties = {
  background: 'var(--lp-glass)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.78)',
  boxShadow: 'var(--sh-card)',
}

const anim = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.52, delay, ease: [0.23, 1, 0.32, 1] as [number,number,number,number] },
})

/* ── CELL A : Booking en direct ───────────────────────────────────────── */
function CellA() {
  const slots = ['09:00','09:30','10:00','10:30','14:00','14:30','15:00','15:30']
  return (
    <motion.div {...anim(0)} style={{
      ...CARD, gridColumn:'span 7', height:380, borderRadius:14,
      padding:'18px 18px 48px', position:'relative',
      display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, overflow:'hidden',
    }}>
      <span style={{ position:'absolute', top:16, left:18, fontSize:9, fontWeight:700,
        letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--lp-violet)',
        background:'rgba(124,58,237,0.09)', padding:'3px 8px', borderRadius:100,
        border:'1px solid rgba(124,58,237,0.14)' }}>Réservation</span>

      {/* Slot picker */}
      <div style={{ marginTop:32 }}>
        <div style={{ background:'rgba(18,17,26,0.03)', border:'1px solid var(--lp-border)', borderRadius:10, padding:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', marginBottom:9 }}>
            <span style={{ fontSize:12, fontWeight:700, letterSpacing:'-0.025em', color:'var(--lp-text-1)' }}>Mardi 14 Jan</span>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 }}>
              {['‹','›'].map(c=>(
                <button key={c} style={{ width:20, height:20, borderRadius:5, border:'1px solid var(--lp-border)', background:'var(--lp-glass)', fontSize:12, color:'var(--lp-text-2)', cursor:'pointer', display:'grid', placeItems:'center', padding:0 }}>{c}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
            {slots.map((s,i)=>(
              <div key={s} style={{ padding:'6px 0', textAlign:'center', borderRadius:7, fontSize:12,
                fontWeight: i===3 ? 700 : 400,
                letterSpacing: i===3 ? '-0.02em' : '0',
                background: i===3 ? 'var(--lp-gradient)' : i===2 ? 'rgba(124,58,237,0.07)' : 'transparent',
                color: i===3 ? 'white' : i===2 ? 'var(--lp-violet)' : 'var(--lp-text-2)',
                border: i===2 ? '1px solid rgba(124,58,237,0.18)' : '1px solid transparent',
                cursor:'pointer',
              }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment card */}
      <div style={{ marginTop:32 }}>
        <div style={{ background:'rgba(255,255,255,0.85)', border:'1px solid rgba(255,255,255,0.9)', borderRadius:12, padding:16, boxShadow:'var(--sh-float)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:8, alignItems:'center', marginBottom:11 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--lp-gradient)', display:'grid', placeItems:'center', fontSize:11, fontWeight:700, color:'white' }}>CD</div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:'-0.025em', color:'var(--lp-text-1)' }}>Claire Dubois</div>
              <div style={{ fontSize:10, fontWeight:300, color:'var(--lp-text-3)' }}>Consultation récupération</div>
            </div>
          </div>
          <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.05em', color:'var(--lp-text-1)', marginBottom:11 }}>
            120,00<span style={{ fontSize:14, fontWeight:300, color:'var(--lp-text-3)', marginLeft:3 }}>€</span>
          </div>
          <div style={{ background:'linear-gradient(135deg,#1A1A2E,#2D2D4A)', borderRadius:8, padding:'10px 12px', marginBottom:10, display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
            <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:6, alignItems:'center' }}>
              <div style={{ width:22, height:15, borderRadius:3, background:'linear-gradient(135deg,#D4A017,#F5C842)' }} />
              <span style={{ color:'rgba(255,255,255,0.65)', fontSize:11, letterSpacing:'0.12em' }}>•••• 4242</span>
            </div>
            <span style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>12/28</span>
          </div>
          <button style={{ width:'100%', padding:'10px', background:'var(--lp-gradient)', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:700, letterSpacing:'-0.01em', cursor:'pointer', display:'grid', gridTemplateColumns:'auto 1fr', alignItems:'center', justifyItems:'center', gap:5, boxShadow:'var(--sh-violet)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Confirmer &amp; Payer</span>
          </button>
        </div>
      </div>

      <div style={{ position:'absolute', bottom:14, left:18, display:'grid', gridTemplateColumns:'auto 1fr', gap:5, alignItems:'center', fontSize:10, fontWeight:300, color:'var(--lp-text-3)' }}>
        <svg width="32" height="12" viewBox="0 0 60 22"><rect width="60" height="22" rx="4" fill="#635BFF"/><text x="30" y="15" textAnchor="middle" fill="white" fontSize="10" fontWeight="600" fontFamily="sans-serif">stripe</text></svg>
        Paiements sécurisés par Stripe
      </div>
    </motion.div>
  )
}

/* ── CELL B : Revenue Intelligence ───────────────────────────────────── */
function CellB() {
  return (
    <motion.div {...anim(0.07)} style={{
      ...CARD, gridColumn:'span 5', height:380, borderRadius:14,
      padding:'20px 20px 0', position:'relative', overflow:'hidden',
      display:'grid', gridTemplateRows:'auto auto auto 1fr auto', gap:0,
    }}>
      <span style={{ position:'absolute', top:16, right:16, display:'grid', gridTemplateColumns:'auto 1fr', gap:4, alignItems:'center', padding:'3px 8px', borderRadius:100, background:'var(--lp-green-bg)', fontSize:10, fontWeight:600, color:'var(--lp-green)' }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--lp-green)', display:'block', animation:'lp-pulse 2s infinite' }} />Live
      </span>
      <div style={{ fontSize:12, fontWeight:700, letterSpacing:'-0.025em', color:'var(--lp-text-1)' }}>Revenue Intelligence</div>
      <div style={{ fontSize:10, fontWeight:300, color:'var(--lp-text-3)', marginTop:2, marginBottom:12 }}>Croissance en temps réel</div>
      <div>
        <span style={{ fontSize:52, fontWeight:800, letterSpacing:'-0.06em', color:'var(--lp-text-1)', lineHeight:1 }}>847</span>
        <span style={{ fontSize:12, fontWeight:300, color:'var(--lp-text-3)', marginLeft:6 }}>RDV ce mois</span>
        <div style={{ display:'inline-grid', gridTemplateColumns:'auto 1fr', gap:4, alignItems:'center', fontSize:11, fontWeight:600, color:'var(--lp-green)', background:'var(--lp-green-bg)', padding:'3px 8px', borderRadius:100, marginLeft:8 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          +12%
        </div>
      </div>
      <div style={{ position:'relative', marginLeft:-20, marginRight:-20, marginTop:10 }}>
        <svg viewBox="0 0 280 90" style={{ width:'100%', height:'100%', display:'block' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="bG2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="bL2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C3AED"/>
              <stop offset="100%" stopColor="#EC4899"/>
            </linearGradient>
          </defs>
          <path d="M0,74 C25,68 45,54 74,47 C103,39 122,43 153,35 C184,27 202,20 233,13 C252,8 266,5 280,3 L280,90 L0,90Z" fill="url(#bG2)"/>
          <path d="M0,74 C25,68 45,54 74,47 C103,39 122,43 153,35 C184,27 202,20 233,13 C252,8 266,5 280,3" fill="none" stroke="url(#bL2)" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="280" cy="3" r="3.5" fill="#EC4899">
            <animate attributeName="r" values="3.5;6;3.5" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0.35;1" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderTop:'1px solid var(--lp-border)' }}>
        {[{l:'Confirmation',v:'91%'},{l:'No-shows',v:'2%'},{l:'Acomptes',v:'4 820 €'}].map((k,i)=>(
          <div key={k.l} style={{ padding:'10px 10px 14px', borderRight:i<2?'1px solid var(--lp-border)':'none' }}>
            <div style={{ fontSize:14, fontWeight:800, letterSpacing:'-0.04em', color:'var(--lp-text-1)' }}>{k.v}</div>
            <div style={{ fontSize:9, fontWeight:300, color:'var(--lp-text-3)', marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ── CELL C : Cockpit Pro — TRUE LAYERING ─────────────────────────────── */
function CellC() {
  return (
    <motion.div {...anim(0.11)} style={{
      gridColumn:'span 12', height:480, borderRadius:14,
      background:'linear-gradient(170deg,rgba(248,245,253,0.92) 0%,rgba(244,241,250,0.96) 100%)',
      backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
      border:'1px solid rgba(124,58,237,0.1)', boxShadow:'var(--sh-float)',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'var(--lp-gradient)' }} />

      {/* Header */}
      <div style={{ padding:'22px 26px 0', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'start', position:'relative', zIndex:4 }}>
        <div>
          <p style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--lp-violet)', margin:'0 0 3px' }}>Cockpit Pro</p>
          <h3 style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.035em', color:'var(--lp-text-1)', margin:0 }}>Trois vues. Un seul endroit.</h3>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'auto auto', gap:6 }}>
          {['Multi-vue','Sync temps réel'].map(t=>(
            <span key={t} style={{ padding:'3px 9px', borderRadius:100, fontSize:10, fontWeight:600, letterSpacing:'-0.01em', background:'rgba(124,58,237,0.08)', color:'var(--lp-violet)', border:'1px solid rgba(124,58,237,0.14)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* TRUE LAYERED PANELS via position:absolute */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:380 }}>

        {/* LEFT panel — z:1 — slides under center */}
        <div style={{
          position:'absolute', bottom:0, left:26,
          width:'calc(36% + 32px)', height:296,
          background:'rgba(255,255,255,0.78)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.85)',
          borderRadius:'12px 12px 0 0',
          boxShadow:'var(--sh-panel-l)',
          zIndex:1, overflow:'hidden', padding:'14px 14px 0',
        }}>
          <div style={{ fontSize:9, fontWeight:300, color:'var(--lp-text-3)', marginBottom:2 }}>Semaine du</div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'-0.03em', color:'var(--lp-text-1)', marginBottom:10 }}>13 — 19 Jan</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:3, marginBottom:12 }}>
            {[{d:'L',n:13},{d:'M',n:14},{d:'M',n:15,a:true},{d:'J',n:16},{d:'V',n:17}].map(day=>(
              <div key={day.n} style={{ textAlign:'center', padding:'4px 0', borderRadius:6,
                background:(day as {a?:boolean}).a ? 'var(--lp-gradient)' : 'transparent',
                color:(day as {a?:boolean}).a ? 'white' : 'var(--lp-text-3)',
                fontSize:10, fontWeight:(day as {a?:boolean}).a ? 700 : 300 }}>
                <div>{day.d}</div><div style={{ fontWeight:(day as {a?:boolean}).a ? 800 : 400, marginTop:1 }}>{day.n}</div>
              </div>
            ))}
          </div>
          {[{t:'09:00',n:'Martin L.',y:'Coaching',c:'#7C3AED'},{t:'10:30',n:'Sophie D.',y:'Consultation',c:'#EC4899'},{t:'14:00',n:'Pierre B.',y:'Suivi',c:'#059669'},{t:'16:00',n:'Lucie M.',y:'Bilan',c:'#0EA5E9'}].map(r=>(
            <div key={r.t} style={{ display:'grid', gridTemplateColumns:'28px 3px 1fr', gap:'4px 6px', alignItems:'center', paddingBottom:7, marginBottom:7, borderBottom:'1px solid var(--lp-border)' }}>
              <span style={{ fontSize:9, fontWeight:400, color:'var(--lp-text-3)' }}>{r.t}</span>
              <div style={{ width:3, height:22, borderRadius:2, background:r.c }} />
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'-0.01em', color:'var(--lp-text-1)' }}>{r.n}</div>
                <div style={{ fontSize:9, fontWeight:300, color:'var(--lp-text-3)' }}>{r.y}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CENTER panel — z:3 — tallest, on top */}
        <div style={{
          position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
          width:'calc(34% + 48px)', height:362,
          background:'rgba(255,255,255,0.92)', backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
          border:'1px solid rgba(124,58,237,0.12)',
          borderRadius:'14px 14px 0 0',
          boxShadow:'0 1px 0 rgba(255,255,255,0.95) inset,0 -2px 0 rgba(124,58,237,0.08),0 -32px 80px rgba(0,0,0,0.12)',
          zIndex:3, overflow:'hidden', padding:'18px 16px 0',
        }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', marginBottom:11 }}>
            <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:9, alignItems:'center' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--lp-gradient)', display:'grid', placeItems:'center', fontSize:12, fontWeight:700, color:'white' }}>ME</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:'-0.025em', color:'var(--lp-text-1)' }}>Marc Evans</div>
                <div style={{ fontSize:9, fontWeight:300, color:'var(--lp-text-3)' }}>marc.evans@email.com</div>
              </div>
            </div>
            <span style={{ padding:'2px 6px', borderRadius:100, fontSize:8, fontWeight:700, letterSpacing:'0.06em', background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(236,72,153,0.1))', color:'var(--lp-violet)', border:'1px solid rgba(124,58,237,0.18)' }}>VIP</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5, marginBottom:11 }}>
            {[{l:'RDV total',v:'24'},{l:'Dépensé',v:'2.4k€'},{l:'Dernière',v:'2j'}].map(s=>(
              <div key={s.l} style={{ background:'rgba(18,17,26,0.03)', border:'1px solid var(--lp-border)', borderRadius:8, padding:'7px 5px', textAlign:'center' }}>
                <div style={{ fontSize:14, fontWeight:800, letterSpacing:'-0.04em', color:'var(--lp-text-1)' }}>{s.v}</div>
                <div style={{ fontSize:8, fontWeight:300, color:'var(--lp-text-3)', marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'var(--lp-gradient-soft)', border:'1px solid rgba(124,58,237,0.1)', borderRadius:9, padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', marginBottom:8 }}>
            <div>
              <div style={{ fontSize:9, fontWeight:600, color:'var(--lp-violet)' }}>Prochain RDV</div>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:'-0.025em', color:'var(--lp-text-1)', marginTop:2 }}>Lun 20 Jan · 10h30</div>
            </div>
            <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--lp-gradient)', display:'grid', placeItems:'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div style={{ padding:'6px 8px', background:'rgba(251,191,36,0.08)', borderRadius:7, border:'1px solid rgba(251,191,36,0.2)', fontSize:9, fontWeight:400, color:'#92400E', lineHeight:1.4 }}>
            Préfère créneaux du matin · Allergie au pollen
          </div>
          <div style={{ marginTop:10, fontSize:10, fontWeight:700, letterSpacing:'-0.01em', color:'var(--lp-text-1)', marginBottom:8 }}>Services</div>
          {[{n:'Coaching 1:1',p:'85€',a:true},{n:'Consultation',p:'120€',a:false},{n:'Pack 5 séances',p:'375€',a:false}].map(sv=>(
            <div key={sv.n} style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'6px 8px', borderRadius:7, marginBottom:4, background:sv.a?'var(--lp-gradient-soft)':'transparent', border:sv.a?'1px solid rgba(124,58,237,0.12)':'1px solid var(--lp-border)' }}>
              <div style={{ fontSize:10, fontWeight:sv.a?700:400, color:sv.a?'var(--lp-text-1)':'var(--lp-text-2)' }}>{sv.n}</div>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--lp-text-1)' }}>{sv.p}</div>
            </div>
          ))}
        </div>

        {/* RIGHT panel — z:2 — behind center, in front of left */}
        <div style={{
          position:'absolute', bottom:0, right:26,
          width:'calc(36% + 32px)', height:296,
          background:'rgba(255,255,255,0.78)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.85)',
          borderRadius:'12px 12px 0 0',
          boxShadow:'var(--sh-panel-r)',
          zIndex:2, overflow:'hidden', padding:'14px 14px 0',
        }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'-0.02em', color:'var(--lp-text-1)', marginBottom:3 }}>Performance hebdo</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
            {[{l:'RDV réalisés',v:'23',trend:'+3'},{l:'Chiffre semaine',v:'1 740€',trend:'+8%'},{l:'Taux remplis',v:'94%',trend:'+2pt'},{l:'Avis reçus',v:'6/6',trend:'⭐ 5.0'}].map(kpi=>(
              <div key={kpi.l} style={{ background:'rgba(18,17,26,0.03)', border:'1px solid var(--lp-border)', borderRadius:8, padding:'8px 8px' }}>
                <div style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.04em', color:'var(--lp-text-1)' }}>{kpi.v}</div>
                <div style={{ fontSize:8, fontWeight:300, color:'var(--lp-text-3)', marginTop:1 }}>{kpi.l}</div>
                <div style={{ fontSize:9, fontWeight:600, color:'var(--lp-green)', marginTop:3 }}>{kpi.trend}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--lp-text-3)', marginBottom:6 }}>Prochains créneaux libres</div>
          {['Mer 16 · 11h00','Mer 16 · 15h30','Jeu 17 · 09h00'].map(s=>(
            <div key={s} style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'6px 8px', borderRadius:7, marginBottom:4, border:'1px solid var(--lp-border)', background:'transparent' }}>
              <span style={{ fontSize:10, fontWeight:400, color:'var(--lp-text-2)' }}>{s}</span>
              <span style={{ fontSize:9, fontWeight:600, color:'var(--lp-violet)' }}>Dispo</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ── CELL D : Rappels Intelligents ───────────────────────────────────── */
function CellD() {
  const items = [
    {l:'Réservation confirmée',d:'Email + SMS immédiat',t:'J+0',done:true},
    {l:'Rappel J-1',d:'SMS automatique à 10h',t:'J-1',done:true},
    {l:'Rappel J-0',d:'Notification 2h avant',t:'2h avant',active:true},
    {l:"Demande d'avis",d:'Email post-consultation',t:'J+1'},
  ]
  return (
    <motion.div {...anim(0.16)} style={{ ...CARD, gridColumn:'span 5', height:280, borderRadius:14, padding:'18px', position:'relative', overflow:'hidden' }}>
      <span style={{ position:'absolute', top:14, right:14, padding:'3px 7px', borderRadius:100, fontSize:9, fontWeight:700, letterSpacing:'0.06em', background:'var(--lp-gradient)', color:'white' }}>IA</span>
      <div style={{ fontSize:12, fontWeight:700, letterSpacing:'-0.025em', color:'var(--lp-text-1)', marginBottom:14 }}>Rappels Intelligents</div>
      <div style={{ display:'grid', gap:0 }}>
        {items.map((item,i)=>(
          <div key={i} style={{ display:'grid', gridTemplateColumns:'18px 1fr', gap:'0 9px', marginBottom:10, position:'relative' }}>
            {i<items.length-1 && <div style={{ position:'absolute', left:8, top:18, bottom:-10, width:2, background:(item.done||item.active)?'var(--lp-violet)':'var(--lp-border)', zIndex:0 }} />}
            <div style={{ width:18, height:18, borderRadius:'50%', background:item.active?'var(--lp-gradient)':item.done?'var(--lp-violet)':'rgba(18,17,26,0.06)', display:'grid', placeItems:'center', zIndex:1, position:'relative', boxShadow:item.active?'var(--sh-violet)':'none', flexShrink:0 }}>
              {(item.done||item.active)&&<svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:item.active?700:item.done?600:400, letterSpacing:'-0.015em', color:item.done||item.active?'var(--lp-text-1)':'var(--lp-text-3)' }}>{item.l}</span>
                <span style={{ fontSize:8, fontWeight:500, color:'var(--lp-text-3)', background:'rgba(18,17,26,0.04)', padding:'1px 5px', borderRadius:100, border:'1px solid var(--lp-border)' }}>{item.t}</span>
              </div>
              <div style={{ fontSize:9, fontWeight:300, color:'var(--lp-text-3)', marginTop:1 }}>{item.d}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ── CELL E : No-show Eliminator ─────────────────────────────────────── */
function CellE() {
  return (
    <motion.div {...anim(0.2)} style={{
      gridColumn:'span 3', height:280, borderRadius:14,
      background:'rgba(124,58,237,0.06)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
      border:'1px solid rgba(124,58,237,0.1)', boxShadow:'var(--sh-card)',
      padding:24, display:'grid', gridTemplateRows:'1fr auto',
    }}>
      <div>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--lp-violet)', marginBottom:8 }}>No-show éliminé</div>
        <div style={{ fontFamily:"'Clash Display','Cabinet Grotesk',sans-serif", fontSize:64, fontWeight:800, lineHeight:1, letterSpacing:'-0.06em', color:'var(--lp-text-1)' }}>
          -73<span style={{ fontSize:34, fontWeight:700 }}>%</span>
        </div>
        <p style={{ fontSize:12, fontWeight:300, color:'var(--lp-text-2)', marginTop:8, lineHeight:1.5 }}>de rendez-vous manqués grâce aux rappels SMS automatiques.</p>
      </div>
      <div style={{ borderTop:'1px solid rgba(124,58,237,0.12)', paddingTop:9, fontSize:9, fontWeight:300, color:'var(--lp-text-3)' }}>Constaté sur 6 mois d&apos;utilisation</div>
    </motion.div>
  )
}

/* ── CELL F : Sync Universel — 3 Logos Cycle ────────────────────────── */
function CellF() {
  const [activeIndex, setActiveIndex] = React.useState(0) // 0=Google, 1=CalendaPro, 2=Apple
  
  // Cyclic animation: Google → CalendaPro → Apple → repeat
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % 3)
    }, 3000) // 3s per logo
    return () => clearInterval(interval)
  }, [])

  const logos = [
    {
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      bg: 'white',
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      ),
      bg: 'var(--lp-gradient)',
      shadow: 'var(--sh-violet)',
    },
    {
      icon: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="#1A1A1A">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.21-1.98 1.07-3.11-1.03.05-2.29.69-3.02 1.55-.67.78-1.26 2.03-1.1 3.14 1.16.09 2.34-.66 3.05-1.58z"/>
        </svg>
      ),
      bg: 'white',
    },
  ]

  const getPosition = (index: number) => {
    const diff = index - activeIndex
    if (diff === 0) return { x: 0, opacity: 1, scale: 1, zIndex: 3 }
    if (diff === 1 || diff === -2) return { x: 100, opacity: 0, scale: 0.8, zIndex: 1 } // Next (right)
    if (diff === -1 || diff === 2) return { x: -100, opacity: 0, scale: 0.8, zIndex: 1 } // Prev (left)
    return { x: 0, opacity: 0, scale: 0.8, zIndex: 0 }
  }

  return (
    <motion.div {...anim(0.23)} style={{ 
      ...CARD, gridColumn:'span 4', height:280, borderRadius:14, padding:'24px', 
      position:'relative', display:'grid', gridTemplateRows:'auto 1fr auto',
      background: 'rgba(255,255,255,0.6)', overflow: 'hidden'
    }}>
      <div style={{ fontSize:12, fontWeight:700, letterSpacing:'-0.025em', color:'var(--lp-text-1)' }}>Sync Universel</div>
      
      {/* Logo Switcher - 3 logos cycle */}
      <div style={{ position:'relative', display:'grid', placeItems:'center', overflow:'hidden' }}>
        <div style={{ position:'relative', width: 80, height: 80 }}>
          {logos.map((logo, i) => {
            const pos = getPosition(i)
            return (
              <motion.div
                key={i}
                animate={{
                  x: pos.x,
                  opacity: pos.opacity,
                  scale: pos.scale,
                }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  zIndex: pos.zIndex,
                }}
              >
                <div style={{
                  width: 72, height: 72, borderRadius: 16,
                  background: logo.bg,
                  boxShadow: logo.shadow || 'var(--sh-card)',
                  display: 'grid', placeItems: 'center',
                  border: i === 1 ? 'none' : '1px solid var(--lp-border)',
                }}>
                  {logo.icon}
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {/* Dot indicators */}
        <div style={{ position:'absolute', bottom:0, display:'flex', gap:6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius:'50%',
              background: i === activeIndex ? 'var(--lp-violet)' : 'var(--lp-border)',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Context Text */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          fontSize: 11, 
          fontWeight: 500, 
          color: '#9CA3AF', 
          fontFamily: "'Satoshi', sans-serif",
          letterSpacing: '-0.01em',
        }}>
          Synchronisation parfaite avec votre écosystème.
        </div>
      </div>
    </motion.div>
  )
}

/* ── CELL G : Pipeline de Revenus — LIGNE CONTINUE ───────────────────── */
function CellG() {
  const steps = [
    {l:'Client réserve',d:'14 Jan · 14h00',a:null,s:'done'},
    {l:'Acompte encaissé',d:'Stripe · Visa',a:'30 €',s:'done'},
    {l:'RDV effectué',d:'14 Jan · 14h00',a:null,s:'current'},
    {l:'Solde encaissé',d:'Paiement auto',a:'90 €',s:'pending'},
  ]
  const icons = [
    <svg key="0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
    <svg key="1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    <svg key="2" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
    <svg key="3" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  ]
  return (
    <motion.div {...anim(0.19)} style={{ ...CARD, gridColumn:'span 8', height:260, borderRadius:14, padding:'18px 22px', display:'grid', gridTemplateRows:'auto 1fr auto', position:'relative', overflow:'hidden' }}>
      <div style={{ fontSize:12, fontWeight:700, letterSpacing:'-0.025em', color:'var(--lp-text-1)', marginBottom:16 }}>Pipeline de Revenus</div>

      {/* CONTINUOUS track + steps */}
      <div style={{ position:'relative' }}>
        {/* Full track — single entity */}
        <div style={{ position:'absolute', top:17, left:'12.5%', right:'12.5%', height:2, background:'var(--lp-border-md)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, right:'34%', background:'linear-gradient(90deg,#7C3AED,#A855F7)', borderRadius:2 }} />
        </div>

        {/* Steps grid aligned on the track */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
          {steps.map((step,i)=>(
            <div key={i} style={{ display:'grid', justifyItems:'center', gap:6 }}>
              <div style={{
                width:34, height:34, borderRadius:'50%',
                background:step.s==='done'?'var(--lp-violet)':step.s==='current'?'var(--lp-gradient)':'rgba(255,255,255,0.6)',
                border:step.s==='pending'?'2px dashed var(--lp-border-md)':'3px solid rgba(247,245,240,1)',
                display:'grid', placeItems:'center',
                boxShadow:step.s==='current'?'var(--sh-violet)':'var(--sh-card)',
                position:'relative', zIndex:1,
                color:step.s==='pending'?'var(--lp-text-3)':'white',
              }}>
                {icons[i]}
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:10, fontWeight:step.s==='pending'?400:600, letterSpacing:'-0.015em', color:step.s==='pending'?'var(--lp-text-3)':'var(--lp-text-1)' }}>{step.l}</div>
                <div style={{ fontSize:9, fontWeight:300, color:'var(--lp-text-3)', marginTop:1 }}>{step.d}</div>
                {step.a&&<div style={{ fontSize:11, fontWeight:800, letterSpacing:'-0.03em', color:'var(--lp-green)', marginTop:3 }}>{step.a}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop:'1px solid var(--lp-border)', paddingTop:10, display:'grid', gridTemplateColumns:'1fr auto', alignItems:'baseline' }}>
        <span style={{ fontSize:10, fontWeight:300, color:'var(--lp-text-3)' }}>Total pour ce RDV</span>
        <span style={{ fontFamily:"'Clash Display','Cabinet Grotesk',sans-serif", fontSize:22, fontWeight:800, letterSpacing:'-0.05em', color:'var(--lp-text-1)', lineHeight:1 }}>
          120<span style={{ fontSize:13, fontWeight:300, color:'var(--lp-text-3)', marginLeft:2 }}>€</span>
        </span>
      </div>
    </motion.div>
  )
}

/* ── CELL H : Votre marque ───────────────────────────────────────────── */
function CellH() {
  return (
    <motion.div {...anim(0.26)} style={{
      gridColumn:'span 4', height:260, borderRadius:14,
      background:'rgba(236,72,153,0.05)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
      border:'1px solid rgba(236,72,153,0.1)', boxShadow:'var(--sh-card)',
      padding:'18px', display:'grid', gridTemplateRows:'auto auto auto 1fr', position:'relative',
    }}>
      <span style={{ position:'absolute', top:14, right:14, padding:'3px 7px', borderRadius:100, fontSize:9, fontWeight:700, letterSpacing:'0.06em', background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'white' }}>BETA</span>
      <div style={{ fontSize:12, fontWeight:700, letterSpacing:'-0.025em', color:'var(--lp-text-1)' }}>Votre marque</div>
      <div style={{ fontSize:10, fontWeight:300, color:'var(--lp-text-3)', marginTop:2, marginBottom:14 }}>Vos couleurs, votre identité</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,auto)', gap:9, justifyContent:'start', marginBottom:14 }}>
        {[{c:'#7C3AED',a:true},{c:'#EC4899',a:false},{c:'#059669',a:false}].map((sw,i)=>(
          <div key={i} style={{ width:24, height:24, borderRadius:'50%', background:sw.c, border:sw.a?'3px solid rgba(247,245,240,0.95)':'3px solid transparent', boxShadow:sw.a?`0 0 0 2px ${sw.c},var(--sh-card)`:'none', cursor:'pointer' }} />
        ))}
      </div>
      <div style={{ display:'grid', placeItems:'center', padding:'10px 0' }}>
        {/* Floating bubble button */}
        <button style={{
          padding:'12px 24px',
          background:'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
          color:'white',
          border:'none',
          borderRadius:100,
          fontSize:12,
          fontWeight:600,
          letterSpacing:'-0.01em',
          cursor:'pointer',
          boxShadow:'0 4px 20px rgba(124,58,237,0.3), 0 8px 40px rgba(236,72,153,0.2), 0 1px 0 rgba(255,255,255,0.3) inset',
          fontFamily:"'Cabinet Grotesk', sans-serif",
          transition:'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
          position:'relative',
          overflow:'hidden',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,58,237,0.4), 0 16px 60px rgba(236,72,153,0.25), 0 1px 0 rgba(255,255,255,0.3) inset'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.3), 0 8px 40px rgba(236,72,153,0.2), 0 1px 0 rgba(255,255,255,0.3) inset'
        }}
        >
          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            Réserver maintenant
          </span>
        </button>
        <div style={{ fontSize:9, fontWeight:300, color:'var(--lp-text-3)', marginTop:10, textAlign:'center' }}>Aperçu widget</div>
      </div>
    </motion.div>
  )
}

/* ── LIVE DEMO SECTION — Sharp Contrast CTA ────────────────────────── */
export function LiveDemoSection() {
  return (
    <section id="live-demo" style={{
      padding: '160px 8vw',
      background: '#F9F9FB',
      position: 'relative',
      display: 'grid',
      placeItems: 'center',
      overflow: 'hidden',
      borderTop: '4px solid rgba(0,0,0,0.06)',
      borderBottom: '4px solid rgba(0,0,0,0.06)',
      boxShadow: 'inset 0 20px 40px rgba(0,0,0,0.02)',
    }}>
      {/* Radial vignette — forces eye to center */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.04) 100%)',
      }} />
      
      {/* Abstract blurred shapes — depth of field */}
      <div style={{
        position: 'absolute',
        left: '10%',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        right: '15%',
        top: '30%',
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(124,58,237,0.08))',
        filter: 'blur(50px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        left: '20%',
        bottom: '20%',
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(124,58,237,0.08)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        style={{ textAlign: 'center', maxWidth: 600, position: 'relative', zIndex: 2 }}
      >
        {/* Subtitle — small spaced caps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          style={{
            fontFamily: "'Cabinet Grotesk', sans-serif",
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(124,58,237,0.6)',
            marginBottom: 24,
          }}
        >
          DÉMONSTRATION LIVE
        </motion.div>
        
        <h2 style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 500,
          letterSpacing: '-0.03em',
          color: '#4A4A6A',
          marginBottom: 56,
        }}>
          Découvrez l'expérience CalendaPro
        </h2>
        
        {/* Black Hole Button — Start Engine */}
        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '24px 56px',
            background: '#0D0D0D',
            color: 'white',
            border: 'none',
            borderRadius: 100,
            fontSize: '0.95rem',
            fontWeight: 500,
            fontFamily: "'Cabinet Grotesk', sans-serif",
            cursor: 'pointer',
            position: 'relative',
            letterSpacing: '-0.01em',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.1) inset,
              0 0 60px rgba(124,58,237,0.3),
              0 0 120px rgba(236,72,153,0.15),
              0 20px 60px rgba(0,0,0,0.2)
            `,
            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `
              0 0 0 1px rgba(255,255,255,0.15) inset,
              0 0 80px rgba(124,58,237,0.5),
              0 0 160px rgba(236,72,153,0.25),
              0 30px 80px rgba(0,0,0,0.25)
            `
            e.currentTarget.style.transform = 'scale(1.03)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `
              0 0 0 1px rgba(255,255,255,0.1) inset,
              0 0 60px rgba(124,58,237,0.3),
              0 0 120px rgba(236,72,153,0.15),
              0 20px 60px rgba(0,0,0,0.2)
            `
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Lancer la démo interactive
            <span style={{ fontSize: '1.2em' }}>→</span>
          </span>
        </motion.button>
      </motion.div>
    </section>
  )
}

/* ── BENTO SECTION ───────────────────────────────────────────────────── */
export function BentoGrid() {
  return (
    <section id="features" style={{ 
      padding:'80px 8vw', 
      background: '#FAF9F6',
      position:'relative',
    }}>
      {/* Grid pattern - matching hero exactly */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundSize: '40px 40px',
        backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)`,
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
      }} />
      <style>{CSS}</style>
      <div style={{ maxWidth:'1400px', margin:'0 auto' }}>
        <div style={{ marginBottom:44 }}>
          <span style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.7rem',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--lp-violet)',
            background: 'rgba(124,58,237,0.06)',
            padding: '0.4rem 0.9rem',
            borderRadius: 100,
            border: '1px solid rgba(124,58,237,0.12)',
            marginBottom: 14,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--lp-violet)' }} />
            Fonctionnalités
          </span>
          <h2 style={{ fontFamily:"'Clash Display','Cabinet Grotesk',sans-serif", fontSize:'clamp(1.7rem,2.8vw,2.5rem)', fontWeight:700, letterSpacing:'-0.05em', color:'var(--lp-text-1)', maxWidth:500, lineHeight:1.08, margin:0 }}>
            Tout ce dont vous avez besoin.<br />Rien de superflu.
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(12,1fr)', gap:12 }}>
          <CellA />
          <CellB />
          <CellC />
          <CellD />
          <CellE />
          <CellF />
          <CellG />
          <CellH />
        </div>
      </div>
    </section>
  )
}