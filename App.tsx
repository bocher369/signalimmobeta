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
import { ViewState, Property, TerritorialData } from './types';
import { deleteFileFromSupabase } from './src/utils/storage';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('signin');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setCurrentView((prev) => (prev === 'signup' ? 'signup' : 'signin'));
      } else {
        setCurrentView((prev) => (prev === 'signin' || prev === 'signup' ? 'dashboard' : prev));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [history, setHistory] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [linkedPropertyId, setLinkedPropertyId] = useState<string | null>(null);

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
          reportContent: item.report_content,
          territorial_data: item.territorial_data,
        })));
      }
    };
    fetchProperties();
  }, [session]);

  const handleNavigate = (view: ViewState) => {
    if (view === 'studio' && currentView !== 'studio') {
      setSelectedProperty(null);
    }
    if (view !== 'intelligence') {
      setLinkedPropertyId(null);
    }
    setCurrentView(view);
  };

  const handleNewProperty = async (property: Property): Promise<Property | null> => {
    if (!session) return null;

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
        report_content: property.reportContent,
        territorial_data: property.territorial_data ?? null,
      }])
      .select()
      .single();

    if (data) {
      const savedProperty: Property = {
        ...property,
        id: data.id,
        date: new Date(data.created_at).toLocaleDateString('fr-FR'),
      };
      setHistory(prev => [savedProperty, ...prev]);
      return savedProperty;
    }
    return null;
  };

  const handleUpdateTerritorialData = async (propertyId: string, data: TerritorialData) => {
    await supabase
      .from('properties')
      .update({ territorial_data: data })
      .eq('id', propertyId);

    setHistory(prev => prev.map(p =>
      p.id === propertyId ? { ...p, territorial_data: data } : p
    ));
  };

  const handleNavigateToIntelligence = (property: Property) => {
    setSelectedProperty(property);
    setLinkedPropertyId(property.id);
    setCurrentView('intelligence');
  };

  const handleDeleteProperty = async (id: string, imagePath: string) => {
    if (!session) return;

    if (imagePath && !imagePath.startsWith('blob:')) {
      await deleteFileFromSupabase(imagePath);
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (!error) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleClearHistory = async () => {
    if (!session) return;

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('user_id', session.user.id);

    if (!error) {
      setHistory([]);
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
            onNavigateToIntelligence={handleNavigateToIntelligence}
          />
        )}
        {currentView === 'intelligence' && (
          <TerritorialIntelligence
            onNewEntry={handleNewProperty}
            initialData={selectedProperty}
            linkedPropertyId={linkedPropertyId ?? undefined}
            onUpdateTerritorialData={handleUpdateTerritorialData}
          />
        )}
        {currentView === 'history' && (
          <History
            onBack={() => setCurrentView('dashboard')}
            history={history}
            onSelectProperty={handleSelectProperty}
            onDeleteProperty={handleDeleteProperty}
            onClearHistory={handleClearHistory}
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
