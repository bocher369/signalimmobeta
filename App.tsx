import React, { useState, useEffect } from 'react';
import { supabase } from './src/supabaseClient';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Studio } from './components/Studio';
import { History } from './components/History';
import { TerritorialIntelligence } from './components/TerritorialIntelligence';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { ViewState, Property } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('signin');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setCurrentView('dashboard');
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // If logged out, go to signin (unless already on signup)
        setCurrentView((prev) => (prev === 'signup' ? 'signup' : 'signin'));
      } else {
        // If logged in, go to dashboard (if currently on auth pages)
        setCurrentView((prev) => (prev === 'signin' || prev === 'signup' ? 'dashboard' : prev));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialisation de l'état history avec localStorage s'il existe
  const [history, setHistory] = useState<Property[]>(() => {
    try {
      const savedHistory = localStorage.getItem('geo_estate_history');
      if (savedHistory) {
        return JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
    }
    return [];
  });
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Sauvegarde dans localStorage à chaque modification de l'historique
  useEffect(() => {
    try {
      localStorage.setItem('geo_estate_history', JSON.stringify(history));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'historique:", error);
    }
  }, [history]);

  const handleNavigate = (view: ViewState) => {
    // Si on navigue vers le studio via le menu, on reset la sélection pour un nouveau projet
    if (view === 'studio' && currentView !== 'studio') {
        setSelectedProperty(null);
    }
    setCurrentView(view);
  };

  const handleNewProperty = (property: Property) => {
    setHistory(prev => [property, ...prev]);
  };

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    if (property.type === 'intelligence') {
        setCurrentView('intelligence');
    } else {
        setCurrentView('studio');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Layout currentView={currentView === 'intelligence' ? 'dashboard' : currentView} onNavigate={handleNavigate}>
        {currentView === 'dashboard' && (
          <Dashboard 
              onNavigateToStudio={() => { setSelectedProperty(null); setCurrentView('studio'); }} 
              onNavigateToIntelligence={() => { setSelectedProperty(null); setCurrentView('intelligence'); }}
              onNavigateToHistory={() => setCurrentView('history')}
              onSelectProperty={handleSelectProperty}
              history={history}
          />
        )}
        {currentView === 'studio' && (
          <Studio 
              onNewProperty={handleNewProperty} 
              initialProperty={selectedProperty}
          />
        )}
        {currentView === 'intelligence' && (
          <TerritorialIntelligence 
              onNewEntry={handleNewProperty}
              initialData={selectedProperty?.type === 'intelligence' ? selectedProperty : null}
          />
        )}
        {currentView === 'history' && (
          <History 
              onBack={() => setCurrentView('dashboard')} 
              history={history}
              onSelectProperty={handleSelectProperty}
          />
        )}
        {currentView === 'signin' && (
          <SignIn onNavigate={handleNavigate} />
        )}
        {currentView === 'signup' && (
          <SignUp onNavigate={handleNavigate} />
        )}
      </Layout>
    </ErrorBoundary>
  );
}

export default App;