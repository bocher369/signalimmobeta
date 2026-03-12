import { useState, useEffect, useRef } from 'react'
import {
  ExternalLink, ChevronRight, ChevronLeft, Check, AlertTriangle, Sparkles,
  CheckCircle, AlertCircle, Upload, Pencil,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

// ─── Design tokens ────────────────────────────────────────────────────────────
const MONO  = { fontFamily: 'IBM Plex Mono, monospace' }
const SANS  = { fontFamily: 'DM Sans, sans-serif' }
const DRAMA = { fontFamily: 'Playfair Display, serif', fontStyle: 'italic' as const }

const inputClass  = 'w-full bg-[#F0EFE9] border border-[#E8E6DF] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3BAF7E] focus:ring-1 focus:ring-[#3BAF7E] transition-colors'
const labelClass  = 'block text-xs font-medium text-[#6B6B6B] mb-1.5'
const cardClass   = 'bg-white rounded-2xl p-6 border border-[#E8E6DF]'

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  session: any
  onNavigate: (view: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const n = (v: any) => parseFloat(v) || 0
const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR') + ' €'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass} style={SANS}>{label}</label>
      {children}
    </div>
  )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
const STEPS = ['Identité & Bail', 'Finances', 'Analyse Gemini', 'Google Slides']

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mt-6 px-8">
      {STEPS.map((label, i) => {
        const done   = i + 1 < current
        const active = i + 1 === current
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done   ? 'bg-[#3BAF7E] text-white' :
                  active ? 'bg-[#3BAF7E] text-white ring-4 ring-[#3BAF7E]/20' :
                           'bg-[#E8E6DF] text-[#9E9E9E]'
                }`}
                style={MONO}
              >
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span
                className={`text-[10px] mt-1 whitespace-nowrap ${active ? 'text-[#3BAF7E]' : 'text-[#9E9E9E]'}`}
                style={MONO}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-2 mb-4 transition-all ${done ? 'bg-[#3BAF7E]' : 'bg-[#E8E6DF]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AcquisitionStudio({ session }: Props) {
  const [step, setStep]                   = useState<1 | 2 | 3 | 4>(1)
  const [generating, setGenerating]       = useState(false)
  const [generatingSlides, setGeneratingSlides] = useState(false)
  const [result, setResult]               = useState<any>(null)
  const [slidesUrl, setSlidesUrl]         = useState<string | null>(null)
  const [acquisitionId, setAcquisitionId] = useState<string | null>(null)
  const [toast, setToast]                 = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [bailMode, setBailMode]           = useState<'manual' | 'pdf'>('manual')
  const [extractingBail, setExtractingBail] = useState(false)
  const [pdfFile, setPdfFile]             = useState<File | null>(null)
  const fileInputRef                      = useRef<HTMLInputElement>(null)
  const [bilanMode, setBilanMode]         = useState<'manual' | 'pdf'>('manual')
  const [extractingBilan, setExtractingBilan] = useState(false)
  const [bilanFiles, setBilanFiles]       = useState<(File | null)[]>([null, null])
  const bilan1Ref                         = useRef<HTMLInputElement>(null)
  const bilan2Ref                         = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    fund_name: '', fund_address: '', fund_type: 'tabac', activity_type: '', creation_year: '',
    surface_commercial: '', surface_reserve: '',
    rent_monthly_ht: '', rent_charges: '', bail_start_date: '', bail_destination: '',
    nb_managers: '1', nb_employees: '',
    // CA commun (non-tabac ou override)
    ca_total: '', ca_bar: '', ca_autres: '',
    // CA Tabac/Presse — Production vendue (commissions)
    ca_prod_tabac: '', ca_prod_presse: '', ca_prod_fdj: '', ca_prod_pmu: '',
    ca_prod_compte_nickel: '', ca_prod_autres: '',
    // CA Tabac/Presse — Vente de marchandises
    ca_vente_acc_fumeur: '', ca_vente_ecigarette: '', ca_vente_cbd: '',
    ca_vente_boissons_ea: '', ca_vente_boissons_aa: '',
    ca_vente_boissons_psa: '', ca_vente_boissons_paa: '',
    ca_vente_papeterie: '', ca_vente_autres: '',
    purchases: '', external_charges: '', staff_costs: '', manager_remuneration: '',
    other_charges: '', net_result: '',
    restatement_manager: '', restatement_exceptional: '', restatement_notes: '',
    asking_price: '', stock_value: '',
  })

  const update = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const isTabac = formData.fund_type === 'tabac'
  const caProdTotal = n(formData.ca_prod_tabac) + n(formData.ca_prod_presse) + n(formData.ca_prod_fdj) + n(formData.ca_prod_pmu) + n(formData.ca_prod_compte_nickel) + n(formData.ca_prod_autres)
  const caVenteTotal = n(formData.ca_vente_acc_fumeur) + n(formData.ca_vente_ecigarette) + n(formData.ca_vente_cbd) + n(formData.ca_vente_boissons_ea) + n(formData.ca_vente_boissons_aa) + n(formData.ca_vente_boissons_psa) + n(formData.ca_vente_boissons_paa) + n(formData.ca_vente_papeterie) + n(formData.ca_vente_autres)
  const caTabacComputed = caProdTotal + caVenteTotal
  const effectiveCaTotal = isTabac ? (caTabacComputed || n(formData.ca_total)) : n(formData.ca_total)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // ─── Extraction bail depuis PDF ─────────────────────────────────────────────
  const extractBailFromPdf = async () => {
    if (!pdfFile) return
    setExtractingBail(true)
    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      const { data, error } = await supabase.functions.invoke('gemini-generate', {
        body: {
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64,
                }
              },
              {
                text: `Tu es un expert en baux commerciaux français. Analyse ce bail et retourne UNIQUEMENT un JSON valide sans markdown.

Extrait exactement ces informations :
{
  "surface_commercial": "surface principale en m² (nombre uniquement)",
  "surface_reserve": "surface réserve/stockage en m² (nombre uniquement, 0 si absent)",
  "rent_monthly_ht": "loyer mensuel hors taxes en euros (nombre uniquement)",
  "rent_charges": "charges locatives mensuelles en euros (nombre uniquement, 0 si absent)",
  "bail_destination": "activités autorisées par le bail (texte court)",
  "bail_start_date": "date de prise d'effet du bail au format YYYY-MM-DD",
  "nb_managers": "nombre de gérants mentionnés (1 si non précisé)",
  "nb_employees": "nombre d'employés mentionnés (0 si non précisé)"
}

Si une information est absente ou illisible, mets une chaîne vide "" pour les textes et "0" pour les nombres.`
              }
            ]
          }],
          model: 'gemini-2.0-flash',
        }
      })

      if (error) throw new Error(error.message)

      const responseData = typeof data === 'string' ? JSON.parse(data) : data
      const raw = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Réponse invalide')

      const extracted = JSON.parse(jsonMatch[0])
      setFormData(prev => ({
        ...prev,
        surface_commercial: extracted.surface_commercial || prev.surface_commercial,
        surface_reserve:    extracted.surface_reserve    || prev.surface_reserve,
        rent_monthly_ht:    extracted.rent_monthly_ht    || prev.rent_monthly_ht,
        rent_charges:       extracted.rent_charges       || prev.rent_charges,
        bail_destination:   extracted.bail_destination   || prev.bail_destination,
        bail_start_date:    extracted.bail_start_date    || prev.bail_start_date,
        nb_managers:        extracted.nb_managers        || prev.nb_managers,
        nb_employees:       extracted.nb_employees       || prev.nb_employees,
      }))
      setBailMode('manual')
      setToast({ type: 'success', message: 'Informations extraites du bail avec succès !' })
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Erreur lors de l\'extraction' })
    } finally {
      setExtractingBail(false)
    }
  }

  // ─── Extraction bilans depuis PDF ───────────────────────────────────────────
  const extractBilanFromPdf = async () => {
    const files = bilanFiles.filter(Boolean) as File[]
    if (files.length === 0) return
    setExtractingBilan(true)
    try {
      const toBase64 = async (f: File) => {
        const ab = await f.arrayBuffer()
        return btoa(String.fromCharCode(...new Uint8Array(ab)))
      }
      const parts: any[] = []
      for (const f of files) {
        parts.push({ inline_data: { mime_type: 'application/pdf', data: await toBase64(f) } })
      }
      parts.push({
        text: `Tu es un expert-comptable spécialisé en fonds de commerce français (tabac-presse, CHR). Analyse ${files.length === 2 ? 'ces 2 bilans (N-1 et N-2)' : 'ce bilan (N-1)'} et retourne UNIQUEMENT un JSON valide sans markdown.

Extrait les données du bilan N-1 (le plus récent) en priorité :
{
  "ca_total": "CA total HT en euros (nombre uniquement)",
  "ca_prod_tabac": "CA Tabac commissions en euros",
  "ca_prod_presse": "CA Presse commissions en euros",
  "ca_prod_fdj": "CA FDJ commissions en euros",
  "ca_prod_pmu": "CA PMU commissions en euros",
  "ca_prod_compte_nickel": "CA Compte Nickel/services financiers en euros",
  "ca_prod_autres": "CA autres commissions en euros",
  "ca_vente_acc_fumeur": "CA accessoires fumeur en euros",
  "ca_vente_ecigarette": "CA cigarette électronique et e-liquide en euros",
  "ca_vente_cbd": "CA CBD en euros",
  "ca_vente_boissons_ea": "CA boissons à emporter sans alcool en euros",
  "ca_vente_boissons_aa": "CA boissons à emporter avec alcool en euros",
  "ca_vente_boissons_psa": "CA boissons sur place sans alcool en euros",
  "ca_vente_boissons_paa": "CA boissons sur place avec alcool en euros",
  "ca_vente_papeterie": "CA papeterie en euros",
  "ca_vente_autres": "CA autres ventes en euros",
  "ca_bar": "CA bar/restauration en euros (si non tabac)",
  "ca_autres": "CA autres activités en euros",
  "purchases": "achats et variations de stocks en euros",
  "external_charges": "charges externes totales en euros",
  "staff_costs": "charges de personnel (hors gérant) en euros",
  "manager_remuneration": "rémunération(s) du/des gérant(s) en euros",
  "other_charges": "autres charges d'exploitation en euros",
  "net_result": "résultat net comptable en euros"
}

Si une valeur est absente ou non détectable, mets "0". Mets uniquement des nombres (pas de symbole €).`
      })

      const { data, error } = await supabase.functions.invoke('gemini-generate', {
        body: { contents: [{ parts }], model: 'gemini-2.0-flash' }
      })
      if (error) throw new Error(error.message)

      const responseData = typeof data === 'string' ? JSON.parse(data) : data
      const raw = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Réponse invalide')

      const ext = JSON.parse(jsonMatch[0])
      const pick = (k: string) => ext[k] && ext[k] !== '0' ? String(ext[k]) : ''
      setFormData(prev => ({
        ...prev,
        ca_total:              pick('ca_total')              || prev.ca_total,
        ca_prod_tabac:         pick('ca_prod_tabac')         || prev.ca_prod_tabac,
        ca_prod_presse:        pick('ca_prod_presse')        || prev.ca_prod_presse,
        ca_prod_fdj:           pick('ca_prod_fdj')           || prev.ca_prod_fdj,
        ca_prod_pmu:           pick('ca_prod_pmu')           || prev.ca_prod_pmu,
        ca_prod_compte_nickel: pick('ca_prod_compte_nickel') || prev.ca_prod_compte_nickel,
        ca_prod_autres:        pick('ca_prod_autres')        || prev.ca_prod_autres,
        ca_vente_acc_fumeur:   pick('ca_vente_acc_fumeur')   || prev.ca_vente_acc_fumeur,
        ca_vente_ecigarette:   pick('ca_vente_ecigarette')   || prev.ca_vente_ecigarette,
        ca_vente_cbd:          pick('ca_vente_cbd')          || prev.ca_vente_cbd,
        ca_vente_boissons_ea:  pick('ca_vente_boissons_ea')  || prev.ca_vente_boissons_ea,
        ca_vente_boissons_aa:  pick('ca_vente_boissons_aa')  || prev.ca_vente_boissons_aa,
        ca_vente_boissons_psa: pick('ca_vente_boissons_psa') || prev.ca_vente_boissons_psa,
        ca_vente_boissons_paa: pick('ca_vente_boissons_paa') || prev.ca_vente_boissons_paa,
        ca_vente_papeterie:    pick('ca_vente_papeterie')    || prev.ca_vente_papeterie,
        ca_vente_autres:       pick('ca_vente_autres')       || prev.ca_vente_autres,
        ca_bar:                pick('ca_bar')                || prev.ca_bar,
        ca_autres:             pick('ca_autres')             || prev.ca_autres,
        purchases:             pick('purchases')             || prev.purchases,
        external_charges:      pick('external_charges')      || prev.external_charges,
        staff_costs:           pick('staff_costs')           || prev.staff_costs,
        manager_remuneration:  pick('manager_remuneration')  || prev.manager_remuneration,
        other_charges:         pick('other_charges')         || prev.other_charges,
        net_result:            pick('net_result')            || prev.net_result,
      }))
      setBilanMode('manual')
      setToast({ type: 'success', message: `${files.length === 2 ? '2 bilans extraits' : 'Bilan extrait'} avec succès — vérifiez les données` })
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Erreur lors de l\'extraction' })
    } finally {
      setExtractingBilan(false)
    }
  }

  // ─── Génération analyse Gemini ──────────────────────────────────────────────
  const generateAnalysis = async () => {
    setGenerating(true)
    try {
      const fd = formData
      const isTabac = fd.fund_type === 'tabac'
      const caProdTotal = n(fd.ca_prod_tabac) + n(fd.ca_prod_presse) + n(fd.ca_prod_fdj) + n(fd.ca_prod_pmu) + n(fd.ca_prod_compte_nickel) + n(fd.ca_prod_autres)
      const caVenteTotal = n(fd.ca_vente_acc_fumeur) + n(fd.ca_vente_ecigarette) + n(fd.ca_vente_cbd) + n(fd.ca_vente_boissons_ea) + n(fd.ca_vente_boissons_aa) + n(fd.ca_vente_boissons_psa) + n(fd.ca_vente_boissons_paa) + n(fd.ca_vente_papeterie) + n(fd.ca_vente_autres)
      const caTotal = isTabac ? (caProdTotal + caVenteTotal || n(fd.ca_total)) : n(fd.ca_total)
      const rentAnnuel = (n(fd.rent_monthly_ht) + n(fd.rent_charges)) * 12
      const ebeComptable = caTotal - n(fd.purchases) - n(fd.external_charges) - n(fd.staff_costs) - n(fd.manager_remuneration) - n(fd.other_charges)
      const ebeRetraite = ebeComptable + n(fd.restatement_manager) + n(fd.restatement_exceptional)

      const caDetail = isTabac
        ? `  PRODUCTION VENDUE (commissions) : ${fmt(caProdTotal)}
    - Tabac : ${fd.ca_prod_tabac} €
    - Presse : ${fd.ca_prod_presse} €
    - FDJ : ${fd.ca_prod_fdj} €
    - PMU : ${fd.ca_prod_pmu} €
    - Compte-Nickel/services : ${fd.ca_prod_compte_nickel} €
    - Autres commissions : ${fd.ca_prod_autres} €
  VENTE DE MARCHANDISES : ${fmt(caVenteTotal)}
    - Accessoires fumeur : ${fd.ca_vente_acc_fumeur} €
    - Cigarette élec./e-liquide : ${fd.ca_vente_ecigarette} €
    - CBD : ${fd.ca_vente_cbd} €
    - Boissons à emporter (SA) : ${fd.ca_vente_boissons_ea} €
    - Boissons à emporter (AA) : ${fd.ca_vente_boissons_aa} €
    - Boissons sur place (SA) : ${fd.ca_vente_boissons_psa} €
    - Boissons sur place (AA) : ${fd.ca_vente_boissons_paa} €
    - Papeterie : ${fd.ca_vente_papeterie} €
    - Autres ventes : ${fd.ca_vente_autres} €`
        : `  - Bar/PMU : ${fd.ca_bar} €\n  - Autres : ${fd.ca_autres} €`

      const prompt = `Tu es un expert en cession de fonds de commerce en France. Analyse ce dossier et retourne UNIQUEMENT un JSON valide (pas de markdown, pas de texte avant ou après).

DONNÉES DU FONDS :
- Nom : ${fd.fund_name}
- Adresse : ${fd.fund_address}
- Type : ${fd.fund_type}
- Activité : ${fd.activity_type}
- Année début d'activité : ${fd.creation_year}
- Surface commerciale : ${fd.surface_commercial} m²
- Surface réserve : ${fd.surface_reserve} m²
- Loyer mensuel HT : ${fd.rent_monthly_ht} €
- Charges locatives : ${fd.rent_charges} €/mois
- Loyer annuel total : ${rentAnnuel} €
- Destination bail : ${fd.bail_destination}
- Début bail : ${fd.bail_start_date}
- Gérants : ${fd.nb_managers} / Employés : ${fd.nb_employees}
- Prix demandé : ${fd.asking_price} €
- Valeur stock : ${fd.stock_value} €

COMPTE DE RÉSULTAT N-1 :
- CA Total : ${fmt(caTotal)}
${caDetail}
- Achats/marchandises : ${fd.purchases} €
- Charges externes : ${fd.external_charges} €
- Charges personnel : ${fd.staff_costs} €
- Rémunération gérant : ${fd.manager_remuneration} €
- Autres charges : ${fd.other_charges} €
- Résultat net : ${fd.net_result} €
- EBE comptable calculé : ${ebeComptable} €

RETRAITEMENTS :
- Retraitement rémunération gérant : ${fd.restatement_manager} €
- Retraitement exceptionnel : ${fd.restatement_exceptional} €
- Notes : ${fd.restatement_notes}
- EBE retraité calculé : ${ebeRetraite} €

Retourne ce JSON exact (complète chaque champ avec des valeurs cohérentes et réalistes) :
{
  "compte_resultat": {
    "ca_total": number,
    "marge_brute": number,
    "marge_brute_pct": number,
    "ebe_comptable": number,
    "ebe_comptable_pct": number
  },
  "ebe_retraite": {
    "ebe_retraite": number,
    "ebe_retraite_pct": number,
    "detail_retraitements": string
  },
  "valorisation": {
    "methode_ebe": { "multiple_min": number, "multiple_max": number, "valeur_min": number, "valeur_max": number },
    "methode_ca": { "coefficient": number, "valeur": number, "justification": string },
    "methode_comparable": { "valeur_min": number, "valeur_max": number, "source": string },
    "fourchette_min": number,
    "fourchette_max": number,
    "prix_present": number,
    "avis_prix": string
  },
  "plan_financement": {
    "emplois": {
      "prix_fonds": number,
      "depot_garantie": number,
      "droits_enregistrement": number,
      "honoraires_juridiques": number,
      "stock": number,
      "tresorerie_depart": number,
      "total_emplois": number
    },
    "ressources": {
      "apport_min": number,
      "apport_pct": number,
      "emprunt": number,
      "duree_ans": number,
      "taux_pct": number,
      "mensualite": number,
      "total_ressources": number
    }
  },
  "cashflows": [
    { "annee": "N+1", "ca": number, "ebe": number, "annuite": number, "cashflow_net": number, "cashflow_cumul": number },
    { "annee": "N+2", "ca": number, "ebe": number, "annuite": number, "cashflow_net": number, "cashflow_cumul": number },
    { "annee": "N+3", "ca": number, "ebe": number, "annuite": number, "cashflow_net": number, "cashflow_cumul": number }
  ],
  "score_bancaire": number,
  "points_forts": [string, string, string],
  "points_vigilance": [string, string],
  "memo_bancaire": string
}`

      const { data, error } = await supabase.functions.invoke('gemini-generate', {
        body: { prompt, type: 'acquisition' },
      })
      if (error) throw new Error(error.message)

      const raw = data?.text || data?.content || ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Réponse Gemini invalide')
      const parsed = JSON.parse(jsonMatch[0])
      setResult(parsed)

      // Sauvegarder en base
      const { data: saved } = await supabase
        .from('acquisitions')
        .upsert({
          user_id:       session.user.id,
          fund_name:     fd.fund_name,
          fund_address:  fd.fund_address,
          fund_type:     fd.fund_type,
          input_data:    fd,
          financial_data:parsed.compte_resultat,
          valuation:     parsed.valorisation,
          financing_plan:parsed.plan_financement,
          cashflows:     parsed.cashflows,
          gemini_memo:   parsed.memo_bancaire,
          status:        'analyzed',
        }, { onConflict: 'id' })
        .select('id')
        .single()

      if (saved?.id) setAcquisitionId(saved.id)
      setStep(3)
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Erreur lors de l\'analyse' })
    } finally {
      setGenerating(false)
    }
  }

  // ─── Génération Google Slides ───────────────────────────────────────────────
  const generateSlides = async () => {
    setGeneratingSlides(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-slides', {
        body: { formData, analysisResult: result },
      })
      if (error) throw new Error(error.message)
      if (!data?.url) throw new Error('URL de présentation manquante')

      setSlidesUrl(data.url)

      if (acquisitionId) {
        await supabase
          .from('acquisitions')
          .update({ slides_url: data.url, status: 'complete' })
          .eq('id', acquisitionId)
      }

      setStep(4)
      setToast({ type: 'success', message: 'Présentation Google Slides créée !' })
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || 'Erreur lors de la création des slides' })
    } finally {
      setGeneratingSlides(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0EFE9]">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border flex items-center gap-2 text-sm shadow-md ${
            toast.type === 'success'
              ? 'bg-[#E8F7F1] border-[#3BAF7E]/30 text-[#2A8F62]'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
          style={SANS}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="px-8 pt-8 pb-0">
        <p className="text-xs tracking-widest text-[#9E9E9E] uppercase" style={MONO}>
          ACQUISITION STUDIO
        </p>
        <h1 className="font-bold text-3xl text-[#1A1A1A] mt-1" style={SANS}>
          Dossier d'acquisition fonds de commerce
        </h1>
        <p className="text-sm text-[#6B6B6B] mt-1" style={SANS}>
          Analyse Gemini · Valorisation · Google Slides
        </p>
      </div>

      <Stepper current={step} />

      {/* ────────────────────────────────────────────────────────────────────
          ÉTAPE 1 — Identité & Bail
      ──────────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="px-8 mt-8 pb-8 grid md:grid-cols-2 gap-6">

          {/* Identification */}
          <div className={cardClass}>
            <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>
              IDENTIFICATION
            </p>
            <div className="space-y-4">
              <Field label="Nom du fonds">
                <input className={inputClass} style={SANS} value={formData.fund_name}
                  onChange={e => update('fund_name', e.target.value)}
                  placeholder="Ex: Tabac-Presse du Centre" />
              </Field>
              <Field label="Adresse">
                <input className={inputClass} style={SANS} value={formData.fund_address}
                  onChange={e => update('fund_address', e.target.value)}
                  placeholder="1 Place de la Comédie, 34000 Montpellier" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type de fonds">
                  <select className={inputClass} style={SANS} value={formData.fund_type}
                    onChange={e => update('fund_type', e.target.value)}>
                    <option value="tabac">Tabac-Presse</option>
                    <option value="chr">CHR</option>
                    <option value="commerce">Commerce</option>
                    <option value="autre">Autre</option>
                  </select>
                </Field>
                <Field label="Activité principale">
                  <input className={inputClass} style={SANS} value={formData.activity_type}
                    onChange={e => update('activity_type', e.target.value)}
                    placeholder="Détail tabac" />
                </Field>
              </div>
              <Field label="Année de début d'activité">
                <input className={inputClass} style={SANS} value={formData.creation_year}
                  onChange={e => update('creation_year', e.target.value)}
                  placeholder="2005" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre de gérants">
                  <input className={inputClass} style={SANS} value={formData.nb_managers}
                    onChange={e => update('nb_managers', e.target.value)} placeholder="1" />
                </Field>
                <Field label="Nombre d'employés">
                  <input className={inputClass} style={SANS} value={formData.nb_employees}
                    onChange={e => update('nb_employees', e.target.value)} placeholder="2" />
                </Field>
              </div>
            </div>
          </div>

          {/* Local & Bail */}
          <div className={cardClass}>
            {/* Header + toggle */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[#9E9E9E] uppercase tracking-wider" style={MONO}>LOCAL & BAIL</p>
              <div className="flex items-center gap-1 bg-[#F0EFE9] rounded-full p-1 border border-[#E8E6DF]">
                <button
                  onClick={() => setBailMode('manual')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${bailMode === 'manual' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#9E9E9E] hover:text-[#6B6B6B]'}`}
                  style={SANS}
                >
                  <Pencil size={11} /> Manuel
                </button>
                <button
                  onClick={() => setBailMode('pdf')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${bailMode === 'pdf' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#9E9E9E] hover:text-[#6B6B6B]'}`}
                  style={SANS}
                >
                  <Upload size={11} /> Importer le bail
                </button>
              </div>
            </div>

            {/* Mode PDF */}
            {bailMode === 'pdf' && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E8E6DF] hover:border-[#3BAF7E] rounded-xl p-6 text-center cursor-pointer transition-colors group"
                >
                  <Upload size={22} className="mx-auto text-[#9E9E9E] group-hover:text-[#3BAF7E] transition-colors mb-2" />
                  {pdfFile ? (
                    <p className="text-sm text-[#1A1A1A] font-medium" style={SANS}>{pdfFile.name}</p>
                  ) : (
                    <p className="text-sm text-[#9E9E9E]" style={SANS}>Cliquez pour sélectionner le bail (PDF)</p>
                  )}
                </div>
                {pdfFile && (
                  <button
                    onClick={extractBailFromPdf}
                    disabled={extractingBail}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-[#0A1628] text-white font-bold px-6 py-3 rounded-full hover:bg-[#1a2a42] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    style={SANS}
                  >
                    {extractingBail ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Extraction en cours...
                      </>
                    ) : (
                      <><Sparkles size={14} /> Extraire les informations avec Gemini</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Champs (toujours visibles, pré-remplis si PDF extrait) */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Surface commerciale (m²)">
                  <input className={inputClass} style={SANS} value={formData.surface_commercial}
                    onChange={e => update('surface_commercial', e.target.value)} placeholder="85" />
                </Field>
                <Field label="Surface réserve (m²)">
                  <input className={inputClass} style={SANS} value={formData.surface_reserve}
                    onChange={e => update('surface_reserve', e.target.value)} placeholder="20" />
                </Field>
                <Field label="Loyer mensuel HT (€)">
                  <input className={inputClass} style={SANS} value={formData.rent_monthly_ht}
                    onChange={e => update('rent_monthly_ht', e.target.value)} placeholder="1850" />
                </Field>
                <Field label="Charges locatives (€/mois)">
                  <input className={inputClass} style={SANS} value={formData.rent_charges}
                    onChange={e => update('rent_charges', e.target.value)} placeholder="120" />
                </Field>
              </div>
              <Field label="Destination du bail">
                <input className={inputClass} style={SANS} value={formData.bail_destination}
                  onChange={e => update('bail_destination', e.target.value)}
                  placeholder="Tabac, Presse, Bar, PMU" />
              </Field>
              <Field label="Date début bail">
                <input className={inputClass} style={SANS} type="date" value={formData.bail_start_date}
                  onChange={e => update('bail_start_date', e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Nav */}
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 bg-[#3BAF7E] text-white font-bold px-8 py-3 rounded-full hover:bg-[#2A8F62] hover:scale-105 transition-all"
              style={SANS}
            >
              Étape suivante <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          ÉTAPE 2 — Finances
      ──────────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="px-8 mt-8 pb-8 space-y-6">

          {/* CA ventilé */}
          <div className={cardClass}>
              {/* Header + toggle import bilan */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-[#9E9E9E] uppercase tracking-wider" style={MONO}>CHIFFRE D'AFFAIRES VENTILÉ</p>
                <div className="flex items-center gap-1 bg-[#F0EFE9] rounded-full p-1 border border-[#E8E6DF]">
                  <button onClick={() => setBilanMode('manual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${bilanMode === 'manual' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#9E9E9E] hover:text-[#6B6B6B]'}`}
                    style={SANS}>
                    <Pencil size={11} /> Manuel
                  </button>
                  <button onClick={() => setBilanMode('pdf')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${bilanMode === 'pdf' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#9E9E9E] hover:text-[#6B6B6B]'}`}
                    style={SANS}>
                    <Upload size={11} /> Importer les bilans
                  </button>
                </div>
              </div>

              {/* Zone import bilan PDF */}
              {bilanMode === 'pdf' && (
                <div className="mb-5 space-y-3">
                  <input ref={bilan1Ref} type="file" accept="application/pdf" className="hidden"
                    onChange={e => setBilanFiles(prev => [e.target.files?.[0] ?? null, prev[1]])} />
                  <input ref={bilan2Ref} type="file" accept="application/pdf" className="hidden"
                    onChange={e => setBilanFiles(prev => [prev[0], e.target.files?.[0] ?? null])} />
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { ref: bilan1Ref, file: bilanFiles[0], label: 'Bilan N-1 (requis)' },
                      { ref: bilan2Ref, file: bilanFiles[1], label: 'Bilan N-2 (optionnel)' },
                    ].map(({ ref, file, label }) => (
                      <div key={label}
                        onClick={() => ref.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors group ${file ? 'border-[#3BAF7E] bg-[#E8F7F1]' : 'border-[#E8E6DF] hover:border-[#3BAF7E]'}`}>
                        {file ? <CheckCircle size={18} className="mx-auto text-[#3BAF7E] mb-1" /> : <Upload size={18} className="mx-auto text-[#9E9E9E] group-hover:text-[#3BAF7E] transition-colors mb-1" />}
                        <p className="text-[10px] text-[#9E9E9E] mb-0.5" style={MONO}>{label}</p>
                        <p className="text-xs font-medium text-[#1A1A1A] truncate" style={SANS}>{file ? file.name : 'Cliquer pour sélectionner'}</p>
                      </div>
                    ))}
                  </div>
                  {bilanFiles[0] && (
                    <button onClick={extractBilanFromPdf} disabled={extractingBilan}
                      className="w-full flex items-center justify-center gap-2 bg-[#0A1628] text-white font-bold px-6 py-3 rounded-full hover:bg-[#1a2a42] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      style={SANS}>
                      {extractingBilan
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Extraction en cours...</>
                        : <><Sparkles size={14} /> Extraire les données avec Gemini {bilanFiles[1] ? '(2 bilans)' : '(1 bilan)'}</>}
                    </button>
                  )}
                </div>
              )}

              {/* CA Total — affiché calculé pour tabac, saisi pour autres */}
              {isTabac ? (
                <div className="flex items-center justify-between bg-[#0A1628] rounded-xl px-5 py-3 mb-5">
                  <span className="text-xs text-[#3BAF7E]" style={MONO}>CA TOTAL CALCULÉ</span>
                  <span className="text-2xl font-bold text-white" style={DRAMA}>{fmt(caTabacComputed)}</span>
                </div>
              ) : (
                <div className="mb-4">
                  <Field label="CA Total N-1 (€)">
                    <input className={inputClass + ' text-lg font-bold'} style={SANS}
                      value={formData.ca_total} onChange={e => update('ca_total', e.target.value)} placeholder="385 000" />
                  </Field>
                </div>
              )}

              {/* Tabac/Presse — détail par sous-catégorie */}
              {isTabac && (
                <div className="space-y-4">
                  {/* Production vendue */}
                  <div className="bg-[#F0EFE9] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider" style={MONO}>PRODUCTION VENDUE — Commissions</p>
                      <span className="text-sm font-bold text-[#3BAF7E]" style={DRAMA}>{fmt(caProdTotal)}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        ['ca_prod_tabac',         'Tabac'],
                        ['ca_prod_presse',        'Presse'],
                        ['ca_prod_fdj',           'FDJ'],
                        ['ca_prod_pmu',           'PMU'],
                        ['ca_prod_compte_nickel', 'Compte-Nickel / Services'],
                        ['ca_prod_autres',        'Autres commissions'],
                      ].map(([key, label]) => (
                        <Field key={key} label={label + ' (€)'}>
                          <input className={inputClass} style={SANS}
                            value={formData[key as keyof typeof formData]}
                            onChange={e => update(key, e.target.value)} placeholder="0" />
                        </Field>
                      ))}
                    </div>
                  </div>

                  {/* Vente de marchandises */}
                  <div className="bg-[#F0EFE9] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider" style={MONO}>VENTE DE MARCHANDISES</p>
                      <span className="text-sm font-bold text-[#3BAF7E]" style={DRAMA}>{fmt(caVenteTotal)}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        ['ca_vente_acc_fumeur',   'Accessoires fumeur'],
                        ['ca_vente_ecigarette',   'Cig. élec. / E-liquide'],
                        ['ca_vente_cbd',          'CBD'],
                        ['ca_vente_boissons_ea',  'Boissons emporter SA'],
                        ['ca_vente_boissons_aa',  'Boissons emporter AA'],
                        ['ca_vente_boissons_psa', 'Boissons place SA'],
                        ['ca_vente_boissons_paa', 'Boissons place AA'],
                        ['ca_vente_papeterie',    'Papeterie'],
                        ['ca_vente_autres',       'Autres ventes'],
                      ].map(([key, label]) => (
                        <Field key={key} label={label + ' (€)'}>
                          <input className={inputClass} style={SANS}
                            value={formData[key as keyof typeof formData]}
                            onChange={e => update(key, e.target.value)} placeholder="0" />
                        </Field>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Autres types — ventilation simple */}
              {!isTabac && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['ca_bar',    'Bar/PMU (€)'],
                    ['ca_autres', 'Autres (€)'],
                  ].map(([key, label]) => (
                    <Field key={key} label={label}>
                      <input className={inputClass} style={SANS}
                        value={formData[key as keyof typeof formData]}
                        onChange={e => update(key, e.target.value)} placeholder="0" />
                    </Field>
                  ))}
                </div>
              )}
          </div>

          {/* Charges N-1 */}
          <div className={cardClass}>
            <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>
              CHARGES N-1
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ['purchases',            'Achats/marchandises (€)'],
                ['external_charges',     'Charges externes (€)'],
                ['staff_costs',          'Charges personnel (€)'],
                ['manager_remuneration', 'Rémunération gérant (€)'],
                ['other_charges',        'Autres charges (€)'],
                ['net_result',           'Résultat net (€)'],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input className={inputClass} style={SANS}
                    value={formData[key as keyof typeof formData]}
                    onChange={e => update(key, e.target.value)} placeholder="0" />
                </Field>
              ))}
            </div>
            {/* EBE calculé live */}
            {n(formData.ca_total) > 0 && (
              <div className="mt-4 bg-[#E8F7F1] rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-[#2A8F62]" style={MONO}>EBE COMPTABLE CALCULÉ</span>
                <span className="font-bold text-[#2A8F62]" style={DRAMA}>
                  {fmt(n(formData.ca_total) - n(formData.purchases) - n(formData.external_charges) - n(formData.staff_costs) - n(formData.manager_remuneration) - n(formData.other_charges))}
                </span>
              </div>
            )}
          </div>

          {/* Retraitements & Prix */}
          <div className={cardClass}>
            <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>
              RETRAITEMENTS & PRIX
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Retraitement rémunération gérant (€)">
                <input className={inputClass} style={SANS} value={formData.restatement_manager}
                  onChange={e => update('restatement_manager', e.target.value)} placeholder="0" />
              </Field>
              <Field label="Retraitement exceptionnel (€)">
                <input className={inputClass} style={SANS} value={formData.restatement_exceptional}
                  onChange={e => update('restatement_exceptional', e.target.value)} placeholder="0" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Notes de retraitements">
                <textarea className={inputClass + ' resize-none'} style={SANS} rows={2}
                  value={formData.restatement_notes}
                  onChange={e => update('restatement_notes', e.target.value)}
                  placeholder="Détaillez les retraitements opérés..." />
              </Field>
            </div>
            {/* EBE retraité live */}
            {n(formData.ca_total) > 0 && (
              <div className="mt-4 bg-[#0A1628] rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-[#3BAF7E]" style={MONO}>EBE RETRAITÉ</span>
                <span className="font-bold text-[#3BAF7E] text-xl" style={DRAMA}>
                  {fmt(
                    n(formData.ca_total) - n(formData.purchases) - n(formData.external_charges)
                    - n(formData.staff_costs) - n(formData.manager_remuneration) - n(formData.other_charges)
                    + n(formData.restatement_manager) + n(formData.restatement_exceptional)
                  )}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Field label="Prix demandé (€)">
                <input className={inputClass} style={SANS} value={formData.asking_price}
                  onChange={e => update('asking_price', e.target.value)} placeholder="320 000" />
              </Field>
              <Field label="Valeur du stock (€)">
                <input className={inputClass} style={SANS} value={formData.stock_value}
                  onChange={e => update('stock_value', e.target.value)} placeholder="8 000" />
              </Field>
            </div>
          </div>

          {/* Nav */}
          <div className="flex justify-between">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-2 border border-[#E8E6DF] text-[#6B6B6B] px-6 py-3 rounded-full hover:border-[#3BAF7E] hover:text-[#3BAF7E] transition-all text-sm"
              style={SANS}>
              <ChevronLeft size={16} /> Retour
            </button>
            <button
              onClick={generateAnalysis}
              disabled={!formData.ca_total || !formData.asking_price}
              className="flex items-center gap-2 bg-[#3BAF7E] text-white font-bold px-8 py-3 rounded-full hover:bg-[#2A8F62] hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={SANS}
            >
              <Sparkles size={16} /> Lancer l'analyse Gemini →
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          ÉTAPE 3 — Résultats Gemini
      ──────────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="px-8 mt-8 pb-8 space-y-6">

          {generating ? (
            <div className="bg-[#0A1628] rounded-2xl p-12 flex flex-col items-center justify-center min-h-[320px] gap-5">
              <div className="w-10 h-10 border-2 border-[#3BAF7E] border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-xs text-[#3BAF7E] text-center" style={MONO}>GEMINI · ANALYSE EN COURS</p>
                <p className="text-white font-bold text-xl text-center mt-2" style={SANS}>
                  Analyse Gemini en cours...
                </p>
                <p className="text-[#8899AA] text-sm text-center mt-1" style={SANS}>
                  Valorisation · Plan de financement · Cash-flows
                </p>
              </div>
            </div>
          ) : result ? (
            <>
              {/* Compte de résultat */}
              <div className={cardClass}>
                <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>
                  COMPTE DE RÉSULTAT
                </p>
                {[
                  ['CA Total',     result.compte_resultat?.ca_total,     null],
                  ['Marge Brute',  result.compte_resultat?.marge_brute,  result.compte_resultat?.marge_brute_pct],
                  ['EBE Comptable',result.compte_resultat?.ebe_comptable, result.compte_resultat?.ebe_comptable_pct],
                  ['EBE Retraité', result.ebe_retraite?.ebe_retraite,    result.ebe_retraite?.ebe_retraite_pct],
                ].map(([label, val, p], i) => {
                  const isEBE = i === 3
                  return (
                    <div key={label as string}
                      className={`flex items-center justify-between py-3 ${i < 3 ? 'border-b border-[#E8E6DF]' : 'mt-1 bg-[#E8F7F1] rounded-xl px-4'}`}>
                      <span className={`text-sm ${isEBE ? 'font-bold text-[#2A8F62]' : 'text-[#6B6B6B]'}`} style={SANS}>{label as string}</span>
                      <div className="flex items-center gap-4">
                        {p != null && <span className="text-xs text-[#9E9E9E]" style={MONO}>{typeof p === 'number' ? p.toFixed(1) + '%' : p}</span>}
                        <span className={`font-bold ${isEBE ? 'text-[#2A8F62] text-lg' : 'text-[#1A1A1A]'}`} style={isEBE ? DRAMA : SANS}>{fmt(n(val))}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Valorisation */}
              <div className={cardClass}>
                <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>VALORISATION</p>
                <div className="grid md:grid-cols-3 gap-4 mb-5">
                  {[
                    {
                      label: 'Multiple EBE',
                      val: `${fmt(result.valorisation?.methode_ebe?.valeur_min)} – ${fmt(result.valorisation?.methode_ebe?.valeur_max)}`,
                      sub: `×${result.valorisation?.methode_ebe?.multiple_min} – ×${result.valorisation?.methode_ebe?.multiple_max}`,
                    },
                    {
                      label: 'Multiple CA',
                      val: fmt(result.valorisation?.methode_ca?.valeur),
                      sub: result.valorisation?.methode_ca?.justification || '',
                    },
                    {
                      label: 'Comparables',
                      val: `${fmt(result.valorisation?.methode_comparable?.valeur_min)} – ${fmt(result.valorisation?.methode_comparable?.valeur_max)}`,
                      sub: result.valorisation?.methode_comparable?.source || '',
                    },
                  ].map((m) => (
                    <div key={m.label} className="bg-[#F0EFE9] rounded-xl p-4">
                      <p className="text-[10px] text-[#9E9E9E] uppercase" style={MONO}>{m.label}</p>
                      <p className="font-bold text-[#3BAF7E] text-lg mt-1" style={DRAMA}>{m.val}</p>
                      <p className="text-xs text-[#9E9E9E] mt-1 line-clamp-2" style={SANS}>{m.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-end justify-between bg-[#0A1628] rounded-xl px-5 py-4">
                  <div>
                    <p className="text-[10px] text-[#3BAF7E]" style={MONO}>FOURCHETTE DE VALEUR</p>
                    <p className="text-4xl font-bold text-white mt-1" style={DRAMA}>
                      {fmt(result.valorisation?.fourchette_min)} – {fmt(result.valorisation?.fourchette_max)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#4A6070]" style={MONO}>SCORE BANCAIRE</p>
                    <p className="text-3xl font-bold text-[#3BAF7E]" style={DRAMA}>{result.score_bancaire}/100</p>
                  </div>
                </div>
                {result.valorisation?.avis_prix && (
                  <p className="text-xs text-[#6B6B6B] mt-3 italic" style={SANS}>{result.valorisation.avis_prix}</p>
                )}
              </div>

              {/* Plan financement */}
              <div className={cardClass}>
                <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>PLAN DE FINANCEMENT</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: 'EMPLOIS',    rows: [
                      ['Prix du fonds',              result.plan_financement?.emplois?.prix_fonds],
                      ['Dépôt de garantie',          result.plan_financement?.emplois?.depot_garantie],
                      ["Droits d'enregistrement",    result.plan_financement?.emplois?.droits_enregistrement],
                      ['Honoraires juridiques',      result.plan_financement?.emplois?.honoraires_juridiques],
                      ['Stock',                      result.plan_financement?.emplois?.stock],
                      ['Trésorerie de départ',       result.plan_financement?.emplois?.tresorerie_depart],
                    ], total: result.plan_financement?.emplois?.total_emplois },
                    { title: 'RESSOURCES', rows: [
                      [`Apport (${result.plan_financement?.ressources?.apport_pct}%)`, result.plan_financement?.ressources?.apport_min],
                      ['Emprunt bancaire',           result.plan_financement?.ressources?.emprunt],
                      [`Durée : ${result.plan_financement?.ressources?.duree_ans} ans`, null],
                      [`Taux : ${result.plan_financement?.ressources?.taux_pct}%`,    null],
                      ['Mensualité',                 result.plan_financement?.ressources?.mensualite],
                    ], total: result.plan_financement?.ressources?.total_ressources },
                  ].map((col) => (
                    <div key={col.title} className="bg-[#F0EFE9] rounded-xl overflow-hidden">
                      <div className="bg-[#0A1628] px-4 py-2">
                        <p className="text-[10px] font-bold text-white" style={MONO}>{col.title}</p>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        {col.rows.map(([label, val]) => val != null ? (
                          <div key={label as string} className="flex justify-between text-sm">
                            <span className="text-[#6B6B6B]" style={SANS}>{label as string}</span>
                            <span className="font-medium text-[#1A1A1A]" style={SANS}>{fmt(n(val))}</span>
                          </div>
                        ) : null)}
                      </div>
                      <div className="bg-[#3BAF7E] px-4 py-2 flex justify-between">
                        <span className="text-[10px] font-bold text-white" style={MONO}>TOTAL</span>
                        <span className="text-sm font-bold text-white" style={SANS}>{fmt(n(col.total))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash-flows */}
              <div className={cardClass}>
                <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>CASH-FLOWS PRÉVISIONNELS</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={SANS}>
                    <thead>
                      <tr className="bg-[#0A1628]">
                        {['Année','CA','EBE','Annuité','CF Net','CF Cumulé'].map((h) => (
                          <th key={h} className="px-4 py-2 text-left text-[10px] text-white font-medium" style={MONO}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(result.cashflows || []).map((cf: any, i: number) => {
                        const pos = n(cf.cashflow_net) >= 0
                        return (
                          <tr key={cf.annee} className={i % 2 === 0 ? 'bg-[#F0EFE9]' : 'bg-white'}>
                            <td className="px-4 py-3 font-bold text-[#1A1A1A]" style={MONO}>{cf.annee}</td>
                            <td className="px-4 py-3 text-[#6B6B6B]">{fmt(n(cf.ca))}</td>
                            <td className="px-4 py-3 text-[#6B6B6B]">{fmt(n(cf.ebe))}</td>
                            <td className="px-4 py-3 text-[#6B6B6B]">{fmt(n(cf.annuite))}</td>
                            <td className={`px-4 py-3 font-semibold ${pos ? 'text-[#3BAF7E]' : 'text-red-500'}`}>{fmt(n(cf.cashflow_net))}</td>
                            <td className={`px-4 py-3 font-bold ${pos ? 'text-[#3BAF7E]' : 'text-red-500'}`}>{fmt(n(cf.cashflow_cumul))}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Points forts / vigilance */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className={cardClass}>
                  <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-3" style={MONO}>POINTS FORTS</p>
                  <div className="space-y-2">
                    {(result.points_forts || []).map((p: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check size={14} className="text-[#3BAF7E] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[#1A1A1A]" style={SANS}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={cardClass}>
                  <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-3" style={MONO}>POINTS DE VIGILANCE</p>
                  <div className="space-y-2">
                    {(result.points_vigilance || []).map((p: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[#1A1A1A]" style={SANS}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nav */}
              <div className="flex justify-between">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-2 border border-[#E8E6DF] text-[#6B6B6B] px-6 py-3 rounded-full hover:border-[#3BAF7E] hover:text-[#3BAF7E] transition-all text-sm"
                  style={SANS}>
                  <ChevronLeft size={16} /> Retour
                </button>
                <button
                  onClick={generateSlides}
                  className="flex items-center gap-2 bg-[#3BAF7E] text-white font-bold px-8 py-3 rounded-full hover:bg-[#2A8F62] hover:scale-105 transition-all"
                  style={SANS}
                >
                  <ExternalLink size={16} /> Générer la présentation Google Slides →
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          ÉTAPE 4 — Google Slides
      ──────────────────────────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="px-8 mt-8 pb-8">
          {generatingSlides ? (
            <div className="bg-[#0A1628] rounded-2xl p-12 flex flex-col items-center justify-center min-h-[320px] gap-5">
              <div className="w-10 h-10 border-2 border-[#3BAF7E] border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-xs text-[#3BAF7E]" style={MONO}>GOOGLE SLIDES API</p>
                <p className="text-white font-bold text-xl mt-2" style={SANS}>
                  Création de la présentation Google Slides...
                </p>
                <p className="text-[#8899AA] text-sm mt-1" style={SANS}>
                  Construction des 7 slides · Mise en page · Partage
                </p>
              </div>
            </div>
          ) : slidesUrl ? (
            <div className="bg-[#0A1628] rounded-2xl p-10 text-center max-w-2xl mx-auto">
              <p className="text-xs text-[#3BAF7E]" style={MONO}>PRÉSENTATION PRÊTE</p>
              <h2 className="font-bold text-2xl text-white mt-3" style={SANS}>
                Votre dossier Google Slides est disponible
              </h2>
              <p className="text-sm text-[#8899AA] mt-2" style={SANS}>
                7 slides · Branded Signalimmo · Partageable en 1 clic
              </p>
              <button
                onClick={() => window.open(slidesUrl, '_blank')}
                className="mt-6 flex items-center gap-2 bg-[#3BAF7E] text-white font-bold px-8 py-4 rounded-full hover:bg-[#2A8F62] hover:scale-105 transition-all mx-auto"
                style={SANS}
              >
                <ExternalLink size={18} /> Ouvrir dans Google Slides
              </button>
              <button
                onClick={() => {
                  setStep(1)
                  setResult(null)
                  setSlidesUrl(null)
                  setAcquisitionId(null)
                }}
                className="mt-3 flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-full text-sm hover:border-white/60 transition-all mx-auto"
                style={SANS}
              >
                Nouveau dossier
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
