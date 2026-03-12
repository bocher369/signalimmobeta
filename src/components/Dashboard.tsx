import React from 'react'
import { Sparkles, MapPin, TrendingUp, BarChart3, ArrowRight, FileText, User, Clock } from 'lucide-react'

const MONO = { fontFamily: 'IBM Plex Mono, monospace' }
const SANS = { fontFamily: 'DM Sans, sans-serif' }
const DRAMATIC = { fontFamily: 'Playfair Display, serif', fontStyle: 'italic' as const, fontWeight: 700 }

interface Props {
  session: any
  onNavigate: (view: string) => void
}

const METRICS = [
  { label: 'ANNONCES CRÉÉES', value: '0',  sub: 'Ce mois-ci',       icon: <Sparkles  size={16} /> },
  { label: 'RAPPORTS SECTEUR', value: '0', sub: 'Total',             icon: <MapPin    size={16} /> },
  { label: 'SCORE GEO MOY.',   value: '—', sub: 'Sur vos annonces',  icon: <TrendingUp size={16} /> },
  { label: 'DOSSIERS ACQU.',   value: '0', sub: 'En cours',          icon: <BarChart3 size={16} /> },
]

const ACTIONS = [
  {
    icon: <Sparkles size={20} />,
    view: 'studio',
    tag: 'STUDIO',
    title: 'Créer une annonce GEO',
    desc: 'Génération multi-canal optimisée pour les IA',
    soon: false,
  },
  {
    icon: <MapPin size={20} />,
    view: 'intelligence',
    tag: 'INTELLIGENCE',
    title: 'Analyser un secteur',
    desc: 'Rapport territorial complet en 30 secondes',
    soon: false,
  },
  {
    icon: <FileText size={20} />,
    view: 'acquisition',
    tag: 'ACQUISITION',
    title: 'Nouveau dossier fonds',
    desc: 'Extraction liasse + mémo bancaire (bientôt)',
    soon: true,
  },
  {
    icon: <User size={20} />,
    view: 'profile',
    tag: 'PROFIL',
    title: 'Configurer mon agence',
    desc: 'Logo, charte, spécialisations',
    soon: true,
  },
]

export default function Dashboard({ session, onNavigate }: Props) {
  const firstName = session?.user?.email?.split('@')[0] ?? 'Agent'
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#F0EFE9]">

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-0 flex justify-between items-start">
        <div>
          <p className="text-xs tracking-widest text-[#9E9E9E] uppercase" style={MONO}>
            TABLEAU DE BORD
          </p>
          <h1 className="font-bold text-3xl text-[#1A1A1A] mt-1" style={SANS}>
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 capitalize" style={SANS}>
            {today}
          </p>
        </div>
        <span
          className="text-xs bg-[#E8F7F1] text-[#3BAF7E] border border-[#3BAF7E]/30 px-3 py-1 rounded-full mt-1"
          style={MONO}
        >
          ● ACTIF
        </span>
      </div>

      {/* ─── MÉTRIQUES ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 px-8">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-2xl p-5 border border-[#E8E6DF] shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-wider text-[#9E9E9E] uppercase" style={MONO}>
                {m.label}
              </p>
              <span className="text-[#3BAF7E]">{m.icon}</span>
            </div>
            <p className="text-4xl text-[#0A1628] mt-2" style={DRAMATIC}>
              {m.value}
            </p>
            <p className="text-xs text-[#9E9E9E] mt-1" style={SANS}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ─── ACTIONS RAPIDES ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 px-8">
        {ACTIONS.map((a) => (
          <div
            key={a.view}
            onClick={() => !a.soon && onNavigate(a.view)}
            className={`bg-white rounded-2xl p-6 border border-[#E8E6DF] transition-all duration-200 flex items-start gap-4 ${
              a.soon
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:border-[#3BAF7E]/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F7F1] flex items-center justify-center text-[#3BAF7E] flex-shrink-0">
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs text-[#3BAF7E] tracking-wider uppercase" style={MONO}>
                  {a.tag}
                </p>
                {a.soon && (
                  <span
                    className="text-xs bg-[#F0EFE9] text-[#9E9E9E] border border-[#E8E6DF] px-2 py-0.5 rounded-full"
                    style={MONO}
                  >
                    BIENTÔT
                  </span>
                )}
              </div>
              <p className="font-semibold text-base text-[#1A1A1A] mt-0.5" style={SANS}>
                {a.title}
              </p>
              <p className="text-xs text-[#6B6B6B] mt-1" style={SANS}>
                {a.desc}
              </p>
            </div>
            <ArrowRight size={16} className="text-[#9E9E9E] ml-auto mt-0.5 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* ─── HISTORIQUE RÉCENT ──────────────────────────────────────────── */}
      <div className="mt-6 px-8 pb-8">
        <div className="flex justify-between items-center mb-4">
          <p className="font-semibold text-sm text-[#1A1A1A]" style={SANS}>
            Activité récente
          </p>
          <span
            className="text-xs text-[#3BAF7E] cursor-pointer hover:text-[#2A8F62] transition-colors"
            style={MONO}
            onClick={() => onNavigate('history')}
          >
            VOIR TOUT →
          </span>
        </div>

        {/* État vide */}
        <div className="bg-white rounded-2xl p-10 border border-[#E8E6DF] border-dashed text-center">
          <div className="w-12 h-12 bg-[#F0EFE9] rounded-2xl flex items-center justify-center mx-auto">
            <Clock size={20} className="text-[#9E9E9E]" />
          </div>
          <p className="font-medium text-sm text-[#6B6B6B] mt-3" style={SANS}>
            Aucune activité pour le moment
          </p>
          <p className="text-xs text-[#9E9E9E] mt-1" style={SANS}>
            Créez votre première annonce pour démarrer
          </p>
        </div>
      </div>

    </div>
  )
}
