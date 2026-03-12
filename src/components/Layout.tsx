import React from 'react'
import { LayoutDashboard, Sparkles, MapPin, History, FileText, User, LogOut } from 'lucide-react'

const MONO = { fontFamily: 'IBM Plex Mono, monospace' }
const SANS = { fontFamily: 'DM Sans, sans-serif' }

interface Props {
  session: any
  currentView: string
  onNavigate: (view: string) => void
  onSignOut: () => void
  children: React.ReactNode
}

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const NAV_ITEMS = [
  { view: 'dashboard',    icon: <LayoutDashboard size={16} />, label: 'Tableau de bord' },
  { view: 'studio',       icon: <Sparkles        size={16} />, label: 'Studio Annonces' },
  { view: 'intelligence', icon: <MapPin           size={16} />, label: 'Intelligence'     },
  { view: 'history',      icon: <History          size={16} />, label: 'Historique'       },
  { view: 'profile',      icon: <User             size={16} />, label: 'Profil Agence'    },
]

const SOON_ITEMS = [
  { view: 'acquisition', icon: <FileText size={16} />, label: 'Dossiers Acquisition' },
]

export default function Layout({ session, currentView, onNavigate, onSignOut, children }: Props) {
  return (
    <div className="flex h-screen bg-[#F0EFE9] overflow-hidden">

      {/* ─── SIDEBAR ──────────────────────────────────────────────────── */}
      <aside className="w-64 bg-[#0A1628] flex flex-col h-full flex-shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5 flex items-center gap-2.5">
          <LogoIcon />
          <span className="font-bold text-lg" style={SANS}>
            <span className="text-white">Signal</span>
            <span className="text-[#3BAF7E]">immo</span>
          </span>
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-[10px] tracking-widest text-[#3A4A5A] uppercase px-3 mb-3" style={MONO}>
            NAVIGATION
          </p>

          {NAV_ITEMS.map((item) => {
            const active = currentView === item.view
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 text-left ${
                  active
                    ? 'bg-[#3BAF7E]/15 text-[#3BAF7E]'
                    : 'text-[#4A6070] hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium" style={SANS}>{item.label}</span>
              </button>
            )
          })}

          <div className="mt-4 mb-3 border-t border-white/5" />

          <p className="text-[10px] tracking-widest text-[#3A4A5A] uppercase px-3 mb-3" style={MONO}>
            BIENTÔT
          </p>

          {SOON_ITEMS.map((item) => (
            <div
              key={item.view}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-40 cursor-not-allowed pointer-events-none text-[#4A6070]"
            >
              {item.icon}
              <span className="text-sm font-medium" style={SANS}>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Bas de sidebar */}
        <div className="px-3 py-4 border-t border-white/5">
          <p className="text-[10px] text-[#3A4A5A] px-3 mb-3 truncate" style={MONO}>
            {session?.user?.email}
          </p>
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left cursor-pointer transition-all text-[#4A6070] hover:text-red-400 hover:bg-red-400/5"
          >
            <LogOut size={16} />
            <span className="text-sm" style={SANS}>Déconnexion</span>
          </button>
        </div>

      </aside>

      {/* ─── ZONE CONTENU ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-[#F0EFE9]">
        {children}
      </main>

    </div>
  )
}
