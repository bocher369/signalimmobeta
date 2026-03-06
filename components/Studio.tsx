import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Mic, UploadCloud, MapPin, Wifi, Train, 
  Loader2, CheckCircle2, Copy, Printer, RefreshCcw, 
  Mail, Home, StopCircle, X, FileText, Image as ImageIcon,
  Key, Sparkles, PencilLine, BrainCircuit, Check,
  BarChart3, TrendingUp, AlertCircle, Info, Instagram
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, OutputChannel, ProcessingStep, Property } from '../types';

// Tooltip Component
const InfoTooltip = ({ text, align = 'center' }: { text: string, align?: 'center' | 'left' | 'right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  let positionClasses = "left-1/2 -translate-x-1/2";
  let arrowClasses = "left-1/2 -translate-x-1/2";

  if (align === 'right') {
    positionClasses = "right-[-10px]";
    arrowClasses = "right-4";
  } else if (align === 'left') {
    positionClasses = "left-[-10px]";
    arrowClasses = "left-4";
  }
  
  return (
    <div className="relative inline-block ml-2 group">
      <Info 
        size={14} 
        className="text-gray-400 hover:text-brand-600 cursor-help transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      {isVisible && (
        <div className={`absolute bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-none ${positionClasses}`}>
          {text}
          <div className={`absolute top-full border-4 border-transparent border-t-gray-900 ${arrowClasses}`}></div>
        </div>
      )}
    </div>
  );
};

const INITIAL_STEPS: ProcessingStep[] = [
  { id: 1, label: "Analyse des photos (Computer Vision)...", completed: false },
  { id: 2, label: "Extraction données DVF & OpenData...", completed: false },
  { id: 3, label: "Consultation mémoire agent...", completed: false },
  { id: 4, label: "Rédaction Optimisée GEO...", completed: false }
];

const SYSTEM_INSTRUCTION = `
RÔLE : Expert Copywriter Immobilier de Luxe & Architecte de l'Information.

OBJECTIF CRITIQUE : 
Tu dois transformer des données brutes en textes PARFAITEMENT STRUCTURÉS, AÉRÉS et LISIBLES.
L'utilisateur déteste les "pavés" de texte compacts. 

RÈGLES DE MISE EN PAGE (OBLIGATOIRES) :
1. AÉRATION : Utilise SYSTÉMATIQUEMENT deux sauts de ligne (\n\n) entre chaque section.
2. TITRES : Comme le Markdown/HTML est souvent interdit sur les portails, utilise des MAJUSCULES pour structurer visuellement (ex: "L'ESPACE DE VIE : ...").
3. LISTES : Utilise des tirets "-" avec un saut de ligne après chaque élément.
4. SYNTAXE : Français impeccable, TOUS les accents conservés (À, É, È...).

---

CANAL 1 : PORTAIL IMMOBILIER (Clé JSON: "portal")
Structure rigide à respecter scrupuleusement :

[TITRE ACCROCHEUR EN MAJUSCULES - Max 70 chars]

[Saut de ligne double]

[PHRASE D'ACCROCHE ÉMOTIONNELLE]
(2-3 lignes pour situer le contexte et le coup de cœur)

[Saut de ligne double]

L'ESPACE DE VIE :
(Description détaillée du salon, séjour, cuisine, luminosité, sol, matériaux...)

[Saut de ligne double]

LE COIN NUIT :
(Description des chambres, suites, salles de bains...)

[Saut de ligne double]

LES EXTÉRIEURS & ANNEXES :
(Si applicable : Jardin, terrasse, balcon, cave, parking...)

[Saut de ligne double]

INFORMATIONS CLÉS :
- PRIX DE VENTE (ou LOYER MENSUEL) : [Montant] (Honoraires à la charge du [Vendeur/Acquéreur])
- Surface : [Surface Carrez] m² (Loi Carrez) [Si différente, ajouter : / [Surface Sol] m² au sol]
- [Si Appartement] Copropriété : Bien soumis au statut de la copropriété. (Ne pas décrire l'immeuble. Si disponible, indiquer uniquement : "Immeuble comprenant [Nombre total] lots").
- [Si Copropriété] Charges : Montant moyen annuel de la quote-part de charges courantes : [Montant] €.
- [Élément 1 : Chauffage, Climatisation...]
- [Élément 2 : Fenêtres, volets...]
- DPE : Classe [Lettre] | GES : Classe [Lettre]
- Coûts annuels d'énergie : Montant estimé des dépenses annuelles d'énergie pour un usage standard : entre [Min] € et [Max] € par an. Prix moyens des énergies indexés sur l'année [Année] (abonnements compris).
- [Si Location] Dépôt de garantie : [Montant]
- [Si Location dans une zone soumise à l'encadrement des loyers (Paris, Lille, Hellemmes, Lomme, Plaine Commune, Lyon, Villeurbanne, Est Ensemble, Montpellier, Bordeaux, Grenoble-Alpes Métropole, Pays Basque)] :
  - Zone soumise à encadrement des loyers.
  - Loyer de base : [Montant] €
  - Loyer de référence majoré (loyer à ne pas dépasser) : [Montant] €
  - Complément de loyer : [Montant] € (si applicable)
- [Si Vente] Procédure en cours : Aucune.

[Saut de ligne double]

[Ne pas inclure si le bien est un Fonds de Commerce] Les informations sur les risques auxquels ce bien est exposé sont disponibles sur le site Géorisques : www.georisques.gouv.fr

---

CANAL 2 : RÉSEAUX SOCIAUX (Clé JSON: "social")
Style : Impactant, visuel, aéré, usage modéré d'emojis.

[HOOK / ACCROCHE EN 1 LIGNE + EMOJI]

[Saut de ligne]

[PITCH LIFESTYLE COURT]
(Ne pas décrire pièce par pièce, vendre une expérience de vie)

[Saut de ligne]

LES ATOUTS MAJEURS 💎 :
📍 [Localisation précise]
📐 [Surface & Pièces]
✨ [Le détail qui tue]
💰 [Prix]

[Saut de ligne]

[APPEL À L'ACTION (DM / Lien en bio)]

[Saut de ligne]

[3-4 HASHTAGS PERTINENTS]

---

CANAL 3 : EMAIL INVESTISSEUR (Clé JSON: "email")
Style : Professionnel, direct, "Business".

OBJET : [Opportunité / Off-Market] : [Ville] - [Rentabilité ou Atout majeur]

Bonjour,

[Saut de ligne]

[Introduction directe valorisant l'exclusivité pour le contact]

[Saut de ligne]

LE BIEN EN BREF :
- Localisation : [Ville/Quartier]
- Typologie : [T1/T2/Maison...]
- Surface : [M2]
- Prix : [Montant]

[Saut de ligne]

POURQUOI CET INVESTISSEMENT ?
(Analyse rapide : Potentiel locatif, plus-value latente, rareté, ou déficit foncier).

[Saut de ligne]

Dossier complet et photos disponibles sur demande.

Cordialement,

[Signature]

---

CANAL 4 : SCORE GEO (Clé JSON: "score")
Analyse la qualité de l'annonce générée selon 4 critères clés sur 100 :
1. Immersion & Récit (Expérience) : Capacité à projeter le lecteur, storytelling.
2. Précision technique (Expertise) : Détails factuels, vocabulaire immobilier précis.
3. Persuasion et qualité de service (Autorité) : Force de conviction, mise en valeur des atouts.
4. Transparence et réassurance (Confiance) : Clarté, mentions légales, absence de survente.

Donne un score total sur 100 et 3 conseils concrets pour améliorer encore l'annonce.

EXTRACTION METADONNÉES (Clé JSON: "metadata")
- price: Le prix (ex: 450 000 €).
- surface: Surface (ex: 85 m2).
- rooms: Nombre de pièces.
`;

const fileToPart = async (file: File) => {
  return new Promise<any>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface StudioProps {
  onNewProperty?: (property: Property) => void;
  initialProperty?: Property | null;
}

export const Studio: React.FC<StudioProps> = ({ onNewProperty, initialProperty }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasResult, setHasResult] = useState(false);
  const [activeChannel, setActiveChannel] = useState<OutputChannel>('portal');
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [description, setDescription] = useState('');
  const [lastInstruction, setLastInstruction] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({ portal: '', social: '', email: '' });
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Restore state from initialProperty if provided (History Navigation)
  useEffect(() => {
    if (initialProperty) {
      setAddress(initialProperty.address);
      setGeneratedContent(initialProperty.generatedContent || { portal: '', social: '', email: '' });
      setHasResult(true);
      setSteps(INITIAL_STEPS.map(s => ({ ...s, completed: true })));
      setIsProcessing(false);
      setProgress(100);
      setFiles([]); 
      setDescription(''); 
      setLastInstruction(''); // Reset memory when loading from history as we don't have the original prompt context stored
    } else {
      // Reset for new project
      setAddress('');
      setGeneratedContent({ portal: '', social: '', email: '' });
      setHasResult(false);
      setSteps(INITIAL_STEPS.map(s => ({ ...s, completed: false })));
      setProgress(0);
      setFiles([]);
      setDescription('');
      setLastInstruction('');
    }
  }, [initialProperty]);

  // API Key Check
  useEffect(() => {
    const win = window as any;
    if (win.aistudio) {
      win.aistudio.hasSelectedApiKey().then(setHasApiKey);
    }
  }, []);
  
  // Address Autocomplete Logic (API BAN)
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const timer = setTimeout(async () => {
      // Clean address for comparison
      const cleanAddress = address.trim();
      
      if (cleanAddress.length > 3) {
        // Avoid re-searching if the user just selected an address (exact match in suggestions)
        // But allow searching if the user is typing (even if it matches a suggestion partially)
        const isExactMatch = suggestions.some(s => s.toLowerCase() === cleanAddress.toLowerCase());
        
        // Only skip if we have suggestions AND it's an exact match (likely selection)
        // AND we are not currently showing suggestions (which implies selection was made)
        if (isExactMatch && !showSuggestions) {
            return;
        }

        setIsSearchingAddress(true);
        try {
          const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(cleanAddress)}&limit=5`, { signal });
          if (response.ok) {
            const data = await response.json();
            const results = data.features.map((f: any) => f.properties.label);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error("Error fetching addresses:", error);
          }
        } finally {
          if (!signal.aborted) {
            setIsSearchingAddress(false);
          }
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address, showSuggestions]); // Added showSuggestions to dependencies to handle the selection check correctly

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (!address && files.length === 0 && !description) return;
    
    // Update active memory with the user's latest instruction if present
    if (description.trim()) {
        setLastInstruction(description);
    }

    // Always recreate the AI client to ensure fresh API key usage
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    setIsProcessing(true);
    setProgress(5); // Start progress
    setHasResult(false);
    // Deep reset of steps to ensure no reference issues
    setSteps(INITIAL_STEPS.map(s => ({...s, completed: false})));

    try {
        // 1. Prepare Content Parts
        const parts: any[] = [];
        
        // Add text prompt with enhanced instruction prioritization
        let promptText = `Voici les données du bien à traiter:\n`;
        if (address) promptText += `ADRESSE: ${address}\n`;
        
        // Treat description as high-priority instructions, especially if refining
        if (description) {
            promptText += `\nNOTES ET INSTRUCTIONS SPÉCIFIQUES (PRIORITAIRES SUR TOUT LE RESTE): ${description}\n`;
            promptText += `Prends en compte ces instructions pour adapter le ton, la longueur ou les détails de l'annonce.\n`;
        }
        
        // ENHANCED PROMPT FOR COMPUTER VISION
        promptText += `\nINSTRUCTIONS D'ANALYSE MULTIMODALE OBLIGATOIRE :
        1. ANALYSE VISUELLE (Vision) : Scanne méticuleusement les images fournies. Identifie explicitement :
           - Les matériaux (ex: type de parquet, marbre, béton ciré).
           - Les équipements spécifiques (ex: marque de cuisine, îlot central, baignoire, cheminée).
           - La luminosité et l'exposition (basé sur les ombres et fenêtres).
           - Les vues extérieures (jardin, rue, monument).
           - L'état général (rénové, à rafraîchir).
        2. EXTRACTION DOCUMENTAIRE : Lis les PDF/Images pour trouver la surface exacte, le DPE, le prix et la LOCALISATION (Ville/CP).
        3. RÉDACTION : Intègre ces détails visuels ("Preuves par l'image") dans la description pour la rendre ultra-convaincante.
        
        RAPPEL FINAL : STRUCTURE TON TEXTE. Sépare chaque partie (Espace de vie, Nuit, Extérieur) par DES DOUBLES SAUTS DE LIGNE.`;
        
        parts.push({ text: promptText });

        // Add files
        const fileParts = await Promise.all(files.map(fileToPart));
        parts.push(...fileParts);

        // 2. Start Animation Loop (Visual feedback)
        let currentStep = 0;
        const interval = setInterval(() => {
            // Use cumulative logic (<=) to ensure previous steps are always marked completed
            setSteps(prev => prev.map((s, idx) => 
                idx <= currentStep ? { ...s, completed: true } : s
            ));
            
            // Calculate progress based on steps (approximate)
            // 4 steps total. 
            // Step 0: 25%, Step 1: 50%, Step 2: 75%, Step 3: 90% (wait for API)
            const targetProgress = Math.min(95, Math.round(((currentStep + 1) / INITIAL_STEPS.length) * 100));
            setProgress(targetProgress);

            currentStep = Math.min(currentStep + 1, INITIAL_STEPS.length - 1);
        }, 800); // Accelerated from 1500 to 800ms for snappier feedback

        // 3. Call Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: { parts },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for max speed
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        metadata: {
                            type: Type.OBJECT,
                            properties: {
                                price: { type: Type.STRING, description: "Prix du bien (ex: 388 500 €) ou 'Non communiqué'" },
                                surface: { type: Type.STRING, description: "Surface (ex: 98 m2)" },
                                rooms: { type: Type.STRING, description: "Nombre de pièces" },
                                location: { type: Type.STRING, description: "Localisation du bien (Ville + Code Postal) extraite des documents ou de la description" }
                            }
                        },
                        portal: { type: Type.STRING, description: "Contenu pour le portail immobilier (Fiche Maître) - Texte structuré avec sauts de ligne" },
                        social: { type: Type.STRING, description: "Post pour les réseaux sociaux - Texte structuré avec sauts de ligne" },
                        email: { type: Type.STRING, description: "Email pour client investisseur - Texte structuré avec sauts de ligne" },
                        score: {
                            type: Type.OBJECT,
                            properties: {
                                total: { type: Type.NUMBER, description: "Score global sur 100" },
                                criteria: {
                                    type: Type.OBJECT,
                                    properties: {
                                        experience: { type: Type.NUMBER, description: "Score Expérience sur 100" },
                                        expertise: { type: Type.NUMBER, description: "Score Expertise sur 100" },
                                        authority: { type: Type.NUMBER, description: "Score Autorité sur 100" },
                                        trust: { type: Type.NUMBER, description: "Score Confiance sur 100" }
                                    }
                                },
                                tips: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "3 conseils pour améliorer le score"
                                }
                            }
                        }
                    },
                    required: ["metadata", "portal", "social", "email", "score"]
                }
            }
        });

        // 4. Handle Response
        clearInterval(interval);
        // Complete all steps visually
        setSteps(prev => prev.map(s => ({ ...s, completed: true })));
        setProgress(100);
        
        const resultText = response.text;
        if (resultText) {
            const parsed = JSON.parse(resultText);
            setGeneratedContent(parsed);
            
            // Add to history
            if (onNewProperty) {
              // Try to find an image file for the thumbnail from the uploaded files
              const imageFile = files.find(f => f.type.startsWith('image/'));
              
              const imagePreview = imageFile 
                ? URL.createObjectURL(imageFile) 
                : ""; // No fallback image, will use icon instead
              
              onNewProperty({
                id: Date.now().toString(),
                address: parsed.metadata?.location || address || "Localisation du bien",
                price: parsed.metadata?.price || "Prix sur demande",
                image: imagePreview,
                geoScore: parsed.score?.total || 94,
                date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
                generatedContent: parsed,
                metadata: parsed.metadata,
                type: 'listing'
              });
            }

            setTimeout(() => {
                setIsProcessing(false);
                setHasResult(true);
            }, 500);
        }

    } catch (error: any) {
        console.error("Generation failed:", error);
        setIsProcessing(false);
        setProgress(0);
        const errorMessage = error.message || JSON.stringify(error);
        
        // Handle specific 404/Entity not found which implies API Key/Project issue
        if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404") || error.status === 404) {
             setHasApiKey(false); // Force UI update to show key selection
        } else {
             alert("Une erreur technique est survenue. Veuillez réessayer.");
        }
    }
  };

  const handleCopy = async () => {
    const textToCopy = activeChannel === 'score' ? '' : generatedContent[activeChannel];
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset visual feedback after 2s
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePrint = () => {
    const contentToPrint = activeChannel === 'score' ? '' : generatedContent[activeChannel];
    
    if (!contentToPrint || typeof contentToPrint !== 'string') {
        return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Impression Annonce</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            padding: 40px;
                            white-space: pre-wrap;
                            color: #333;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                    </style>
                </head>
                <body>${contentToPrint}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        // printWindow.close(); // Optional: let the user close it to ensure print dialog isn't cut off
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Erreur de reconnaissance vocale", event.error);
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setDescription(prev => {
        const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
        return prev + spacer + transcript;
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    // If user clears input, hide suggestions immediately
    if (e.target.value.length === 0) setShowSuggestions(false);
  };

  const selectAddress = (addr: string) => {
    setAddress(addr);
    setShowSuggestions(false);
  };

  // File Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // Filter basic types just in case
        const droppedFiles = (Array.from(e.dataTransfer.files) as File[]).filter(file => 
            file.type.match(/(image\/.*|application\/pdf)/)
        );
        setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // LAYOUT BLOCKS DEFINITIONS
  const instructionsBlock = (
    <div className="mb-6 relative">
      <div className="flex justify-between items-center mb-2 px-1">
           <label className={`text-sm font-medium ${hasResult ? 'text-brand-600 flex items-center gap-2' : 'text-gray-700'}`}>
              {hasResult ? <><PencilLine size={14} /> Instructions de retouche</> : 'Notes & Instructions'}
           </label>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={hasResult ? "Ajoutez ici vos instructions pour modifier l'annonce (ex: 'Rends le ton plus dynamique', 'Ajoute que le métro est à 2 min', 'Supprime la mention des travaux')..." : "Décrivez ici le bien (ex: cuisine américaine, calme sur cour...) ou utilisez le micro."}
        className={`w-full p-4 pr-4 pb-14 bg-gray-50 border rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none resize-none min-h-[120px] text-sm leading-relaxed ${isRecording ? 'ring-2 ring-red-100 bg-red-50/10 placeholder-red-300 border-red-200' : 'border-transparent'} ${hasResult ? 'border-brand-200 bg-brand-50/20' : ''}`}
      />
      
      <div className="absolute bottom-3 right-3 flex items-center gap-3">
         <span className={`text-xs text-gray-400 font-medium transition-opacity ${description.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
           {description.length} chars
         </span>
         <button 
          onClick={toggleRecording}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border shadow-sm ${
            isRecording 
            ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:text-brand-600'
          }`}
         >
           {isRecording ? (
             <>
               <StopCircle size={14} className="fill-current" />
               <span>Arrêter</span>
             </>
           ) : (
             <>
               <Mic size={14} />
               <span>Dicter</span>
             </>
           )}
         </button>
      </div>
    </div>
  );

  const actionBlock = (
    <div className="mb-6">
        {!hasApiKey ? (
             <div className="space-y-2">
                 <button 
                  onClick={async () => {
                      const win = window as any;
                      if (win.aistudio) {
                          await win.aistudio.openSelectKey();
                          setHasApiKey(true);
                      }
                  }}
                  className="w-full py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-yellow-500/20 bg-yellow-500 text-white hover:bg-yellow-600 transition-all flex items-center justify-center gap-3 relative z-10"
                >
                  <Key size={20} /> Sélectionner une clé API payante
                </button>
                <p className="text-center text-xs text-gray-400">
                    Une clé API avec facturation activée est requise. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-gray-600">En savoir plus</a>
                </p>
             </div>
        ) : (
            <button 
              onClick={handleGenerate}
              disabled={((!address && files.length === 0 && !description) || isProcessing) && !initialProperty && !hasResult}
              className={`w-full py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-brand-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-3 relative z-10
                ${((!address && files.length === 0 && !description) || isProcessing) && !initialProperty && !hasResult
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-brand-500/40'}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" /> {hasResult ? 'Mise à jour en cours...' : 'Analyser et Générer'}
                </>
              ) : (
                <>
                  {hasResult ? (
                    <><Sparkles size={20} /> Mettre à jour l'annonce</>
                  ) : (
                    <><RefreshCcw size={20} /> {initialProperty ? 'Régénérer l\'annonce' : 'Générer l\'annonce GEO'}</>
                  )}
                </>
              )}
            </button>
        )}
    </div>
  );

  const addressBlock = (
    <div className="relative mb-6 z-50">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {isSearchingAddress ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
        </div>
        <input 
          type="text" 
          placeholder="Saisissez l'adresse complète (ex: 6 avenue de...)" 
          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none font-medium"
          value={address}
          onChange={handleAddressChange}
          autoComplete="off"
        />
        
        {/* Address Autocomplete Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectAddress(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                  <MapPin size={14} />
                </div>
                <span className="text-gray-700 font-medium text-sm">{suggestion}</span>
              </button>
            ))}
            <div className="px-2 py-1 bg-gray-50 text-[10px] text-gray-400 text-center uppercase tracking-wider">
              Source: Base Adresse Nationale
            </div>
          </div>
        )}
    </div>
  );

  const uploadBlock = (
    <>
        <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-brand-300 hover:bg-brand-50/30 transition-all cursor-pointer group"
        >
            <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            />
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:text-brand-600 transition-colors">
            <UploadCloud size={24} />
            </div>
            <p className="text-gray-900 font-medium mb-1">Glissez photos & documents ici</p>
            <p className="text-sm text-gray-400">JPG, PDF, PNG acceptés</p>
        </div>

        {/* File List */}
        {files.length > 0 && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm group/item transition-all hover:shadow-md">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100 relative ${file.type.includes('pdf') ? 'bg-red-50' : 'bg-gray-50'}`}>
                    {file.type.startsWith('image/') ? (
                        <img 
                            src={URL.createObjectURL(file)} 
                            alt="preview" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <FileText size={24} className="text-red-500" />
                    )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }} 
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                >
                    <X size={18} />
                </button>
                </div>
            ))}
            </div>
        )}
    </>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      
      {/* LEFT COLUMN: INPUT */}
      <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative z-20">
          
          {/* Action Block moved to top */}
          {actionBlock}

          <h2 className="text-xl font-semibold mb-6 text-gray-900">
            Données du bien
          </h2>
          
          {hasResult ? (
            <>
                {/* MODE RAFFINEMENT: Instructions en haut */}
                {instructionsBlock}
                <div className="w-full h-px bg-gray-100 mb-6"></div>
                {addressBlock}
                {uploadBlock}
            </>
          ) : (
             <>
                {/* MODE INITIAL: Adresse en haut */}
                {addressBlock}
                {instructionsBlock}
                {uploadBlock}
             </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: OUTPUT */}
      <div className="relative h-full min-h-[500px] animate-in slide-in-from-right-4 duration-500 delay-100">
        
        {/* State: IDLE */}
        {!isProcessing && !hasResult && (
          <div className="h-full bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center p-8 opacity-50">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
              <UploadCloud size={40} />
            </div>
            <h3 className="text-xl font-medium text-gray-400 mb-2">En attente de données</h3>
            <p className="text-gray-400 max-w-xs">Remplissez les informations à gauche pour lancer le moteur GEO.</p>
          </div>
        )}

        {/* State: PROCESSING */}
        {isProcessing && (
          <div className="h-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-start pt-24">
             <div className="w-full max-w-md space-y-8">
                {/* Header Title & Progress */}
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-semibold text-gray-900 animate-pulse">
                      {hasResult ? 'Mise à jour de l\'annonce...' : 'Construction de l\'annonce...'}
                  </h3>
                  
                  {/* Gauge / Progress Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div 
                        className="bg-brand-600 h-2.5 rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 font-medium tracking-wide">
                     TEMPS ESTIMÉ : ~6 SECONDES
                  </p>
                </div>

                {/* Steps List */}
                <div className="space-y-4 pt-6 border-t border-gray-50">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 
                        ${step.completed ? 'bg-green-100 text-green-600 scale-110' : 'bg-gray-100 text-gray-300'}`}>
                        {step.completed ? <CheckCircle2 size={18} /> : <div className="w-2 h-2 bg-current rounded-full" />}
                      </div>
                      <span className={`font-medium transition-colors duration-300 ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        )}

        {/* State: RESULT */}
        {hasResult && (
          <div className="h-full flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl shadow-brand-900/5">
            
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-t-3xl">
              <div className="flex bg-gray-100/50 p-1 rounded-xl overflow-x-auto">
                <button 
                  onClick={() => setActiveChannel('portal')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeChannel === 'portal' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Home size={16} /> Portail
                </button>
                <button 
                  onClick={() => setActiveChannel('social')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeChannel === 'social' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Instagram size={16} /> Social
                </button>
                <button 
                  onClick={() => setActiveChannel('email')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeChannel === 'email' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Mail size={16} /> Email
                </button>
                <button 
                  onClick={() => setActiveChannel('score')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeChannel === 'score' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <BarChart3 size={16} /> Score GEO
                </button>
              </div>
              
              <div className="flex items-center gap-2 justify-end">
                 {activeChannel !== 'score' && (
                   <>
                     <button 
                      onClick={handleCopy}
                      className={`p-2 rounded-lg transition-all duration-200 ${isCopied ? 'text-green-600 bg-green-50 scale-110' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50'}`}
                      title="Copier le texte"
                     >
                      {isCopied ? <Check size={18} /> : <Copy size={18} />}
                     </button>
                     
                     <button 
                        onClick={handlePrint}
                        className="p-2 rounded-lg transition-colors text-gray-400 hover:text-brand-600 hover:bg-brand-50" 
                        title="Imprimer"
                     >
                        <Printer size={18} />
                     </button>
                   </>
                 )}
              </div>
            </div>

            {/* Content Editor */}
            <div className="flex-1 p-6 overflow-y-auto bg-[#FAFAFA]">
              {activeChannel === 'score' ? (
                <div className="space-y-8 max-w-2xl mx-auto">
                    {/* Total Score */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                        <h3 className="text-gray-500 font-medium mb-2 uppercase tracking-wide text-sm">Score IA & Visibilité</h3>
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-6xl font-bold text-gray-900">{generatedContent.score?.total || 0}</span>
                            <span className="text-2xl text-gray-400 font-light">/ 100</span>
                        </div>
                        <p className="text-gray-400 mt-4 text-sm">
                            Votre annonce a de fortes chances d'attirer des acquéreurs et d'être mise en avant par les moteurs de recherche IA.
                        </p>
                    </div>

                    {/* Criteria Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <span className="text-gray-600 font-medium">Immersion & Récit</span>
                                    <InfoTooltip text="Ce score évalue votre capacité à faire vivre le bien à travers votre texte. Pour l'augmenter, aidez le futur acquéreur à se projeter en décrivant l'ambiance, la luminosité naturelle, la fluidité de l'agencement et les atouts de la vie de quartier." />
                                </div>
                                <span className="text-brand-600 font-bold">{generatedContent.score?.criteria.experience || 0}/100</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${generatedContent.score?.criteria.experience || 0}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <span className="text-gray-600 font-medium">Précision technique</span>
                                    <InfoTooltip align="right" text="Ce score mesure le niveau de détail factuel de votre annonce. Valorisez votre connaissance du bien en précisant des éléments concrets : nature des matériaux, type de chauffage, année de construction ou détails sur les derniers travaux réalisés." />
                                </div>
                                <span className="text-brand-600 font-bold">{generatedContent.score?.criteria.expertise || 0}/100</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${generatedContent.score?.criteria.expertise || 0}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <span className="text-gray-600 font-medium">Persuasion et qualité de service</span>
                                    <InfoTooltip text="Ce score reflète la force de persuasion de votre annonce. Pour l'améliorer, mettez en avant la rareté du bien sur le marché (ex: dernier étage, vue dégagée, absence de vis-à-vis) et soulignez la qualité de votre mandat ou de vos services." />
                                </div>
                                <span className="text-brand-600 font-bold">{generatedContent.score?.criteria.authority || 0}/100</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${generatedContent.score?.criteria.authority || 0}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <span className="text-gray-600 font-medium">Transparence et réassurance</span>
                                    <InfoTooltip align="right" text="Ce score indique si votre annonce est complète et sécurisante pour l'acheteur. Assurez-vous de la présence de toutes les informations légales obligatoires (DPE, loi ALUR, montant précis des charges, copropriété) pour instaurer une confiance immédiate." />
                                </div>
                                <span className="text-brand-600 font-bold">{generatedContent.score?.criteria.trust || 0}/100</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${generatedContent.score?.criteria.trust || 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Tips Section */}
                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                        <h4 className="flex items-center gap-2 font-semibold text-indigo-900 mb-4">
                            <TrendingUp size={20} />
                            Leviers d'amélioration
                        </h4>
                        <ul className="space-y-3">
                            {generatedContent.score?.tips?.map((tip, index) => (
                                <li key={index} className="flex items-start gap-3 text-indigo-800 text-sm leading-relaxed">
                                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-indigo-500" />
                                    {tip}
                                </li>
                            )) || (
                                <li className="text-indigo-400 italic text-sm">Aucun conseil disponible pour le moment.</li>
                            )}
                        </ul>
                    </div>
                </div>
              ) : (
                <div className="max-w-none prose prose-gray prose-p:text-gray-600 prose-headings:font-semibold prose-headings:text-gray-800">
                   {/* Memory Badge */}
                   <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-6 flex items-start gap-3">
                      <div className="mt-0.5">
                        {lastInstruction ? (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        ) : (
                          <BrainCircuit size={16} className="text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1">Mémoire Active</p>
                        <p className="text-sm text-indigo-700 leading-relaxed italic">
                          {lastInstruction 
                            ? `« ${lastInstruction} »` 
                            : "En attente de vos instructions de personnalisation (ex: 'Ton plus chaleureux', 'Ajoute le parking')..."}
                        </p>
                      </div>
                   </div>

                   {/* Text Area */}
                   <textarea 
                    className="w-full h-[800px] bg-transparent border-none resize-none focus:ring-0 text-gray-800 leading-relaxed text-base font-normal"
                    value={generatedContent[activeChannel as keyof GeneratedContent] as string}
                    onChange={(e) => setGeneratedContent(prev => ({...prev, [activeChannel]: e.target.value}))}
                   />
                </div>
              )}
            </div>
            
            {/* Footer Score */}
            <div className="bg-white px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 rounded-b-3xl">
              <span>Généré en 4.2s</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600">GEO Score: {generatedContent.score?.total || 94}/100</span>
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-green-500 rounded-full" style={{ width: `${generatedContent.score?.total || 94}%` }}></div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};