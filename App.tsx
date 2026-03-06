import React, { useState, useEffect } from 'react';
import { supabase } from './src/supabaseClient';
import { deleteFileFromSupabase } from './src/utils/storage';
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
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timer);
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

  // Initialisation de l'état history
  const [history, setHistory] = useState<Property[]>([]);
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Charger l'historique depuis Supabase à la connexion
  useEffect(() => {
    const fetchProperties = async () => {
      if (!session) return;
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setHistory(data.map(item => ({
          id: item.id,
          address: item.address,
          price: item.price,
          image: item.image,
          geoScore: item.geo_score,
          date: new Date(item.created_at).toLocaleDateString('fr-FR'),
          generatedContent: item.generated_content,
          metadata: item.metadata,
          type: item.property_type,
          reportContent: item.report_content
        })));
      }
    };
    fetchProperties();
  }, [session]);

  const handleNavigate = (view: ViewState) => {
    // Si on navigue vers le studio via le menu, on reset la sélection pour un nouveau projet
    if (view === 'studio' && currentView !== 'studio') {
        setSelectedProperty(null);
    }
    setCurrentView(view);
  };

  const handleNewProperty = async (property: Property) => {
    if (!session) return;

    const { data, error } = await supabase
      .from('properties')
      .insert([{
        user_id: session.user.id,
        address: property.address,
        price: property.price,
        image: property.image,
        geo_score: property.geoScore,
        property_type: property.type,
        generated_content: property.generatedContent,
        metadata: property.metadata,
        report_content: property.reportContent
      }])
      .select()
      .single();

    if (data) {
      setHistory(prev => [{
        ...property,
        id: data.id,
        date: new Date(data.created_at).toLocaleDateString('fr-FR')
      }, ...prev]);
    }
  };

  const handleDeleteProperty = async (id: string, imagePath: string) => {
    if (!session) return;

    // 1. Delete from Supabase Storage
    if (imagePath && !imagePath.startsWith('blob:')) {
      await deleteFileFromSupabase(imagePath);
    }

    // 2. Delete from Supabase Database
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (!error) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
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
      <Layout currentView={(currentView === 'intelligence' ? 'dashboard' : currentView) as any} onNavigate={handleNavigate}>
        {currentView === 'dashboard' && (
          <Dashboard 
              onNavigateToStudio={() => { setSelectedProperty(null); setCurrentView('studio'); }} 
              onNavigateToIntelligence={() => { setSelectedProperty(null); setCurrentView('intelligence'); }}
              onNavigateToHistory={() => setCurrentView('history')}
              onSelectProperty={handleSelectProperty}
              history={history}
              userFirstName={session?.user?.user_metadata?.first_name || session?.user?.email?.split('@')[0]}
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
              onDeleteProperty={handleDeleteProperty}
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
