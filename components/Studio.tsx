import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Mic, UploadCloud, MapPin, Wifi, Train, 
  Loader2, CheckCircle2, Copy, Printer, RefreshCcw, 
  Mail, Home, StopCircle, X, FileText, Image as ImageIcon,
  Sparkles, PencilLine, BrainCircuit, Check,
  BarChart3, TrendingUp, AlertCircle, Info, Instagram, Globe
} from 'lucide-react';
import { GeneratedContent, OutputChannel, ProcessingStep, Property } from '../types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const MONO  = { fontFamily: 'IBM Plex Mono, monospace' }
const SANS  = { fontFamily: 'DM Sans, sans-serif' }
const inputClass  = 'w-full bg-[#F0EFE9] border border-[#E8E6DF] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#3BAF7E] focus:ring-1 focus:ring-[#3BAF7E] transition-colors'
const labelClass  = 'block text-xs font-medium text-[#6B6B6B] mb-1.5'
const cardClass   = 'bg-white rounded-2xl p-6 border border-[#E8E6DF]'

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
        className="text-gray-400 hover:text-[#3BAF7E] cursor-help transition-colors"
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

DÉTECTION AUTOMATIQUE DU TYPE DE BIEN :
Analyse les données fournies et détecte le type de bien parmi :
- RÉSIDENTIEL (maison, appartement, villa, studio)
- IMMEUBLE DE RAPPORT (immeuble, lots, studios, colocation)
- FONDS DE COMMERCE (tabac, bar, restaurant, commerce, bureau)
- TERRAIN (terrain, parcelle, constructible)

Selon le type détecté, utilise la structure de description adaptée :

SI RÉSIDENTIEL :
L'ESPACE DE VIE :
(Description salon, séjour, cuisine, luminosité, matériaux)

LE COIN NUIT :
(Description chambres, salles de bains)

LES EXTÉRIEURS & ANNEXES :
(Jardin, terrasse, balcon, cave, parking)

SI IMMEUBLE DE RAPPORT :
LA STRUCTURE DU BIEN :
(Composition globale, nombre de lots, surfaces totales, état général, année de rénovation)

LES UNITÉS LOCATIVES :
(Description de chaque lot ou type de lot, équipements, standing, surfaces)

PERFORMANCE FINANCIÈRE :
(Loyers actuels, revenus annuels, taux d'occupation, charges, rentabilité brute estimée)

ATOUTS PATRIMONIAUX :
(Emplacement, qualité construction/rénovation, potentiel de revalorisation, fiscalité applicable)

SI FONDS DE COMMERCE :
L'ACTIVITÉ & L'EMPLACEMENT :
(Nature de l'activité, historique, visibilité, flux piétons, concurrence)

LE POTENTIEL COMMERCIAL :
(Clientèle cible, chiffre d'affaires, marges, perspectives de développement)

LES CHIFFRES CLÉS :
(CA, EBE, loyer du bail, durée restante, conditions de cession)

LES CONDITIONS DE REPRISE :
(Éléments inclus dans la cession, formation, accompagnement, stock)

SI TERRAIN :
LA PARCELLE :
(Surface, forme, topographie, exposition, accès, viabilisation)

LE POTENTIEL CONSTRUCTIBLE :
(Zonage PLU, COS, emprise au sol, hauteur max, type de construction autorisé)

L'ENVIRONNEMENT IMMÉDIAT :
(Voisinage, vue, nuisances éventuelles, accès transports)

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
  onNewProperty?: (property: Property) => Promise<Property | null> | void;
  initialProperty?: Property | null;
  onNavigateToIntelligence?: (property: Property) => void;
}

export const Studio: React.FC<StudioProps> = ({ onNewProperty, initialProperty, onNavigateToIntelligence }) => {
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
  const [isCopied, setIsCopied] = useState(false);
  const [savedProperty, setSavedProperty] = useState<Property | null>(null);

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
    setSavedProperty(null);
  }, [initialProperty]);
  
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

        // 3. Call Supabase Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                model: "gemini-3-flash-preview",
                contents: [{ parts }],
                systemInstruction: SYSTEM_INSTRUCTION,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            metadata: {
                                type: "OBJECT",
                                properties: {
                                    price: { type: "STRING", description: "Prix du bien (ex: 388 500 €) ou 'Non communiqué'" },
                                    surface: { type: "STRING", description: "Surface (ex: 98 m2)" },
                                    rooms: { type: "STRING", description: "Nombre de pièces" },
                                    location: { type: "STRING", description: "Localisation du bien (Ville + Code Postal) extraite des documents ou de la description" }
                                }
                            },
                            portal: { type: "STRING", description: "Contenu pour le portail immobilier (Fiche Maître) - Texte structuré avec sauts de ligne" },
                            social: { type: "STRING", description: "Post pour les réseaux sociaux - Texte structuré avec sauts de ligne" },
                            email: { type: "STRING", description: "Email pour client investisseur - Texte structuré avec sauts de ligne" },
                            score: {
                                type: "OBJECT",
                                properties: {
                                    total: { type: "NUMBER", description: "Score global sur 100" },
                                    criteria: {
                                        type: "OBJECT",
                                        properties: {
                                            experience: { type: "NUMBER", description: "Score Expérience sur 100" },
                                            expertise: { type: "NUMBER", description: "Score Expertise sur 100" },
                                            authority: { type: "NUMBER", description: "Score Autorité sur 100" },
                                            trust: { type: "NUMBER", description: "Score Confiance sur 100" }
                                        }
                                    },
                                    tips: {
                                        type: "ARRAY",
                                        items: { type: "STRING" },
                                        description: "3 conseils pour améliorer le score"
                                    }
                                }
                            }
                        },
                        required: ["metadata", "portal", "social", "email", "score"]
                    }
                }
            })
        });

        if (!response.ok) throw new Error('Failed to generate content');
        const data = await response.json();

        // 4. Handle Response
        clearInterval(interval);
        // Complete all steps visually
        setSteps(prev => prev.map(s => ({ ...s, completed: true })));
        setProgress(100);
        
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
              
              const newItem: Property = {
                id: Date.now().toString(),
                address: parsed.metadata?.location || address || "Localisation du bien",
                price: parsed.metadata?.price || "Prix sur demande",
                image: imagePreview,
                geoScore: parsed.score?.total || 94,
                date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
                generatedContent: parsed,
                metadata: parsed.metadata,
                type: 'listing'
              };
              const savedResult = await onNewProperty(newItem);
              if (savedResult) setSavedProperty(savedResult);
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
        alert("Une erreur technique est survenue. Veuillez réessayer.");
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
           <label className={`block text-xs font-medium mb-1.5 ${hasResult ? 'text-[#3BAF7E] flex items-center gap-2' : 'text-[#6B6B6B]'}`} style={SANS}>
              {hasResult ? <><PencilLine size={14} /> Instructions de retouche</> : 'Notes & Instructions'}
           </label>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={hasResult ? "Ajoutez ici vos instructions pour modifier l'annonce (ex: 'Rends le ton plus dynamique', 'Ajoute que le métro est à 2 min', 'Supprime la mention des travaux')..." : "Décrivez ici le bien (ex: cuisine américaine, calme sur cour...) ou utilisez le micro."}
        className={`w-full bg-[#F0EFE9] border border-[#E8E6DF] rounded-xl px-4 py-3 pb-14 text-sm text-[#1A1A1A] placeholder-[#9E9E9E] focus:outline-none focus:border-[#3BAF7E] focus:ring-1 focus:ring-[#3BAF7E] transition-colors resize-none min-h-[120px] leading-relaxed ${isRecording ? 'ring-1 ring-red-300 border-red-200' : ''} ${hasResult ? 'border-[#3BAF7E]/30' : ''}`}
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
        <button 
          onClick={handleGenerate}
          disabled={((!address && files.length === 0 && !description) || isProcessing) && !initialProperty && !hasResult}
          style={SANS}
          className={`w-full py-3 rounded-full font-semibold text-base shadow-lg shadow-[#3BAF7E]/20 transition-all active:scale-95 flex items-center justify-center gap-3 relative z-10
            ${((!address && files.length === 0 && !description) || isProcessing) && !initialProperty && !hasResult
              ? 'bg-[#E8E6DF] text-[#9E9E9E] cursor-not-allowed'
              : 'bg-[#3BAF7E] text-white hover:bg-[#2A8F62] hover:shadow-[#3BAF7E]/40'}`}
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
    </div>
  );

  const addressBlock = (
    <div className="relative mb-6 z-50">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isSearchingAddress ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </div>
        <input
          type="text"
          placeholder="Saisissez l'adresse complète (ex: 6 avenue de...)"
          className="w-full pl-9 pr-4 bg-[#F0EFE9] border border-[#E8E6DF] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#9E9E9E] focus:outline-none focus:border-[#3BAF7E] focus:ring-1 focus:ring-[#3BAF7E] transition-colors"
          value={address}
          onChange={handleAddressChange}
          autoComplete="off"
        />
        
        {/* Address Autocomplete Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-[#E8E6DF] overflow-hidden z-50">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectAddress(suggestion)}
                className="w-full text-left px-3 py-2.5 hover:bg-[#F0EFE9] flex items-center gap-2.5 transition-colors border-b border-[#F0EFE9] last:border-0 cursor-pointer"
              >
                <MapPin size={14} className="text-[#3BAF7E] flex-shrink-0" />
                <span className="text-gray-700 font-medium text-sm">{suggestion}</span>
              </button>
            ))}
            <div className="px-3 py-1 bg-[#F0EFE9] text-[10px] text-[#9E9E9E] text-center uppercase tracking-wider">
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
            className="border-2 border-dashed border-[#E8E6DF] rounded-2xl p-8 text-center hover:border-[#3BAF7E] hover:bg-[#F0EFE9]/50 transition-all cursor-pointer group"
        >
            <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            />
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-[#9E9E9E] group-hover:text-[#3BAF7E] transition-colors">
            <UploadCloud size={24} />
            </div>
            <p className="text-[#1A1A1A] font-medium mb-1">Glissez photos & documents ici</p>
            <p className="text-sm text-[#9E9E9E]">JPG, PDF, PNG acceptés</p>
        </div>

        {/* File List */}
        {files.length > 0 && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#F0EFE9] border border-[#E8E6DF] rounded-xl group/item transition-all hover:border-[#3BAF7E]/30">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#E8E6DF] relative ${file.type.includes('pdf') ? 'bg-red-50' : 'bg-white'}`}>
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
                        <span className="text-sm font-medium text-[#1A1A1A] truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-[#9E9E9E]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }} 
                    className="p-2 hover:bg-[#E8E6DF] rounded-lg text-[#9E9E9E] hover:text-red-500 transition-colors"
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
    <div className="min-h-full bg-[#F0EFE9]">
      {/* Header de page */}
      <div className="px-8 pt-8 pb-0">
        <p className="text-xs tracking-widest text-[#9E9E9E] uppercase" style={MONO}>STUDIO ANNONCES</p>
        <h1 className="font-bold text-3xl text-[#1A1A1A] mt-1" style={SANS}>Générateur d'annonces GEO</h1>
        <p className="text-sm text-[#6B6B6B] mt-1" style={SANS}>Analyse Gemini · Score GEO · Publication multi-canal</p>
      </div>
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-120px)]">

      {/* LEFT COLUMN: INPUT */}
      <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
        
        <div className="bg-white rounded-2xl p-6 border border-[#E8E6DF] relative z-20">
          
          {/* Action Block moved to top */}
          {actionBlock}

          <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-4" style={MONO}>
            Données du bien
          </p>
          
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
          <div className="h-full bg-white rounded-2xl border border-[#E8E6DF] flex flex-col items-center justify-center text-center p-8 opacity-60">
            <div className="w-20 h-20 bg-[#F0EFE9] rounded-full flex items-center justify-center text-[#9E9E9E] mb-6">
              <UploadCloud size={40} />
            </div>
            <h3 className="text-xl font-medium text-[#9E9E9E] mb-2">En attente de données</h3>
            <p className="text-[#9E9E9E] max-w-xs">Remplissez les informations à gauche pour lancer le moteur GEO.</p>
          </div>
        )}

        {/* State: PROCESSING */}
        {isProcessing && (
          <div className="h-full bg-white rounded-2xl border border-[#E8E6DF] p-8 flex flex-col items-center justify-start pt-24">
             <div className="w-full max-w-md space-y-8">
                {/* Header Title & Progress */}
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-semibold text-gray-900 animate-pulse" style={SANS}>
                      {hasResult ? 'Mise à jour de l\'annonce...' : 'Construction de l\'annonce...'}
                  </h3>
                  
                  {/* Gauge / Progress Bar */}
                  <div className="w-full bg-[#E8E6DF] rounded-full h-2.5 overflow-hidden">
                    <div
                        className="bg-[#3BAF7E] h-2.5 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 font-medium tracking-wide">
                     TEMPS ESTIMÉ : ~6 SECONDES
                  </p>
                </div>

                {/* Steps List */}
                <div className="space-y-4 pt-6 border-t border-[#E8E6DF]">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                        ${step.completed ? 'bg-[#3BAF7E] text-white scale-110' : 'bg-[#F0EFE9] text-[#9E9E9E]'}`}>
                        {step.completed ? <CheckCircle2 size={18} /> : <div className="w-2 h-2 bg-current rounded-full" />}
                      </div>
                      <span className={`font-medium transition-colors duration-300 ${step.completed ? 'text-[#1A1A1A]' : 'text-[#9E9E9E]'}`}>
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
          <div className="h-full flex flex-col bg-white rounded-2xl border border-[#E8E6DF] shadow-xl shadow-[#0A1628]/5">
            
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-[#E8E6DF] bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-t-2xl">
              <div className="flex bg-[#F0EFE9] p-1 rounded-xl overflow-x-auto">
                <button 
                  onClick={() => setActiveChannel('portal')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeChannel === 'portal' ? 'bg-white text-[#3BAF7E] shadow-sm' : 'text-[#9E9E9E] hover:text-[#6B6B6B]'}`}
                >
                  <Home size={16} /> Portail
                </button>
                <button
                  onClick={() => setActiveChannel('social')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeChannel === 'social' ? 'bg-white text-pink-600 shadow-sm' : 'text-[#9E9E9E] hover:text-[#6B6B6B]'}`}
                >
                  <Instagram size={16} /> Social
                </button>
                <button
                  onClick={() => setActiveChannel('email')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeChannel === 'email' ? 'bg-white text-purple-600 shadow-sm' : 'text-[#9E9E9E] hover:text-[#6B6B6B]'}`}
                >
                  <Mail size={16} /> Email
                </button>
                <button
                  onClick={() => setActiveChannel('score')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeChannel === 'score' ? 'bg-white text-[#3BAF7E] shadow-sm' : 'text-[#9E9E9E] hover:text-[#6B6B6B]'}`}
                >
                  <BarChart3 size={16} /> Score GEO
                </button>
              </div>
              
              <div className="flex items-center gap-2 justify-end">
                 {savedProperty && onNavigateToIntelligence && (
                   <button
                     onClick={() => onNavigateToIntelligence({ ...savedProperty, address })}
                     className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#3BAF7E] bg-[#F0EFE9] rounded-lg hover:bg-[#E8E6DF] transition-colors border border-[#E8E6DF]"
                   >
                     <Globe size={14} /> Analyser le territoire
                   </button>
                 )}
                 {activeChannel !== 'score' && (
                   <>
                     <button
                      onClick={handleCopy}
                      className={`p-2 rounded-lg transition-all duration-200 ${isCopied ? 'text-[#3BAF7E] bg-[#F0EFE9] scale-110' : 'text-gray-400 hover:text-[#3BAF7E] hover:bg-[#F0EFE9]'}`}
                      title="Copier le texte"
                     >
                      {isCopied ? <Check size={18} /> : <Copy size={18} />}
                     </button>
                     
                     <button 
                        onClick={handlePrint}
                        className="p-2 rounded-lg transition-colors text-gray-400 hover:text-[#3BAF7E] hover:bg-[#F0EFE9]" 
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
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E8E6DF] text-center relative overflow-hidden">
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
                        <div className="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <span className="text-gray-600 font-medium">Immersion & Récit</span>
                                    <InfoTooltip text="Ce score évalue votre capacité à faire vivre le bien à travers votre texte. Pour l'augmenter, aidez le futur acquéreur à se projeter en décrivant l'ambiance, la luminosité naturelle, la fluidité de l'agencement et les atouts de la vie de quartier." />
                                </div>
                                <span className="text-[#3BAF7E] font-bold">{generatedContent.score?.criteria.experience || 0}/100</span>
                            </div>
                            <div className="w-full bg-[#E8E6DF] rounded-full h-2">
                                <div className="bg-[#3BAF7E] h-2 rounded-full" style={{ width: `${generatedContent.score?.criteria.experience || 0}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <span className="text-gray-600 font-medium">Précision technique</span>
                                    <InfoTooltip align="right" text="Ce score mesure le niveau de détail factuel de votre annonce. Valorisez votre connaissance du bien en précisant des éléments concrets : nature des matériaux, type de chauffage, année de construction ou détails sur les derniers travaux réalisés." />
                                </div>
                                <span className="text-[#3BAF7E] font-bold">{generatedContent.score?.criteria.expertise || 0}/100</span>
                            </div>
                            <div className="w-full bg-[#E8E6DF] rounded-full h-2">
                                <div className="bg-[#3BAF7E] h-2 rounded-full" style={{ width: `${generatedContent.score?.criteria.expertise || 0}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <span className="text-gray-600 font-medium">Persuasion et qualité de service</span>
                                    <InfoTooltip text="Ce score reflète la force de persuasion de votre annonce. Pour l'améliorer, mettez en avant la rareté du bien sur le marché (ex: dernier étage, vue dégagée, absence de vis-à-vis) et soulignez la qualité de votre mandat ou de vos services." />
                                </div>
                                <span className="text-[#3BAF7E] font-bold">{generatedContent.score?.criteria.authority || 0}/100</span>
                            </div>
                            <div className="w-full bg-[#E8E6DF] rounded-full h-2">
                                <div className="bg-[#3BAF7E] h-2 rounded-full" style={{ width: `${generatedContent.score?.criteria.authority || 0}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <span className="text-gray-600 font-medium">Transparence et réassurance</span>
                                    <InfoTooltip align="right" text="Ce score indique si votre annonce est complète et sécurisante pour l'acheteur. Assurez-vous de la présence de toutes les informations légales obligatoires (DPE, loi ALUR, montant précis des charges, copropriété) pour instaurer une confiance immédiate." />
                                </div>
                                <span className="text-[#3BAF7E] font-bold">{generatedContent.score?.criteria.trust || 0}/100</span>
                            </div>
                            <div className="w-full bg-[#E8E6DF] rounded-full h-2">
                                <div className="bg-[#3BAF7E] h-2 rounded-full" style={{ width: `${generatedContent.score?.criteria.trust || 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Tips Section */}
                    <div className="bg-[#F0EFE9] rounded-2xl p-6 border border-[#E8E6DF]">
                        <h4 className="flex items-center gap-2 font-semibold text-[#1A1A1A] mb-4">
                            <TrendingUp size={20} />
                            Leviers d'amélioration
                        </h4>
                        <ul className="space-y-3">
                            {generatedContent.score?.tips?.map((tip, index) => (
                                <li key={index} className="flex items-start gap-3 text-[#1A1A1A] text-sm leading-relaxed">
                                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-[#3BAF7E]" />
                                    {tip}
                                </li>
                            )) || (
                                <li className="text-[#9E9E9E] italic text-sm">Aucun conseil disponible pour le moment.</li>
                            )}
                        </ul>
                    </div>
                </div>
              ) : (
                <div className="max-w-none prose prose-gray prose-p:text-gray-600 prose-headings:font-semibold prose-headings:text-gray-800">
                   {/* Memory Badge */}
                   <div className="bg-[#F0EFE9] border border-[#E8E6DF] rounded-lg p-3 mb-6 flex items-start gap-3">
                      <div className="mt-0.5">
                        {lastInstruction ? (
                          <div className="w-2 h-2 bg-[#3BAF7E] rounded-full animate-pulse"></div>
                        ) : (
                          <BrainCircuit size={16} className="text-[#9E9E9E]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-1">Mémoire Active</p>
                        <p className="text-sm text-[#6B6B6B] leading-relaxed italic">
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
            <div className="bg-white px-6 py-3 border-t border-[#E8E6DF] flex items-center justify-between text-xs text-gray-400 rounded-b-2xl">
              <span>Généré en 4.2s</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#3BAF7E]">GEO Score: {generatedContent.score?.total || 94}/100</span>
                <div className="w-16 h-1.5 bg-[#E8E6DF] rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#3BAF7E] rounded-full" style={{ width: `${generatedContent.score?.total || 94}%` }}></div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
      </div>
    </div>
  );
};