import React from 'react';
import { LayoutGrid, PlusCircle, Settings, User, History as HistoryIcon } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: any;
  onNavigate: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  if (currentView === 'signin' || currentView === 'signup') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-gray-800 font-sans selection:bg-brand-100">
        <main className="flex-1 flex items-center justify-center p-4">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F9FAFB] text-gray-800 font-sans selection:bg-brand-100">
      
      {/* Sidebar Navigation (Desktop) / Bottom Bar (Mobile) */}
      <nav className="md:w-20 md:h-screen w-full h-16 bg-white border-t md:border-t-0 md:border-r border-gray-100 flex md:flex-col flex-row items-center justify-between md:py-8 py-0 px-6 md:px-0 fixed md:static bottom-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] md:shadow-none">
        
        {/* Logo Area */}
        <div className="hidden md:flex flex-col items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/30">
            G
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex md:flex-col flex-row gap-8 md:gap-8 w-full justify-around md:justify-start md:items-center">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`p-3 rounded-xl transition-all duration-300 ${currentView === 'dashboard' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Tableau de bord"
          >
            <LayoutGrid size={24} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
          </button>
          
          <button 
            onClick={() => onNavigate('studio')}
            className={`p-3 rounded-xl transition-all duration-300 ${currentView === 'studio' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Nouveau projet"
          >
            <PlusCircle size={24} strokeWidth={currentView === 'studio' ? 2.5 : 2} />
          </button>

          <button 
            onClick={() => onNavigate('history')}
            className={`p-3 rounded-xl transition-all duration-300 ${currentView === 'history' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            title="Historique"
          >
            <HistoryIcon size={24} strokeWidth={currentView === 'history' ? 2.5 : 2} />
          </button>

          <button 
            onClick={() => onNavigate('signin')}
            className={`p-3 rounded-xl transition-all duration-300 ${currentView === 'signin' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} hidden md:block`}
            title="Connexion"
          >
            <User size={24} strokeWidth={currentView === 'signin' ? 2.5 : 2} />
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="hidden md:flex flex-col items-center mt-auto">
          <button className="p-3 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
            <Settings size={24} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-12">
          {children}
        </div>
      </main>
    </div>
  );
};