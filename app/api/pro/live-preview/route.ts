import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

interface ServiceItem {
  name: string
  price: string | number
  duration: string
}

function btnCss(style: string, accent: string): string {
  switch (style) {
    case 'solid':
      return `background:${accent};color:#fff;border:none;`
    case 'outline':
      return `background:transparent;color:${accent};border:2px solid ${accent};`
    case 'glassmorphic':
      return `background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(255,255,255,0.2);backdrop-filter:blur(12px);`
    default:
      return `background:linear-gradient(135deg,${accent},${accent}bb);color:#fff;border:none;`
  }
}

function btnRadius(style: string): string {
  if (style === 'solid' || style === 'outline') return '10px'
  if (style === 'glassmorphic') return '14px'
  return '999px'
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  const theme     = sp.get('theme')    ?? 'minimalist'
  const accent    = sp.get('accent')   ?? '#7c3aed'
  const font      = sp.get('font')     ?? 'Inter'
  const btnStyle  = sp.get('btn')      ?? 'gradient'
  const name      = sp.get('name')     ?? 'Votre Nom'
  const metier    = sp.get('metier')   ?? 'Professionnel'
  const city      = sp.get('city')     ?? ''
  const bio       = sp.get('bio')      ?? ''
  const logoUrl   = sp.get('logo')     ?? ''
  const heroUrl   = sp.get('hero')     ?? ''
  const sections  = sp.get('sections') ?? '{}'
  const ctaText   = sp.get('ctaText')  ?? 'Réserver maintenant'
  const ctaStyle  = sp.get('ctaStyle') ?? 'gradient'
  const phone     = sp.get('phone')    ?? ''
  const address   = sp.get('address')  ?? ''
  const darkMode  = sp.get('dark')     === '1'
  const scheduleRaw = sp.get('sched')  ?? ''

  let sectionsObj: Record<string, boolean> = { about: true, reviews: true, schedule: true }
  try { sectionsObj = { ...sectionsObj, ...JSON.parse(sections) } } catch { /* ignore */ }

  type ScheduleDay = { start: string; end: string; closed: boolean }
  type WeekSchedule = Record<string, ScheduleDay>
  const DAY_LABELS: Record<string, string> = {
    lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi',
    vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche',
  }
  let scheduleData: WeekSchedule = {}
  if (scheduleRaw) {
    try { scheduleData = JSON.parse(scheduleRaw) as WeekSchedule } catch { /* ignore */ }
  }

  let services: ServiceItem[] = []
  try { services = JSON.parse(sp.get('services') ?? '[]') } catch { /* ignore */ }

  // Theme config
  type ThemeConfig = { bg: string; text: string; muted: string; border: string; dark: boolean }
  const THEMES: Record<string, ThemeConfig> = {
    minimalist:   { bg: '#f8fafc', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', dark: false },
    barber:       { bg: '#1a1a1a', text: '#f0e4cc', muted: '#9a8060', border: '#2a2010', dark: true  },
    studio_flash: { bg: '#0f0f0f', text: '#ffffff', muted: '#a1a1aa', border: '#27272a', dark: true  },
    luxury:       { bg: '#1a1a2e', text: '#f8f4e8', muted: '#9d8b6a', border: '#2a2a40', dark: true  },
    modern_grid:  { bg: '#ffffff', text: '#0a0a0a', muted: '#525252', border: '#e5e5e5', dark: false },
  }
  const baseTheme = THEMES[theme] ?? THEMES['minimalist']
  const t = darkMode
    ? { ...baseTheme, bg: '#0f0f0f', text: '#f1f5f9', muted: '#94a3b8', border: '#1e293b', dark: true }
    : baseTheme

  const cardBg    = t.dark ? 'rgba(255,255,255,0.05)' : 'white'
  const cardBorder = t.dark ? `1px solid ${t.border}` : '1px solid #f1f5f9'
  const btn = btnCss(ctaStyle || btnStyle, accent)
  const radius = btnRadius(ctaStyle || btnStyle)

  const googleFont = font.replace(' ', '+')
  const heroSection = heroUrl
    ? `<div style="width:100%;height:220px;background:url('${heroUrl}') center/cover no-repeat;border-radius:16px;margin-bottom:20px;"></div>`
    : `<div style="width:100%;height:220px;background:linear-gradient(135deg,${accent}33,${accent}11);border-radius:16px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;">
 <span style="font-size:3rem;opacity:0.3"></span>
      </div>`

  const servicesHtml = services.length > 0
    ? services.map(s => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid ${t.border};">
        <div>
          <div style="font-weight:700;font-size:0.92rem;color:${t.text}">${s.name}</div>
          <div style="font-size:0.78rem;color:${t.muted};margin-top:2px">${s.duration}</div>
        </div>
        <div style="font-weight:800;color:${accent};font-size:0.92rem">${s.price}€</div>
      </div>`).join('')
    : `<div style="color:${t.muted};font-size:0.85rem;padding:12px 0">Aucun service configuré</div>`

  const aboutHtml = sectionsObj.about && bio
    ? `<div style="background:${cardBg};border-radius:16px;padding:20px;margin-bottom:16px;border:${cardBorder}">
        <div style="font-size:0.65rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:10px">À propos</div>
        <p style="color:${t.muted};line-height:1.7;font-size:0.9rem;margin:0">${bio}</p>
      </div>` : ''

  const reviewsHtml = sectionsObj.reviews
    ? `<div style="background:${cardBg};border-radius:16px;padding:20px;margin-bottom:16px;border:${cardBorder}">
        <div style="font-size:0.65rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:14px">Avis clients</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:1.1rem">⭐⭐⭐⭐⭐</span>
          <span style="font-weight:800;color:${t.text}">5.0</span>
          <span style="color:${t.muted};font-size:0.82rem">(12 avis)</span>
        </div>
        <div style="background:${t.dark?'rgba(255,255,255,0.04)':t.bg};border-radius:12px;padding:14px;border:${cardBorder}">
          <p style="color:${t.text};font-size:0.85rem;margin:0 0 8px;line-height:1.6">"Excellent professionnel, très à l'écoute et résultats parfaits. Je recommande sans hésiter !"</p>
          <span style="color:${t.muted};font-size:0.75rem">— Sophie M. · il y a 2 jours</span>
        </div>
      </div>` : ''

  const DAYS_ORDER = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche']
  const scheduleRows = Object.keys(scheduleData).length > 0
    ? DAYS_ORDER
        .filter(d => scheduleData[d])
        .map(d => {
          const day = scheduleData[d]!
          const label = DAY_LABELS[d] ?? d
          const hours = day.closed ? 'Fermé' : `${day.start} – ${day.end}`
          return `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid ${t.border};">
            <span style="color:${t.muted};font-size:0.82rem">${label}</span>
            <span style="color:${day.closed ? t.muted : t.text};font-weight:${day.closed ? 400 : 600};font-size:0.82rem">${hours}</span>
          </div>`
        }).join('')
    : [['Lun – Ven','9h – 19h'],['Samedi','10h – 18h'],['Dimanche','Fermé']].map(([d,h]) =>
        `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid ${t.border};">
          <span style="color:${t.muted};font-size:0.82rem">${d}</span>
          <span style="color:${t.text};font-weight:600;font-size:0.82rem">${h}</span>
        </div>`
      ).join('')

  const scheduleHtml = sectionsObj.schedule
    ? `<div style="background:${cardBg};border-radius:16px;padding:20px;margin-bottom:16px;border:${cardBorder}">
        <div style="font-size:0.65rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:14px">Horaires</div>
        ${scheduleRows}
      </div>` : ''

  const locationHtml = address
    ? `<div style="background:${cardBg};border-radius:16px;padding:16px 20px;margin-bottom:16px;border:${cardBorder};display:flex;align-items:flex-start;gap:12px">
 <span style="font-size:1.1rem;margin-top:2px"></span>
        <div>
          <div style="font-size:0.84rem;color:${t.text};font-weight:600;line-height:1.5">${address}</div>
 ${phone ? `<div style="font-size:0.78rem;color:${accent};margin-top:4px"> ${phone}</div>` : ''}
        </div>
      </div>` : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=${googleFont}:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'${font}','DM Sans',sans-serif;background:${t.bg};color:${t.text};-webkit-font-smoothing:antialiased;min-height:100vh}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:${accent}44;border-radius:99px}
</style>
</head>
<body>
<div style="max-width:480px;margin:0 auto;padding:20px 16px 60px">

  <!-- Header -->
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
    ${logoUrl
      ? `<img src="${logoUrl}" alt="logo" style="width:52px;height:52px;border-radius:14px;object-fit:cover;border:2px solid ${accent}33">`
      : `<div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,${accent},${accent}bb);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.3rem;color:white;flex-shrink:0">${(name[0]??'P').toUpperCase()}</div>`}
    <div>
      <div style="font-weight:800;font-size:1.15rem;color:${t.text};line-height:1.1">${name}</div>
      <div style="color:${t.muted};font-size:0.82rem;margin-top:2px">${metier}${city ? ` · ${city}` : ''}</div>
    </div>
  </div>

  <!-- Hero -->
  ${heroSection}

  <!-- About -->
  ${aboutHtml}

  <!-- Services -->
  <div style="background:${cardBg};border-radius:16px;padding:20px;margin-bottom:16px;border:${cardBorder}">
    <div style="font-size:0.65rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${accent};margin-bottom:4px">Mes services</div>
    ${servicesHtml}
  </div>

  <!-- Reviews -->
  ${reviewsHtml}

  <!-- Schedule -->
  ${scheduleHtml}

  <!-- Location -->
  ${locationHtml}

  <!-- CTA -->
  <button style="width:100%;padding:18px;${btn}border-radius:${radius};font-size:1rem;font-weight:800;cursor:pointer;letter-spacing:0.01em;font-family:inherit;margin-top:8px;box-shadow:0 8px 32px ${accent}44">
 ${ctaText}
  </button>

  <!-- Footer -->
  <div style="text-align:center;margin-top:28px;color:${t.muted};font-size:0.72rem">
    Propulsé par <span style="color:${accent};font-weight:700">CalendaPro</span>
  </div>
</div>

<script>
window.addEventListener('message',function(e){
  var p=e.data&&e.data.payload;
  if(!p||e.data.type!=='PREVIEW_UPDATE')return;
  document.body.style.opacity='0.6';
  setTimeout(function(){document.body.style.opacity='1';},120);
});
</script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-store',
    },
  })
}
