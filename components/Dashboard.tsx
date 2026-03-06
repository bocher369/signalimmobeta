import React, { useState, useEffect } from 'react';
import { Sun, Sparkles, ArrowRight, TrendingUp, FileText, MapPin, Ghost } from 'lucide-react';
import { Property } from '../types';

interface DashboardProps {
  onNavigateToStudio: () => void;
  onNavigateToIntelligence: () => void;
  onNavigateToHistory: () => void;
  onSelectProperty: (property: Property) => void;
  history: Property[];
  userFirstName?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToStudio, onNavigateToIntelligence, onNavigateToHistory, onSelectProperty, history, userFirstName }) => {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const urls: Record<string, string> = {};
      const itemsToFetch = history.slice(0, 3);
      for (const item of itemsToFetch) {
        if (item.image && !item.image.startsWith('blob:')) {
          const url = await getSignedUrl(item.image);
          if (url) urls[item.id] = url;
        } else if (item.image) {
            urls[item.id] = item.image;
        }
      }
      setSignedUrls(urls);
    };
    fetchSignedUrls();
  }, [history]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight">
            Bonjour, <span className="font-semibold">{userFirstName || 'Utilisateur'}</span>
          </h1>
          <p className="text-gray-500 mt-2 text-lg font-light">
            Prêt à dominer les algorithmes aujourd'hui ?
          </p>
        </div>
      </header>
      
      {/* Hero Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New Card */}
        <div 
          onClick={onNavigateToStudio}
          className="group relative overflow-hidden bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-brand-500/10 border border-gray-100 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={120} className="text-brand-600" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-4 group-hover:scale-110 transition-transform duration-300">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Nouvelle Annonce GEO</h2>
              <p className="text-gray-500 leading-relaxed">
                Créez une annonce optimisée pour l'IA en quelques secondes. Analyse multimodale et structuration automatique.
              </p>
            </div>
            <div className="flex items-center gap-2 text-brand-600 font-medium group-hover:gap-4 transition-all">
              Commencer <ArrowRight size={18} />
            </div>
          </div>
        </div>

        {/* Intelligence Territoriale Card */}
        <div 
          onClick={onNavigateToIntelligence}
          className="group relative overflow-hidden bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer"
        >
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <MapPin size={120} className="text-indigo-600" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform duration-300">
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Intelligence Territoriale</h2>
              <p className="text-gray-500 leading-relaxed">
                Connaître le secteur de votre bien pour enrichir votre argumentaire. Télécharger le rapport complet.
              </p>
            </div>
            <div className="flex items-center gap-2 text-indigo-600 font-medium group-hover:gap-4 transition-all">
              Découvrir <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </section>

      {/* Memory & History Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-brand-600 rounded-full"></div>
            <h3 className="text-xl font-medium text-gray-900">Mémoire & Historique</h3>
          </div>
          {history.length > 0 && (
            <button 
              onClick={onNavigateToHistory}
              className="text-sm text-gray-400 hover:text-brand-600 transition-colors px-3 py-1 rounded-lg hover:bg-brand-50"
            >
              Voir tout
            </button>
          )}
        </div>

        {history.length === 0 ? (
           <div className="bg-gray-50 rounded-3xl p-12 text-center border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4 shadow-sm">
                  <Ghost size={24} />
              </div>
              <p className="text-gray-500 font-medium">Votre historique est vide</p>
              <p className="text-sm text-gray-400 mt-1">Commencez par générer une annonce ou une analyse de secteur.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {history.slice(0, 3).map((item) => (
              <div 
                  key={item.id} 
                  onClick={() => onSelectProperty(item)}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden bg-gray-50">
                  
                  {signedUrls[item.id] ? (
                    <img src={signedUrls[item.id]} alt={item.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : item.type === 'intelligence' ? (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 group-hover:scale-105 transition-transform duration-500">
                      <MapPin size={48} className="text-indigo-400 opacity-80" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 group-hover:scale-105 transition-transform duration-500">
                      <FileText size={48} className="text-blue-300 opacity-80" />
                    </div>
                  )}
                  
                  {item.type !== 'intelligence' && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-brand-700 border border-white/50 shadow-sm">
                      GEO {item.geoScore}/100
                    </div>
                  )}
                  
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 truncate pr-4">{item.address}</h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{item.date}</span>
                  </div>
                  <p className={`font-semibold ${item.type === 'intelligence' ? 'text-indigo-600' : 'text-brand-600'}`}>
                      {item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};