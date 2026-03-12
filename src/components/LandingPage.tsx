import React, { useState, useEffect } from 'react'
import { Sparkles, BarChart3, TrendingUp, Check } from 'lucide-react'

const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" fill="#3BAF7E"/>
    <circle cx="50" cy="50" r="6" fill="white"/>
    <circle cx="50" cy="5" r="5" fill="white"/>
    <circle cx="93" cy="27.5" r="5" fill="white"/>
    <circle cx="93" cy="72.5" r="5" fill="white"/>
    <circle cx="50" cy="95" r="5" fill="white"/>
    <circle cx="7" cy="72.5" r="5" fill="white"/>
    <circle cx="7" cy="27.5" r="5" fill="white"/>
    <line x1="50" y1="50" x2="50" y2="5" stroke="white" strokeWidth="1.5"/>
    <line x1="50" y1="50" x2="93" y2="27.5" stroke="white" strokeWidth="1.5"/>
    <line x1="50" y1="50" x2="93" y2="72.5" stroke="white" strokeWidth="1.5"/>
    <line x1="50" y1="50" x2="50" y2="95" stroke="white" strokeWidth="1.5"/>
    <line x1="50" y1="50" x2="7" y2="72.5" stroke="white" strokeWidth="1.5"/>
    <line x1="50" y1="50" x2="7" y2="27.5" stroke="white" strokeWidth="1.5"/>
  </svg>
)

const MONO = { fontFamily: 'IBM Plex Mono, monospace' }
const SANS = { fontFamily: 'DM Sans, sans-serif' }
const DRAMATIC = { fontFamily: 'Playfair Display, serif', fontStyle: 'italic' as const }

interface Props {
  onGetStarted?: () => void
}

export default function LandingPage({ onGetStarted }: Props) {
  const [activeTab, setActiveTab] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setProgressWidth(85), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .shimmer-bar { position: relative; overflow: hidden; }
        .shimmer-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          animation: shimmer 1.8s infinite;
        }
        .shimmer-bar-1::after { animation-delay: 0s; }
        .shimmer-bar-2::after { animation-delay: 0.1s; }
        .shimmer-bar-3::after { animation-delay: 0.2s; }
        .shimmer-bar-4::after { animation-delay: 0.3s; }
        .shimmer-bar-5::after { animation-delay: 0.4s; }
        .shimmer-bar-6::after { animation-delay: 0.5s; }
      `}</style>

      {/* ─── SECTION 1 — NAVBAR ─────────────────────────────────────────── */}
      <nav className="bg-[#F0EFE9] sticky top-0 z-50 border-b border-[#E8E6DF] px-6 md:px-12 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <LogoIcon />
            <span className="ml-2 text-xl font-bold" style={SANS}>
              <span className="text-[#0A1628]">Signal</span>
              <span className="text-[#3BAF7E]">immo</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {['FONCTIONNALITÉS', 'TARIFS', 'CONNEXION'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs tracking-widest text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                style={MONO}
              >
                {link}
              </a>
            ))}
          </div>

          <button
            onClick={() => onGetStarted?.()}
            className="bg-[#3BAF7E] text-white px-5 py-2 rounded-full hover:bg-[#2A8F62] transition-colors text-sm font-semibold"
            style={SANS}
          >
            Essai gratuit →
          </button>
        </div>
      </nav>

      {/* ─── SECTION 2 — HERO ───────────────────────────────────────────── */}
      <section className="bg-[#0A1628] py-32 md:py-44 px-6 md:px-12 overflow-hidden relative">
        {/* Filigrane grille */}
        <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-white/[0.04]" />
          ))}
        </div>

        <div className="flex flex-col md:grid md:grid-cols-12 gap-12 items-center relative z-10 max-w-7xl mx-auto">
          {/* Col gauche */}
          <div className="md:col-span-7">
            <p className="text-xs tracking-widest text-[#3BAF7E] uppercase" style={MONO}>
              Assistant IA · Fonds de Commerce &amp; Investissement
            </p>
            <h1 className="font-bold text-5xl md:text-7xl text-white leading-[0.92] mt-4" style={SANS}>
              L'intelligence qui signe vos deals.
            </h1>
            <p className="text-2xl text-[#3BAF7E] mt-5" style={DRAMATIC}>
              De l'annonce au financement. Un seul outil.
            </p>
            <p className="text-lg text-[#8899AA] mt-5 max-w-lg leading-relaxed" style={SANS}>
              Signalimmo génère vos annonces optimisées pour les IA, analyse vos secteurs
              et produit vos dossiers d'acquisition en 12 minutes.
            </p>
            <div className="flex gap-4 mt-10 flex-wrap">
              <button
                onClick={() => onGetStarted?.()}
                className="bg-[#3BAF7E] text-white font-bold px-8 py-4 rounded-full text-base hover:bg-[#2A8F62] hover:scale-105 transition-all"
                style={SANS}
              >
                Démarrer gratuitement →
              </button>
              <button
                className="border border-white/30 text-white px-8 py-4 rounded-full text-base hover:border-white/60 transition-all"
                style={SANS}
              >
                Voir une démo
              </button>
            </div>
            <p className="text-xs text-[#4A6070] mt-5" style={MONO}>
              SANS CARTE BANCAIRE · RÉSILIATION À TOUT MOMENT
            </p>
          </div>

          {/* Col droite — Carte */}
          <div className="md:col-span-5 mt-12 md:mt-0 w-full">
            <div className="bg-[#0F2040] rounded-2xl border border-[#3BAF7E]/20 shadow-2xl p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3BAF7E] animate-pulse" />
                  <span className="text-xs text-[#3BAF7E]" style={MONO}>GÉNÉRATION EN COURS...</span>
                </div>
                <span className="text-xs bg-[#3BAF7E]/10 text-[#3BAF7E] border border-[#3BAF7E]/30 px-3 py-1 rounded-full" style={MONO}>
                  GEO · 94/100
                </span>
              </div>

              {[
                { h: 'h-3', w: 'w-full',  n: 1 },
                { h: 'h-2', w: 'w-4/5',   n: 2 },
                { h: 'h-3', w: 'w-full',  n: 3 },
                { h: 'h-2', w: 'w-3/4',   n: 4 },
                { h: 'h-3', w: 'w-full',  n: 5 },
                { h: 'h-2', w: 'w-2/3',   n: 6 },
              ].map((bar) => (
                <div
                  key={bar.n}
                  className={`shimmer-bar shimmer-bar-${bar.n} ${bar.h} ${bar.w} bg-white/10 rounded-full mb-3`}
                />
              ))}

              <div className="mt-6">
                <p className="text-xs text-[#4A6070] mb-2" style={MONO}>
                  Optimisation GEO en cours...
                </p>
                <div className="bg-[#3BAF7E]/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#3BAF7E] rounded-full h-full transition-all duration-[2000ms]"
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3 — SOCIAL PROOF ───────────────────────────────────── */}
      <section className="bg-[#F0EFE9] py-14 border-t border-[#E8E6DF]">
        <p className="text-xs tracking-widest text-[#9E9E9E] text-center mb-8" style={MONO}>
          UTILISÉ PAR DES AGENTS DANS TOUT LE SUD DE LA FRANCE
        </p>
        <div className="flex justify-center items-center gap-12 flex-wrap px-6">
          {['CENTURY 21', 'ORPI', 'IAD FRANCE', 'GUY HOQUET', 'FONCIA'].map((name) => (
            <span key={name} className="font-semibold text-sm text-[#C8C8C8]" style={SANS}>
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ─── SECTION 4 — PROPOSITIONS DE VALEUR ────────────────────────── */}
      <section className="bg-[#F0EFE9] py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-widest text-[#9E9E9E] text-center mb-3" style={MONO}>
            POURQUOI SIGNALIMMO
          </p>
          <h2 className="font-bold text-4xl text-[#1A1A1A] text-center" style={SANS}>
            Conçu pour les agents qui gagnent.
          </h2>
          <p className="text-xl text-[#3BAF7E] text-center mt-2" style={DRAMATIC}>
            Trois avantages. Un seul abonnement.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: <Sparkles size={20} />,
                tag: '01 · VISIBILITÉ IA',
                title: 'Visible par les IA',
                desc: 'Vos annonces citées par ChatGPT, Gemini, Perplexity et Claude dans leurs réponses de recherche.',
                stat: '3×',
                statLabel: 'PLUS DE VISIBILITÉ',
              },
              {
                icon: <BarChart3 size={20} />,
                tag: '02 · CYCLE COMPLET',
                title: 'Cycle de vente complet',
                desc: "De la rédaction de l'annonce à la constitution du dossier bancaire — un seul outil.",
                stat: '12min',
                statLabel: 'PAR DOSSIER',
              },
              {
                icon: <TrendingUp size={20} />,
                tag: '03 · INTELLIGENCE',
                title: 'Intelligence Investisseur',
                desc: 'Analyse sectorielle, rentabilité, risques et FAQ investisseur générées automatiquement.',
                stat: '94/100',
                statLabel: 'SCORE GEO MOYEN',
              },
            ].map((card) => (
              <div
                key={card.tag}
                className="bg-white rounded-2xl p-8 border border-[#E8E6DF] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-[#E8F7F1] rounded-xl flex items-center justify-center text-[#3BAF7E]">
                  {card.icon}
                </div>
                <p className="text-xs tracking-wider text-[#3BAF7E] mt-6" style={MONO}>{card.tag}</p>
                <h3 className="font-semibold text-xl text-[#1A1A1A] mt-2" style={SANS}>{card.title}</h3>
                <p className="text-sm text-[#6B6B6B] mt-3 leading-relaxed" style={SANS}>{card.desc}</p>
                <div className="border-t border-[#E8E6DF] mt-6 pt-6">
                  <p
                    className="text-4xl text-[#0A1628]"
                    style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontWeight: 700 }}
                  >
                    {card.stat}
                  </p>
                  <p className="text-xs text-[#9E9E9E] mt-1" style={MONO}>{card.statLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5 — DÉMO PRODUIT ───────────────────────────────────── */}
      <section className="bg-[#0A1628] py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-widest text-[#3BAF7E] text-center mb-3" style={MONO}>
            PRODUIT
          </p>
          <h2 className="font-bold text-4xl text-white text-center" style={SANS}>
            Voyez Signalimmo en action
          </h2>

          {/* Onglets */}
          <div className="flex justify-center gap-8 mt-10 border-b border-white/10">
            {['Annonce GEO', 'Intelligence Territoriale', 'Dossier Acquisition'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`pb-3 border-b-2 text-sm cursor-pointer transition-colors ${
                  activeTab === i
                    ? 'font-semibold text-[#3BAF7E] border-[#3BAF7E]'
                    : 'font-medium text-[#6B6B6B] border-transparent hover:text-white'
                }`}
                style={SANS}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Zone démo */}
          <div className="mt-10 bg-[#0F2040] rounded-2xl p-8 min-h-[360px] border border-white/5 relative">
            {/* Tab 0 — Annonce GEO */}
            {activeTab === 0 && (
              <div>
                <p className="text-xs text-[#3BAF7E] mb-4" style={MONO}>
                  STUDIO · ANNONCE GEO — TABAC-PRESSE MONTPELLIER
                </p>
                <div className="flex gap-3 mb-5 flex-wrap">
                  {['Portail', 'Social', 'Email', 'Score'].map((t, i) => (
                    <span
                      key={t}
                      className={`text-xs px-3 py-1 rounded-full border cursor-pointer ${
                        i === 0
                          ? 'bg-[#3BAF7E]/10 text-[#3BAF7E] border-[#3BAF7E]/20'
                          : 'text-white/40 border-white/10'
                      }`}
                      style={MONO}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line" style={SANS}>
                  {`TABAC-PRESSE EN CŒUR DE VILLAGE — POTENTIEL EXCEPTIONNEL\n\nImplanté depuis 18 ans dans le centre de Saint-Drézéry (34160), ce tabac-presse-bar bénéficie d'un emplacement N°1 sur la place du village. Flux piétons constant, clientèle fidèle de proximité, absence totale de concurrence directe dans un rayon de 3 km.\n\nCHIFFRES CLÉS :\n- CA : 385 000 €\n- EBE retraité : 67 000 €\n- Bail commercial 3/6/9 — 7 ans restants`}
                </p>
                <span
                  className="absolute bottom-4 right-4 text-xs bg-[#3BAF7E]/10 text-[#3BAF7E] border border-[#3BAF7E]/30 px-3 py-1 rounded-full"
                  style={MONO}
                >
                  GEO · 94/100
                </span>
              </div>
            )}

            {/* Tab 1 — Intelligence Territoriale */}
            {activeTab === 1 && (
              <div>
                <p className="text-xs text-[#3BAF7E] mb-4" style={MONO}>
                  RAPPORT · INTELLIGENCE TERRITORIALE — MONTPELLIER CENTRE
                </p>
                <table className="w-full text-sm border-collapse mb-4">
                  <tbody>
                    {[
                      ['Prix vente',        '725 €/m²', '+4.2%'],
                      ['Loyer moyen',       '14 €/m²',  '+2.1%'],
                      ['Vacance locative',  '3.2%',     'Faible'],
                      ['Rentabilité brute', '5.8%',     'Stable'],
                    ].map(([label, val, trend]) => (
                      <tr key={label} className="border-b border-white/5">
                        <td className="py-2 text-white/60" style={SANS}>{label}</td>
                        <td className="py-2 text-white font-medium" style={SANS}>{val}</td>
                        <td className="py-2 text-[#3BAF7E] text-right" style={SANS}>{trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="space-y-2 mt-4">
                  {[
                    '💎 Secteur Comédie — demande locative très soutenue',
                    '📍 Tramway lignes 1 & 4 à 200m — mobilité maximale',
                    '📈 Projet EcoCité à 500m — revalorisation attendue +8%',
                  ].map((bullet) => (
                    <p key={bullet} className="text-sm text-white/70" style={SANS}>{bullet}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2 — Dossier Acquisition */}
            {activeTab === 2 && (
              <div>
                <p className="text-xs text-[#3BAF7E] mb-4" style={MONO}>
                  ACQUISITION · DOSSIER FONDS DE COMMERCE
                </p>
                <div className="flex flex-col gap-3 mt-4">
                  {['CA · 385 000 €', 'EBE RETRAITÉ · 67 000 €', 'LOYER · 1 850 €/mois'].map((line) => (
                    <p key={line} className="text-sm text-white" style={MONO}>{line}</p>
                  ))}
                </div>
                <div className="mt-5">
                  <p className="text-xs text-[#6B6B6B] mb-2" style={SANS}>Analyse du dossier bancaire...</p>
                  <div className="bg-[#3BAF7E]/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#3BAF7E] h-full rounded-full w-[78%]" />
                  </div>
                </div>
                <div className="mt-5">
                  <span
                    className="text-xs bg-[#3BAF7E]/10 text-[#3BAF7E] border border-[#3BAF7E]/30 px-4 py-2 rounded-xl inline-block"
                    style={MONO}
                  >
                    SCORE BANQUE · 78/100
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── SECTION 6 — CHIFFRES ───────────────────────────────────────── */}
      <section className="bg-[#F0EFE9] py-24 border-t border-b border-[#E8E6DF]">
        <div className="flex justify-around items-center flex-wrap gap-12 px-6 md:px-12">
          {([
            { stat: '94/100', label: 'SCORE GEO MOYEN' },
            null,
            { stat: '3×',    label: 'VISIBILITÉ IA' },
            null,
            { stat: '12 min', label: 'GÉNÉRATION DOSSIER' },
          ] as ({ stat: string; label: string } | null)[]).map((item, i) =>
            item === null ? (
              <div key={i} className="hidden md:block w-px h-16 bg-[#E8E6DF]" />
            ) : (
              <div key={item.stat} className="text-center">
                <p
                  className="text-7xl font-bold text-[#0A1628]"
                  style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}
                >
                  {item.stat}
                </p>
                <p className="text-xs tracking-widest text-[#9E9E9E] mt-3" style={MONO}>{item.label}</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* ─── SECTION 7 — TARIFS ─────────────────────────────────────────── */}
      <section className="bg-[#F0EFE9] py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-widest text-[#9E9E9E] text-center mb-3" style={MONO}>TARIFS</p>
          <h2 className="font-bold text-4xl text-[#1A1A1A] text-center" style={SANS}>Simple et transparent.</h2>
          <p className="text-xl text-[#3BAF7E] text-center mt-2" style={DRAMATIC}>Sans engagement. Sans surprise.</p>

          <div className="grid md:grid-cols-3 gap-6 mt-12 items-start">
            {/* STARTER */}
            <div className="bg-white rounded-2xl p-8 border border-[#E8E6DF]">
              <p className="text-xs text-[#9E9E9E]" style={MONO}>STARTER</p>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-5xl text-[#0A1628]" style={DRAMATIC}>49€</span>
                <span className="text-sm text-[#6B6B6B]" style={SANS}>/mois</span>
              </div>
              <p className="text-xs text-[#9E9E9E] mt-1" style={SANS}>Pour démarrer</p>
              <div className="border-t border-[#E8E6DF] mt-6 pt-6 space-y-3">
                {['Annonces GEO illimitées', 'Intelligence Territoriale (5/mois)', 'Export PDF', 'Support email'].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={16} className="text-[#3BAF7E] flex-shrink-0" />
                    <span className="text-sm text-[#6B6B6B]" style={SANS}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onGetStarted?.()}
                className="mt-8 w-full py-3 rounded-full border border-[#0A1628] text-[#0A1628] font-semibold text-sm hover:bg-[#0A1628] hover:text-white transition-all"
                style={SANS}
              >
                Commencer
              </button>
            </div>

            {/* PRO */}
            <div className="bg-[#0A1628] rounded-2xl p-8 md:scale-105 shadow-2xl relative">
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3BAF7E] text-white text-xs px-4 py-1 rounded-full whitespace-nowrap"
                style={MONO}
              >
                LE PLUS POPULAIRE
              </span>
              <p className="text-xs text-[#3BAF7E]" style={MONO}>PRO</p>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-5xl text-white" style={DRAMATIC}>149€</span>
                <span className="text-sm text-[#6B6B6B]" style={SANS}>/mois</span>
              </div>
              <p className="text-xs text-[#4A6070] mt-1" style={SANS}>Pour les professionnels</p>
              <div className="border-t border-white/10 mt-6 pt-6 space-y-3">
                {[
                  'Tout Starter +',
                  'Dossier Acquisition fonds',
                  'Analyse bail commercial',
                  'Pitch prospection brandé',
                  'Profil agence personnalisé',
                  'Support prioritaire',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={16} className="text-[#3BAF7E] flex-shrink-0" />
                    <span className="text-sm text-white/80" style={SANS}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onGetStarted?.()}
                className="mt-8 w-full py-3 rounded-full bg-[#3BAF7E] text-white font-bold text-sm hover:bg-[#2A8F62] transition-all"
                style={SANS}
              >
                Choisir Pro
              </button>
            </div>

            {/* PREMIUM */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#3BAF7E]/30">
              <p className="text-xs text-[#3BAF7E]" style={MONO}>PREMIUM</p>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-5xl text-[#0A1628]" style={DRAMATIC}>299€</span>
                <span className="text-sm text-[#6B6B6B]" style={SANS}>/mois</span>
              </div>
              <p className="text-xs text-[#9E9E9E] mt-1" style={SANS}>Pour les équipes</p>
              <div className="border-t border-[#E8E6DF] mt-6 pt-6 space-y-3">
                {[
                  'Tout Pro +',
                  'Accès multi-agents (5)',
                  'API Signalimmo',
                  'Rapports white-label',
                  'Support dédié 7j/7',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={16} className="text-[#3BAF7E] flex-shrink-0" />
                    <span className="text-sm text-[#6B6B6B]" style={SANS}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onGetStarted?.()}
                className="mt-8 w-full py-3 rounded-full border border-[#3BAF7E] text-[#3BAF7E] font-semibold text-sm hover:bg-[#E8F7F1] transition-all"
                style={SANS}
              >
                Choisir Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 8 — CTA FINAL ──────────────────────────────────────── */}
      <section className="bg-[#0A1628] py-32 px-6 text-center">
        <h2
          className="font-bold text-5xl md:text-6xl text-white max-w-3xl mx-auto leading-tight"
          style={SANS}
        >
          Prêt à dominer les algorithmes ?
        </h2>
        <p className="text-2xl text-[#3BAF7E] mt-5" style={DRAMATIC}>
          Votre premier dossier en 12 minutes.
        </p>
        <p className="text-base text-[#8899AA] mt-4 max-w-lg mx-auto" style={SANS}>
          Sans carte bancaire. Sans engagement. Juste des résultats.
        </p>
        <button
          onClick={() => onGetStarted?.()}
          className="mt-10 bg-[#3BAF7E] text-white font-bold px-12 py-4 rounded-full text-lg hover:bg-[#2A8F62] hover:scale-105 transition-all"
          style={SANS}
        >
          Démarrer gratuitement →
        </button>
        <p className="text-xs text-[#4A6070] mt-6" style={MONO}>
          SANS CARTE BANCAIRE · RÉSILIATION À TOUT MOMENT
        </p>
      </section>

      {/* ─── SECTION 9 — FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-[#060F1A] py-12 px-6 md:px-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-3">
              <LogoIcon />
              <span className="text-lg font-bold" style={SANS}>
                <span className="text-white">Signal</span>
                <span className="text-[#3BAF7E]">immo</span>
              </span>
            </div>
            <p className="text-sm text-[#4A6070] mt-1" style={SANS}>Intelligence. Transaction. Résultat.</p>
          </div>
          <div className="flex gap-6 flex-wrap">
            {['CGU', 'Confidentialité', 'RGPD', 'Contact'].map((link) => (
              <span
                key={link}
                className="text-xs text-[#4A6070] hover:text-white cursor-pointer transition-colors"
                style={MONO}
              >
                {link}
              </span>
            ))}
          </div>
        </div>
        <div className="border-t border-white/5 mt-8 pt-8 text-center">
          <p className="text-xs text-[#3A4A5A]" style={SANS}>
            © 2026 Signalimmo. Tous droits réservés. Fait avec ❤️ à Montpellier.
          </p>
        </div>
      </footer>
    </div>
  )
}
