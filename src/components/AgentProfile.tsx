import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Save } from 'lucide-react'
import { supabase } from '../supabaseClient'

const MONO = { fontFamily: 'IBM Plex Mono, monospace' }
const SANS = { fontFamily: 'DM Sans, sans-serif' }

interface Props {
  session: any
  onNavigate: (view: string) => void
}

const SPECIALIZATIONS = [
  'Fonds de commerce',
  'Tabac-Presse',
  'CHR',
  'Commerce de proximité',
  'Immeuble de rapport',
  'Local commercial',
]

const TONES = [
  { value: 'professionnel', label: 'Professionnel', sub: 'sobre et factuel' },
  { value: 'dynamique',     label: 'Dynamique',     sub: 'moderne et direct' },
  { value: 'premium',       label: 'Premium',        sub: 'haut de gamme' },
  { value: 'proximite',     label: 'Proximité',      sub: 'chaleureux et humain' },
]

const INPUT_CLASS =
  'w-full bg-[#F0EFE9] border border-[#E8E6DF] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3BAF7E] focus:ring-1 focus:ring-[#3BAF7E] transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6B6B6B] mb-1" style={SANS}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function AgentProfile({ session }: Props) {
  const [profile, setProfile] = useState({
    agency_name: '',
    agent_first_name: '',
    agent_last_name: '',
    agent_phone: '',
    agent_email: '',
    logo_url: '',
    brand_primary_color: '#3BAF7E',
    brand_secondary_color: '#0A1628',
    preferred_tone: 'professionnel',
    specializations: [] as string[],
    coverage_zones: [] as string[],
    bio: '',
  })
  const [plan, setPlan] = useState('starter')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Load profile on mount
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('agent_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        setPlan(data.plan ?? 'starter')
        setProfile({
          agency_name:          data.agency_name          ?? '',
          agent_first_name:     data.agent_first_name     ?? '',
          agent_last_name:      data.agent_last_name      ?? '',
          agent_phone:          data.agent_phone          ?? '',
          agent_email:          data.agent_email          ?? '',
          logo_url:             data.logo_url             ?? '',
          brand_primary_color:  data.brand_primary_color  ?? '#3BAF7E',
          brand_secondary_color:data.brand_secondary_color?? '#0A1628',
          preferred_tone:       data.preferred_tone       ?? 'professionnel',
          specializations:      data.specializations      ?? [],
          coverage_zones:       data.coverage_zones       ?? [],
          bio:                  data.bio                  ?? '',
        })
      }
      setLoading(false)
    }
    fetch()
  }, [session.user.id])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const set = (key: string, value: any) =>
    setProfile(prev => ({ ...prev, [key]: value }))

  const toggleSpec = (spec: string) => {
    setProfile(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('agent_profiles')
      .upsert({ ...profile, user_id: session.user.id }, { onConflict: 'user_id' })

    setSaving(false)
    if (error) {
      setToast({ type: 'error', message: 'Erreur lors de la sauvegarde. Réessayez.' })
    } else {
      setToast({ type: 'success', message: 'Profil sauvegardé avec succès.' })
    }
  }

  // ─── Loading skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-8 pt-8 pb-8 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#E8E6DF] rounded-2xl animate-pulse h-48" />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0EFE9]">

      {/* ─── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border flex items-center gap-2 text-sm shadow-md ${
            toast.type === 'success'
              ? 'bg-[#E8F7F1] border-[#3BAF7E]/30 text-[#2A8F62]'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
          style={SANS}
        >
          {toast.type === 'success'
            ? <CheckCircle size={16} />
            : <AlertCircle size={16} />
          }
          {toast.message}
        </div>
      )}

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-0 flex justify-between items-start">
        <div>
          <p className="text-xs tracking-widest text-[#9E9E9E] uppercase" style={MONO}>
            PROFIL AGENCE
          </p>
          <h1 className="font-bold text-3xl text-[#1A1A1A] mt-1" style={SANS}>
            Mon identité professionnelle
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1" style={SANS}>
            Ces informations personnalisent toutes vos productions Signalimmo
          </p>
        </div>
        <span
          className="text-xs bg-[#E8F7F1] text-[#3BAF7E] border border-[#3BAF7E]/30 px-3 py-1 rounded-full uppercase mt-1"
          style={MONO}
        >
          {plan}
        </span>
      </div>

      {/* ─── Formulaire ─────────────────────────────────────────────────── */}
      <div className="px-8 pb-8 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CARTE 1 — Identité */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E6DF]">
          <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>
            01 · IDENTITÉ
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Nom de l'agence">
                <input
                  className={INPUT_CLASS}
                  style={SANS}
                  value={profile.agency_name}
                  onChange={e => set('agency_name', e.target.value)}
                  placeholder="Ex: Agence Dupont Immobilier"
                />
              </Field>
            </div>
            <Field label="Prénom">
              <input
                className={INPUT_CLASS}
                style={SANS}
                value={profile.agent_first_name}
                onChange={e => set('agent_first_name', e.target.value)}
                placeholder="Jean"
              />
            </Field>
            <Field label="Nom">
              <input
                className={INPUT_CLASS}
                style={SANS}
                value={profile.agent_last_name}
                onChange={e => set('agent_last_name', e.target.value)}
                placeholder="Dupont"
              />
            </Field>
            <Field label="Téléphone">
              <input
                className={INPUT_CLASS}
                style={SANS}
                value={profile.agent_phone}
                onChange={e => set('agent_phone', e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </Field>
            <div className="col-span-2">
              <Field label="Email professionnel">
                <input
                  className={INPUT_CLASS}
                  style={SANS}
                  type="email"
                  value={profile.agent_email}
                  onChange={e => set('agent_email', e.target.value)}
                  placeholder="jean.dupont@agence.fr"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* CARTE 2 — Spécialisations */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E6DF]">
          <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>
            02 · SPÉCIALISATIONS
          </p>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map(spec => {
              const active = profile.specializations.includes(spec)
              return (
                <button
                  key={spec}
                  onClick={() => toggleSpec(spec)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active
                      ? 'bg-[#3BAF7E] text-white'
                      : 'bg-[#F0EFE9] text-[#6B6B6B] border border-[#E8E6DF] hover:border-[#3BAF7E]/40'
                  }`}
                  style={SANS}
                >
                  {spec}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-[#9E9E9E] mt-3" style={MONO}>
            Cliquez pour sélectionner vos spécialisations
          </p>
          <div className="mt-4">
            <Field label="Zones géographiques">
              <input
                className={INPUT_CLASS}
                style={SANS}
                value={profile.coverage_zones.join(', ')}
                onChange={e =>
                  set('coverage_zones', e.target.value.split(',').map(z => z.trim()).filter(Boolean))
                }
                placeholder="Ex: Montpellier, Hérault, Gard"
              />
            </Field>
          </div>
        </div>

        {/* CARTE 3 — Ton de communication */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E6DF]">
          <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>
            03 · TON DE COMMUNICATION
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TONES.map(tone => {
              const active = profile.preferred_tone === tone.value
              return (
                <div
                  key={tone.value}
                  onClick={() => set('preferred_tone', tone.value)}
                  className={`rounded-xl p-4 border-2 cursor-pointer transition-all ${
                    active
                      ? 'border-[#3BAF7E] bg-[#E8F7F1]'
                      : 'border-[#E8E6DF] bg-white hover:border-[#3BAF7E]/40'
                  }`}
                >
                  <p className="font-semibold text-sm text-[#1A1A1A]" style={SANS}>
                    {tone.label}
                  </p>
                  <p className="text-xs text-[#6B6B6B] mt-1" style={SANS}>
                    {tone.sub}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CARTE 4 — Charte graphique */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E6DF]">
          <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>
            04 · CHARTE GRAPHIQUE
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Couleur principale">
              <input
                type="color"
                className="w-full h-12 rounded-xl border border-[#E8E6DF] cursor-pointer p-1"
                value={profile.brand_primary_color}
                onChange={e => set('brand_primary_color', e.target.value)}
              />
            </Field>
            <Field label="Couleur secondaire">
              <input
                type="color"
                className="w-full h-12 rounded-xl border border-[#E8E6DF] cursor-pointer p-1"
                value={profile.brand_secondary_color}
                onChange={e => set('brand_secondary_color', e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="URL du logo">
              <input
                className={INPUT_CLASS}
                style={SANS}
                value={profile.logo_url}
                onChange={e => set('logo_url', e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <p className="text-xs text-[#9E9E9E] mt-1" style={SANS}>
              Collez l'URL de votre logo (PNG ou SVG recommandé)
            </p>
            {profile.logo_url && (
              <img
                src={profile.logo_url}
                alt="Logo aperçu"
                className="h-12 mt-3 rounded-lg object-contain"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>
        </div>

        {/* CARTE 5 — Bio (pleine largeur) */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-[#E8E6DF]">
          <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>
            05 · BIO & PRÉSENTATION
          </p>
          <textarea
            rows={4}
            className={INPUT_CLASS + ' resize-none'}
            style={SANS}
            value={profile.bio}
            onChange={e => set('bio', e.target.value)}
            placeholder="Décrivez votre expertise, votre territoire, vos valeurs..."
          />
          <p className="text-[10px] text-[#9E9E9E] mt-2" style={MONO}>
            Cette bio est injectée dans vos annonces et pitchs pour personnaliser le ton.
          </p>
        </div>

        {/* Bouton save */}
        <div className="md:col-span-2 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#3BAF7E] text-white font-bold px-8 py-3 rounded-full hover:bg-[#2A8F62] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={SANS}
          >
            <Save size={16} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder le profil →'}
          </button>
        </div>

      </div>
    </div>
  )
}
