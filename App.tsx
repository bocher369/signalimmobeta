import { useState, useEffect } from 'react';
import { supabase } from './src/supabaseClient';
import Layout from './src/components/Layout';
import Dashboard from './src/components/Dashboard';
import LandingPage from './src/components/LandingPage';
import { Studio } from './components/Studio';
import { History } from './components/History';
import { TerritorialIntelligence } from './components/TerritorialIntelligence';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { ViewState, Property, TerritorialData } from './types';
import { deleteFileFromSupabase } from './src/utils/storage';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
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
        setCurrentView('landing');
      } else {
        setCurrentView((prev) =>
          prev === 'signin' || prev === 'signup' || prev === 'landing'
            ? 'dashboard'
            : prev
        );
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

      const { data } = await supabase
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

  const handleNavigate = (view: string) => {
    const v = view as ViewState;
    if (v === 'studio' && currentView !== 'studio') {
      setSelectedProperty(null);
    }
    if (v !== 'intelligence') {
      setLinkedPropertyId(null);
    }
    setCurrentView(v);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
  };

  const handleNewProperty = async (property: Property): Promise<Property | null> => {
    if (!session) return null;

    const { data } = await supabase
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

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0EFE9]">
        <div className="w-8 h-8 border-2 border-[#3BAF7E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── No session ──────────────────────────────────────────────────────────
  if (!session) {
    if (currentView === 'signin') return <SignIn onNavigate={handleNavigate} />;
    if (currentView === 'signup') return <SignUp onNavigate={handleNavigate} />;
    return <LandingPage onGetStarted={() => setCurrentView('signin')} />;
  }

  // ─── Session active ───────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <Layout
        session={session}
        currentView={currentView}
        onNavigate={handleNavigate}
        onSignOut={handleSignOut}
      >
        {currentView === 'dashboard' && (
          <Dashboard session={session} onNavigate={handleNavigate} />
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
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
