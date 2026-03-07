import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { Search, Filter, ArrowLeft, MapPin, Ghost, LayoutGrid, List, ArrowRight, FileText, Trash2 } from 'lucide-react';

interface HistoryProps {
    onBack: () => void;
    history: Property[];
    onSelectProperty: (property: Property) => void;
    onDeleteProperty: (id: string, imagePath: string) => void;
    onClearHistory: () => void;
}

export const History: React.FC<HistoryProps> = ({ onBack, history, onSelectProperty, onDeleteProperty, onClearHistory }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(item => 
    item.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.price.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors md:hidden"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                    Mémoire & <span className="font-semibold">Historique</span>
                </h1>
                <p className="text-gray-500 mt-1 font-light">
                    Retrouvez l'ensemble de vos optimisations GEO et rapports d'intelligence.
                </p>
            </div>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-4">
            
            <button 
                onClick={() => {
                    if (window.confirm("Êtes-vous sûr de vouloir effacer tout l'historique ?")) {
                        onClearHistory();
                    }
                }}
                className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
            >
                Effacer l'historique
            </button>

            {/* View Toggle */}
            <div className="hidden md:flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Vue Grille"
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Vue Liste"
                >
                    <List size={18} />
                </button>
            </div>

            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Rechercher un bien..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64 shadow-sm transition-all"
                />
            </div>
        </div>
      </div>

      {/* Content */}
      {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
               <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                  <Ghost size={32} />
               </div>
               <h3 className="text-xl font-medium text-gray-800">Aucun résultat</h3>
               <p className="text-gray-400 mt-2 max-w-sm">
                   {history.length === 0 ? "Vos annonces générées et vos rapports d'analyse apparaîtront ici." : "Aucun bien ne correspond à votre recherche."}
               </p>
          </div>
      ) : (
        <>
            {viewMode === 'grid' ? (
                // GRID VIEW
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredHistory.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => onSelectProperty(item)}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                    >
                        <div className="relative h-48 overflow-hidden bg-gray-50">
                        
                        {item.image ? (
                            <img src={item.image} alt={item.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                        ) : item.type === 'intelligence' ? (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 group-hover:scale-105 transition-transform duration-500">
                                <MapPin size={48} className="text-indigo-400" />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50 group-hover:scale-105 transition-transform duration-500">
                                <Sparkles size={48} className="text-brand-400" />
                            </div>
                        )}
                        
                        {/* Badge Differentiation */}
                        {item.type !== 'intelligence' && (
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-brand-700 border border-white/50 shadow-sm">
                            GEO {item.geoScore}/100
                            </div>
                        )}
                        
                        </div>
                        <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900 truncate pr-4 text-base">{item.address}</h4>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className={`font-semibold ${item.type === 'intelligence' ? 'text-indigo-600' : 'text-brand-600'}`}>
                                {item.price}
                            </p>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{item.date}</span>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
            ) : (
                // LIST VIEW
                <div className="flex flex-col gap-3">
                    {filteredHistory.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => onSelectProperty(item)}
                        className="group flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 relative border border-gray-100">
                                {item.image ? (
                                    <img src={item.image} alt={item.address} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : item.type === 'intelligence' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                                        <MapPin size={24} className="text-indigo-400" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                        <Sparkles size={24} className="text-brand-400" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Info */}
                            <div className="min-w-0">
                                <h4 className="font-medium text-gray-900 truncate text-base mb-1">{item.address}</h4>
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-semibold ${item.type === 'intelligence' ? 'text-indigo-600' : 'text-brand-600'}`}>
                                        {item.price}
                                    </span>
                                    <span className="text-gray-300 hidden sm:inline">•</span>
                                    <span className="text-xs text-gray-400">{item.date}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status / Score & Arrow */}
                        <div className="flex items-center gap-6 pl-4">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteProperty(item.id, item.image);
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                            <div className="hidden sm:block">
                                {item.type !== 'intelligence' && (
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                                        GEO {item.geoScore}/100
                                    </span>
                                )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </>
      )}
    </div>
  );
};