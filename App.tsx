import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Studio } from './components/Studio';
import { History } from './components/History';
import { TerritorialIntelligence } from './components/TerritorialIntelligence';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ViewState, Property } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  
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
      </Layout>
    </ErrorBoundary>
  );
}

export default App;