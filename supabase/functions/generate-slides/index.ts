import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const EMU = 914400
const toBase64Url = (obj: object) =>
  btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const header = { alg: 'RS256', typ: 'JWT' }
  const headerB64 = toBase64Url(header)
  const payloadB64 = toBase64Url(payload)
  const signingInput = `${headerB64}.${payloadB64}`

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const encoder = new TextEncoder()
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signingInput)
  )
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const jwt = `${signingInput}.${signatureB64}`

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const { access_token } = await tokenResp.json()
  return access_token
}

// ─── Slide builder helpers ───────────────────────────────────────────────────

type RGB = { red: number; green: number; blue: number }

const NIGHT:  RGB = { red: 0.039, green: 0.086, blue: 0.157 }
const GREEN:  RGB = { red: 0.231, green: 0.686, blue: 0.494 }
const IVOIRE: RGB = { red: 0.941, green: 0.937, blue: 0.914 }
const WHITE:  RGB = { red: 1,     green: 1,     blue: 1     }
const INK:    RGB = { red: 0.102, green: 0.102, blue: 0.102 }
const GREY:   RGB = { red: 0.6,   green: 0.6,   blue: 0.6   }

function makeTextBox(
  id: string,
  text: string,
  x: number, y: number, w: number, h: number,
  fontSize: number,
  bold: boolean,
  color: RGB,
  bgColor?: RGB,
  italic = false,
  fontFamily = 'DM Sans',
  pageId = '__PAGE__'
): any[] {
  const reqs: any[] = [
    {
      createShape: {
        objectId: id,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: pageId,
          size: {
            width:  { magnitude: w, unit: 'EMU' },
            height: { magnitude: h, unit: 'EMU' },
          },
          transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: 'EMU' },
        },
      },
    },
    { insertText: { objectId: id, text } },
    {
      updateTextStyle: {
        objectId: id,
        style: {
          fontSize:        { magnitude: fontSize, unit: 'PT' },
          bold,
          italic,
          fontFamily,
          foregroundColor: { opaqueColor: { rgbColor: color } },
        },
        fields: 'fontSize,bold,italic,fontFamily,foregroundColor',
      },
    },
  ]
  if (bgColor) {
    reqs.push({
      updateShapeProperties: {
        objectId: id,
        shapeProperties: {
          shapeBackgroundFill: { solidFill: { color: { rgbColor: bgColor } } },
        },
        fields: 'shapeBackgroundFill',
      },
    })
  }
  return reqs
}

function addSlide(requests: any[], index: number, slideId: string, bg: RGB) {
  requests.push({
    insertSlide: {
      insertionIndex: index,
      slideLayoutReference: { predefinedLayout: 'BLANK' },
      objectId: slideId,
    },
  })
  requests.push({
    updatePageProperties: {
      objectId: slideId,
      pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: bg } } } },
      fields: 'pageBackgroundFill',
    },
  })
}

function pushBoxes(requests: any[], boxes: any[][], pageId: string) {
  boxes.forEach((group) =>
    group.forEach((req) => {
      if (req.createShape) req.createShape.elementProperties.pageObjectId = pageId
      requests.push(req)
    })
  )
}

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' €'
const pct = (n: number, tot: number) =>
  tot > 0 ? (n / tot * 100).toFixed(1) + '%' : '—'

// ─── Main ────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Auth Supabase
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: corsHeaders,
      })
    }

    // 2. Body
    const { formData: fd, analysisResult: r } = await req.json()

    // 3. Google auth
    const serviceAccount = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT')!)
    const access_token = await getGoogleAccessToken(serviceAccount)
    const gHeaders = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    }

    // 4. Créer la présentation vide
    const createResp = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: gHeaders,
      body: JSON.stringify({ title: `Dossier Acquisition — ${fd.fund_name}` }),
    })
    const presentation = await createResp.json()
    const presentationId = presentation.presentationId
    const slide1Id = presentation.slides[0].objectId

    // 5. Construire les requests
    const allRequests: any[] = []

    // ── SLIDE 1 — Cover (fond nuit) ──────────────────────────────────────
    allRequests.push({
      updatePageProperties: {
        objectId: slide1Id,
        pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: NIGHT } } } },
        fields: 'pageBackgroundFill',
      },
    })
    pushBoxes(allRequests, [
      makeTextBox('s1_badge',  'CONFIDENTIEL · DOSSIER ACQUISITION', 0.4*EMU, 0.3*EMU,  5*EMU, 0.35*EMU,  9, false, WHITE,  GREEN),
      makeTextBox('s1_title',  fd.fund_name || 'Fonds de Commerce',  0.4*EMU, 1.2*EMU,  6*EMU, 1.2*EMU,  40, true,  WHITE,  undefined, false, 'DM Sans'),
      makeTextBox('s1_sub',    `${fd.fund_address || ''} · ${fd.fund_type?.toUpperCase() || ''}`, 0.4*EMU, 2.5*EMU, 6*EMU, 0.5*EMU, 16, false, GREEN),
      makeTextBox('s1_tag',    "De l'annonce au financement. Un seul outil.", 0.4*EMU, 3.1*EMU, 5*EMU, 0.4*EMU, 13, false, GREY, undefined, true),
      makeTextBox('s1_price',  `${parseInt(fd.asking_price || '0').toLocaleString('fr-FR')} €`, 0.4*EMU, 3.7*EMU, 4*EMU, 0.9*EMU, 52, true, GREEN, undefined, true),
      makeTextBox('s1_plbl',   'PRIX DE PRÉSENTATION', 0.4*EMU, 4.5*EMU, 4*EMU, 0.3*EMU, 10, false, GREY),
      makeTextBox('s1_brand',  'Signalimmo', 7.5*EMU, 4.9*EMU, 2*EMU, 0.4*EMU, 14, true, GREEN),
      makeTextBox('s1_date',   new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), 0.4*EMU, 4.9*EMU, 3*EMU, 0.3*EMU, 10, false, GREY),
    ], slide1Id)

    // ── SLIDE 2 — Résumé exécutif (fond ivoire) ─────────────────────────
    addSlide(allRequests, 1, 's2', IVOIRE)
    pushBoxes(allRequests, [
      makeTextBox('s2_lbl',   'RÉSUMÉ EXÉCUTIF', 0.4*EMU, 0.25*EMU, 5*EMU, 0.3*EMU, 9, false, GREEN),
      makeTextBox('s2_title', "4 raisons d'acquérir ce fonds", 0.4*EMU, 0.6*EMU, 8*EMU, 0.7*EMU, 28, true, NIGHT),
      makeTextBox('s2_k1v',  fmt(r?.compte_resultat?.ca_total || 0), 0.4*EMU, 1.5*EMU, 2*EMU, 0.7*EMU, 32, true, NIGHT, undefined, true),
      makeTextBox('s2_k1l',  "CHIFFRE D'AFFAIRES", 0.4*EMU, 2.15*EMU, 2*EMU, 0.3*EMU, 9, false, GREY),
      makeTextBox('s2_k2v',  fmt(r?.ebe_retraite?.ebe_retraite || 0), 2.6*EMU, 1.5*EMU, 2.2*EMU, 0.7*EMU, 32, true, GREEN, undefined, true),
      makeTextBox('s2_k2l',  'EBE RETRAITÉ', 2.6*EMU, 2.15*EMU, 2.2*EMU, 0.3*EMU, 9, false, GREY),
      makeTextBox('s2_k3v',  `${r?.score_bancaire || 0}/100`, 5*EMU, 1.5*EMU, 2*EMU, 0.7*EMU, 32, true, NIGHT, undefined, true),
      makeTextBox('s2_k3l',  'SCORE BANCAIRE', 5*EMU, 2.15*EMU, 2*EMU, 0.3*EMU, 9, false, GREY),
      makeTextBox('s2_k4v',  fmt(r?.plan_financement?.ressources?.apport_min || 0), 7.2*EMU, 1.5*EMU, 2.2*EMU, 0.7*EMU, 32, true, NIGHT, undefined, true),
      makeTextBox('s2_k4l',  'APPORT MINIMUM', 7.2*EMU, 2.15*EMU, 2.2*EMU, 0.3*EMU, 9, false, GREY),
      makeTextBox('s2_pts',  (r?.points_forts || []).map((p: string, i: number) => `${['①','②','③'][i]} ${p}`).join('\n'), 0.4*EMU, 2.7*EMU, 5.5*EMU, 1.8*EMU, 12, false, INK),
      makeTextBox('s2_vtit', '⚠ POINTS DE VIGILANCE', 6.2*EMU, 2.7*EMU, 3.2*EMU, 0.3*EMU, 9, true, { red: 0.8, green: 0.4, blue: 0.1 }),
      makeTextBox('s2_vbody',(r?.points_vigilance || []).map((p: string) => `• ${p}`).join('\n'), 6.2*EMU, 3.1*EMU, 3.2*EMU, 1.4*EMU, 11, false, INK),
      makeTextBox('s2_foot', 'Signalimmo · Document confidentiel', 0.4*EMU, 4.9*EMU, 9*EMU, 0.3*EMU, 9, false, GREY),
    ], 's2')

    // ── SLIDE 3 — Compte de résultat (fond blanc) ────────────────────────
    addSlide(allRequests, 2, 's3', WHITE)
    const caTotal   = r?.compte_resultat?.ca_total || 0
    const margeBrute = r?.compte_resultat?.marge_brute || 0
    const ebeCpt    = r?.compte_resultat?.ebe_comptable || 0
    const ebeRet    = r?.ebe_retraite?.ebe_retraite || 0
    const crBoxes: any[][] = [
      makeTextBox('s3_lbl',    'ANALYSE FINANCIÈRE', 0.4*EMU, 0.25*EMU, 5*EMU, 0.3*EMU, 9, false, GREEN),
      makeTextBox('s3_title',  'Compte de Résultat N-1', 0.4*EMU, 0.6*EMU, 8*EMU, 0.6*EMU, 28, true, NIGHT),
      makeTextBox('s3_action', `Un CA de ${fmt(caTotal)} génère un EBE retraité de ${fmt(ebeRet)} (${pct(ebeRet, caTotal)})`, 0.4*EMU, 1.2*EMU, 8.5*EMU, 0.45*EMU, 14, false, { red: 0.3, green: 0.3, blue: 0.3 }, undefined, true),
    ]
    const crRows: [string, string, string][] = [
      ["CHIFFRE D'AFFAIRES", fmt(caTotal),   '100%'],
      ['Marge Brute',        fmt(margeBrute), pct(margeBrute, caTotal)],
      ['EBE Comptable',      fmt(ebeCpt),     pct(ebeCpt, caTotal)],
      ['EBE RETRAITÉ',       fmt(ebeRet),     pct(ebeRet, caTotal)],
    ]
    crRows.forEach(([label, val, p], i) => {
      const y = (2.0 + i * 0.65) * EMU
      const isEBE = i === 3
      const bg = isEBE ? { red: 0.91, green: 0.97, blue: 0.945 } : (i % 2 === 0 ? IVOIRE : WHITE)
      const col = isEBE ? GREEN : INK
      crBoxes.push(makeTextBox(`s3_r${i}a`, label,  0.4*EMU, y, 5*EMU,  0.55*EMU, isEBE ? 13 : 12, isEBE, col, bg))
      crBoxes.push(makeTextBox(`s3_r${i}b`, val,    5.5*EMU, y, 2*EMU,  0.55*EMU, isEBE ? 14 : 13, isEBE, col, bg))
      crBoxes.push(makeTextBox(`s3_r${i}c`, p,      7.6*EMU, y, 1.5*EMU,0.55*EMU, 11, false, GREY, bg))
    })
    crBoxes.push(makeTextBox('s3_foot', 'Signalimmo · Document confidentiel', 0.4*EMU, 4.9*EMU, 9*EMU, 0.3*EMU, 9, false, GREY))
    pushBoxes(allRequests, crBoxes, 's3')

    // ── SLIDE 4 — Valorisation (fond blanc) ─────────────────────────────
    addSlide(allRequests, 3, 's4', WHITE)
    const val = r?.valorisation || {}
    const valBoxes: any[][] = [
      makeTextBox('s4_lbl',    'VALORISATION', 0.4*EMU, 0.25*EMU, 5*EMU, 0.3*EMU, 9, false, GREEN),
      makeTextBox('s4_title',  'Méthodologie de Valorisation', 0.4*EMU, 0.6*EMU, 8*EMU, 0.6*EMU, 28, true, NIGHT),
      makeTextBox('s4_action', `Les 3 méthodes convergent vers une fourchette de ${fmt(val.fourchette_min || 0)} à ${fmt(val.fourchette_max || 0)}`, 0.4*EMU, 1.2*EMU, 8.5*EMU, 0.45*EMU, 14, false, { red: 0.3, green: 0.3, blue: 0.3 }, undefined, true),
      makeTextBox('s4_m1t',    'Multiple EBE', 0.4*EMU, 1.9*EMU, 2.8*EMU, 0.35*EMU, 12, true, NIGHT, IVOIRE),
      makeTextBox('s4_m1v',    `${fmt(val.methode_ebe?.valeur_min || 0)} — ${fmt(val.methode_ebe?.valeur_max || 0)}`, 0.4*EMU, 2.3*EMU, 2.8*EMU, 0.5*EMU, 16, true, GREEN, IVOIRE, true),
      makeTextBox('s4_m1s',    `×${val.methode_ebe?.multiple_min || 3.5} à ×${val.methode_ebe?.multiple_max || 5} l'EBE retraité`, 0.4*EMU, 2.85*EMU, 2.8*EMU, 0.4*EMU, 10, false, GREY, IVOIRE),
      makeTextBox('s4_m2t',    'Multiple CA', 3.4*EMU, 1.9*EMU, 2.8*EMU, 0.35*EMU, 12, true, NIGHT, IVOIRE),
      makeTextBox('s4_m2v',    fmt(val.methode_ca?.valeur || 0), 3.4*EMU, 2.3*EMU, 2.8*EMU, 0.5*EMU, 16, true, GREEN, IVOIRE, true),
      makeTextBox('s4_m2s',    val.methode_ca?.justification || '', 3.4*EMU, 2.85*EMU, 2.8*EMU, 0.4*EMU, 10, false, GREY, IVOIRE),
      makeTextBox('s4_m3t',    'Comparables marché', 6.4*EMU, 1.9*EMU, 2.8*EMU, 0.35*EMU, 12, true, NIGHT, IVOIRE),
      makeTextBox('s4_m3v',    `${fmt(val.methode_comparable?.valeur_min || 0)} — ${fmt(val.methode_comparable?.valeur_max || 0)}`, 6.4*EMU, 2.3*EMU, 2.8*EMU, 0.5*EMU, 16, true, GREEN, IVOIRE, true),
      makeTextBox('s4_m3s',    val.methode_comparable?.source || '', 6.4*EMU, 2.85*EMU, 2.8*EMU, 0.4*EMU, 10, false, GREY, IVOIRE),
      makeTextBox('s4_plbl',   'PRIX DE PRÉSENTATION RETENU', 0.4*EMU, 3.5*EMU, 5*EMU, 0.3*EMU, 9, false, WHITE, NIGHT),
      makeTextBox('s4_pval',   fmt(val.prix_present || parseFloat(fd.asking_price || '0')), 0.4*EMU, 3.85*EMU, 5*EMU, 0.75*EMU, 42, true, GREEN, NIGHT, true),
      makeTextBox('s4_avis',   val.avis_prix || '', 5.6*EMU, 3.5*EMU, 3.8*EMU, 1.1*EMU, 11, false, INK, { red: 0.95, green: 0.97, blue: 0.96 }),
      makeTextBox('s4_foot',   'Signalimmo · Document confidentiel', 0.4*EMU, 4.9*EMU, 9*EMU, 0.3*EMU, 9, false, GREY),
    ]
    pushBoxes(allRequests, valBoxes, 's4')

    // ── SLIDE 5 — Plan de financement (fond ivoire) ──────────────────────
    addSlide(allRequests, 4, 's5', IVOIRE)
    const pf  = r?.plan_financement || {}
    const emp = pf.emplois   || {}
    const res = pf.ressources || {}
    const finBoxes: any[][] = [
      makeTextBox('s5_lbl',    'PLAN DE FINANCEMENT', 0.4*EMU, 0.25*EMU, 5*EMU, 0.3*EMU, 9, false, GREEN),
      makeTextBox('s5_title',  'Structure de Financement', 0.4*EMU, 0.6*EMU, 8*EMU, 0.6*EMU, 28, true, NIGHT),
      makeTextBox('s5_action', `Financement bancaire sur ${res.duree_ans || 7} ans · Mensualité ${fmt(res.mensualite || 0)} · Apport ${res.apport_pct || 25}%`, 0.4*EMU, 1.2*EMU, 8.5*EMU, 0.45*EMU, 14, false, { red: 0.3, green: 0.3, blue: 0.3 }, undefined, true),
      makeTextBox('s5_etit',   'EMPLOIS', 0.4*EMU, 1.85*EMU, 4.2*EMU, 0.35*EMU, 10, true, WHITE, NIGHT),
      makeTextBox('s5_erows',  [
        `Prix du fonds                 ${fmt(emp.prix_fonds || 0)}`,
        `Dépôt de garantie             ${fmt(emp.depot_garantie || 0)}`,
        `Droits d'enregistrement (3%) ${fmt(emp.droits_enregistrement || 0)}`,
        `Honoraires juridiques         ${fmt(emp.honoraires_juridiques || 0)}`,
        `Stock taxable                 ${fmt(emp.stock || 0)}`,
        `Trésorerie de départ          ${fmt(emp.tresorerie_depart || 0)}`,
      ].join('\n'), 0.4*EMU, 2.25*EMU, 4.2*EMU, 2*EMU, 11, false, INK, WHITE),
      makeTextBox('s5_etot',   `TOTAL EMPLOIS    ${fmt(emp.total_emplois || 0)}`, 0.4*EMU, 4.3*EMU, 4.2*EMU, 0.4*EMU, 12, true, WHITE, GREEN),
      makeTextBox('s5_rtit',   'RESSOURCES', 5*EMU, 1.85*EMU, 4.2*EMU, 0.35*EMU, 10, true, WHITE, NIGHT),
      makeTextBox('s5_rrows',  [
        `Apport personnel (${res.apport_pct || 25}%)       ${fmt(res.apport_min || 0)}`,
        `Emprunt bancaire               ${fmt(res.emprunt || 0)}`,
        `Durée                          ${res.duree_ans || 7} ans`,
        `Taux estimé                    ${res.taux_pct || 4.5}%`,
        `Mensualité                     ${fmt(res.mensualite || 0)}`,
      ].join('\n'), 5*EMU, 2.25*EMU, 4.2*EMU, 2*EMU, 11, false, INK, WHITE),
      makeTextBox('s5_rtot',   `TOTAL RESSOURCES    ${fmt(res.total_ressources || 0)}`, 5*EMU, 4.3*EMU, 4.2*EMU, 0.4*EMU, 12, true, WHITE, GREEN),
      makeTextBox('s5_foot',   'Signalimmo · Document confidentiel', 0.4*EMU, 4.9*EMU, 9*EMU, 0.3*EMU, 9, false, GREY),
    ]
    pushBoxes(allRequests, finBoxes, 's5')

    // ── SLIDE 6 — Cash-flows (fond blanc) ────────────────────────────────
    addSlide(allRequests, 5, 's6', WHITE)
    const cfs = r?.cashflows || []
    const cfBoxes: any[][] = [
      makeTextBox('s6_lbl',    'PROJECTIONS', 0.4*EMU, 0.25*EMU, 5*EMU, 0.3*EMU, 9, false, GREEN),
      makeTextBox('s6_title',  'Cash-Flows Prévisionnels N+1 à N+3', 0.4*EMU, 0.6*EMU, 8*EMU, 0.6*EMU, 28, true, NIGHT),
      makeTextBox('s6_action', `Trésorerie cumulée à fin N+3 : ${fmt(cfs[2]?.cashflow_cumul || 0)} · Hypothèse croissance CA +2%/an`, 0.4*EMU, 1.2*EMU, 8.5*EMU, 0.45*EMU, 14, false, { red: 0.3, green: 0.3, blue: 0.3 }, undefined, true),
      makeTextBox('s6_hdr',    'ANNÉE          CA PRÉV.         EBE PRÉV.        ANNUITÉ          CF NET           CF CUMULÉ', 0.4*EMU, 1.85*EMU, 9*EMU, 0.4*EMU, 10, true, WHITE, NIGHT),
    ]
    cfs.forEach((cf: any, i: number) => {
      const y = (2.35 + i * 0.65) * EMU
      const bg = i % 2 === 0 ? IVOIRE : WHITE
      const cfNet = cf.cashflow_net || 0
      const col = i === 2 ? GREEN : INK
      cfBoxes.push(makeTextBox(`s6_r${i}`,
        `${cf.annee}          ${fmt(cf.ca || 0)}          ${fmt(cf.ebe || 0)}          ${fmt(cf.annuite || 0)}          ${fmt(cfNet)}          ${fmt(cf.cashflow_cumul || 0)}`,
        0.4*EMU, y, 9*EMU, 0.55*EMU, 11, i === 2, col, bg
      ))
    })
    cfBoxes.push(makeTextBox('s6_foot', 'Signalimmo · Document confidentiel', 0.4*EMU, 4.9*EMU, 9*EMU, 0.3*EMU, 9, false, GREY))
    pushBoxes(allRequests, cfBoxes, 's6')

    // ── SLIDE 7 — Mémo bancaire (fond nuit) ──────────────────────────────
    addSlide(allRequests, 6, 's7', NIGHT)
    const memo = r?.memo_bancaire || ''
    const memoShort = memo.length > 600 ? memo.substring(0, 600) + '...' : memo
    pushBoxes(allRequests, [
      makeTextBox('s7_lbl',   'MÉMO BANCAIRE', 0.4*EMU, 0.25*EMU, 5*EMU, 0.3*EMU, 9, false, GREEN),
      makeTextBox('s7_title', 'Synthèse pour Partenaires Financiers', 0.4*EMU, 0.6*EMU, 8*EMU, 0.6*EMU, 28, true, WHITE),
      makeTextBox('s7_conf',  'CONFIDENTIEL · USAGE BANCAIRE UNIQUEMENT', 6*EMU, 0.25*EMU, 3.5*EMU, 0.3*EMU, 9, true, WHITE, { red: 0.8, green: 0.2, blue: 0.2 }),
      makeTextBox('s7_body',  memoShort, 0.4*EMU, 1.4*EMU, 9*EMU, 3.2*EMU, 11, false, { red: 0.85, green: 0.9, blue: 0.88 }),
      makeTextBox('s7_score', `SCORE BANCAIRE : ${r?.score_bancaire || 0}/100`, 0.4*EMU, 4.6*EMU, 3*EMU, 0.4*EMU, 14, true, GREEN),
      makeTextBox('s7_foot',  `Signalimmo · ${new Date().toLocaleDateString('fr-FR')} · Document confidentiel`, 4*EMU, 4.9*EMU, 5.5*EMU, 0.3*EMU, 9, false, { red: 0.4, green: 0.5, blue: 0.6 }),
    ], 's7')

    // 6. batchUpdate
    const batchResp = await fetch(
      `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
      { method: 'POST', headers: gHeaders, body: JSON.stringify({ requests: allRequests }) }
    )
    const batchResult = await batchResp.json()
    if (batchResult.error) throw new Error(batchResult.error.message)

    // 7. Permission publique
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${presentationId}/permissions`,
      {
        method: 'POST',
        headers: gHeaders,
        body: JSON.stringify({ role: 'writer', type: 'anyone' }),
      }
    )

    return new Response(
      JSON.stringify({
        success: true,
        url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
        presentationId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('generate-slides error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
