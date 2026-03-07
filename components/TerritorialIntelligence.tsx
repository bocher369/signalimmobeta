import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Sparkles, MapPin, Building2, TrendingUp, ArrowRight, FileText, Mic, StopCircle, PencilLine, Download, Copy, Check, Info, UploadCloud, X } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { parse } from "marked";
import { Property } from '../types';

interface AddressFeature {
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    label: string;
    citycode: string;
    city: string;
  };
}

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

interface TerritorialIntelligenceProps {
  onNewEntry?: (property: Property) => void;
  initialData?: Property | null;
}

export const TerritorialIntelligence: React.FC<TerritorialIntelligenceProps> = ({ onNewEntry, initialData }) => {
  const [address, setAddress] = useState('');
  // Store full address details including coordinates
  const [selectedLocation, setSelectedLocation] = useState<AddressFeature | null>(null);
  
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [reportResult, setReportResult] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  // New state for inputs matching Studio
  const [specificInstructions, setSpecificInstructions] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Restore state from initialData if provided (History Navigation)
  useEffect(() => {
    if (initialData) {
      setAddress(initialData.address);
      if (initialData.reportContent) {
        setReportResult(initialData.reportContent);
      }
      setFiles([]);
      setSpecificInstructions('');
    }
  }, [initialData]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Address Autocomplete Logic
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const timer = setTimeout(async () => {
      // Only search if user hasn't just selected an address (avoid loop)
      if (address.length > 3 && (!selectedLocation || address !== selectedLocation.properties.label)) {
        setIsSearchingAddress(true);
        try {
          const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=5`, { signal });
          if (response.ok) {
            const data = await response.json();
            // Store the full feature object
            setSuggestions(data.features);
            setShowSuggestions(data.features.length > 0);
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
      } else if (address.length <= 3) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
        clearTimeout(timer);
        controller.abort();
    };
  }, [address, selectedLocation]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    // Reset selection if user types manually
    if (selectedLocation && e.target.value !== selectedLocation.properties.label) {
        setSelectedLocation(null);
    }
    if (e.target.value.length === 0) setShowSuggestions(false);
  };

  const selectAddress = (feature: AddressFeature) => {
    setAddress(feature.properties.label);
    setSelectedLocation(feature);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // File Upload Handlers (Matching Studio)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
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

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

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
      setSpecificInstructions(prev => {
        const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
        return prev + spacer + transcript;
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Helper to fetch Cadastral Parcel from IGN API
  const fetchCadastralData = async (lon: number, lat: number) => {
      try {
          const url = `https://apicarto.ign.fr/api/cadastre/parcelle?geom={"type":"Point","coordinates":[${lon},${lat}]}`;
          const response = await fetch(url);
          if (response.ok) {
              const data = await response.json();
              if (data.features && data.features.length > 0) {
                  const props = data.features[0].properties;
                  return {
                      section: props.section,
                      numero: props.numero,
                      contenance: props.contenance
                  };
              }
          }
      } catch (error) {
          console.error("Failed to fetch cadastre:", error);
      }
      return null;
  };

  // Helper to fetch Zoning from IGN GPU API
  const fetchZoningData = async (lon: number, lat: number) => {
      try {
          const url = `https://apicarto.ign.fr/api/gpu/zone-urba?geom={"type":"Point","coordinates":[${lon},${lat}]}`;
          const response = await fetch(url);
          if (response.ok) {
              const data = await response.json();
              if (data.features && data.features.length > 0) {
                  return data.features.map((f: any) => ({
                      type: f.properties.typezone,
                      libelle: f.properties.libelle,
                      code: f.properties.partition
                  }));
              }
          }
      } catch (error) {
          console.error("Failed to fetch zoning:", error);
      }
      return null;
  };

  const handleGenerateReport = async () => {
    if (!address && files.length === 0) return;

    setIsProcessing(true);
    setReportResult('');

    try {
      // Detection of specific types via text content
      const textContent = (specificInstructions + " " + address).toLowerCase();
      const isTerrain = textContent.includes('terrain');
      const isPro = textContent.includes('commerce') || textContent.includes('bureau') || textContent.includes('local');

      let cadastralInfo = null;
      let zoningInfo = null;

      // If it's a terrain and we have coordinates, fetch Cadastre AND Zoning
      if (isTerrain && selectedLocation) {
          const [lon, lat] = selectedLocation.geometry.coordinates;
          const [cadastre, zoning] = await Promise.all([
              fetchCadastralData(lon, lat),
              fetchZoningData(lon, lat)
          ]);
          cadastralInfo = cadastre;
          zoningInfo = zoning;
      }

      let promptText = `Rôle : Tu es un expert en Intelligence Territoriale, Urbanisme et analyse immobilière.
      Objectif : Rédiger un rapport complet, neutre et factuel sur le secteur de l'adresse suivante : ${address}.
      
      ANALYSE MULTIMODALE :
      Si des images sont fournies, analyse-les pour comprendre le contexte (type de rue, vis-à-vis, état du bâti environnant, densité) et intègre ces observations dans la "Synthèse du Quartier".

      RÈGLE D'OR : Écris en français correct avec TOUS les accents (é, è, à, etc.). Ne jamais remplacer un caractère accentué par une lettre sans accent.

      ${specificInstructions ? `
      IMPORTANT - INSTRUCTION SPÉCIFIQUE UTILISATEUR :
      L'utilisateur a ajouté cette demande particulière. Tu dois impérativement en tenir compte et adapter le rapport en conséquence : "${specificInstructions}"
      ` : ''}`;

      if (isTerrain) {
          promptText += `
          CONTEXTE SPÉCIFIQUE TERRAIN (DONNÉES OFFICIELLES) :
          ${cadastralInfo ? `PARCELLE CADASTRALE : Section ${cadastralInfo.section} N°${cadastralInfo.numero}.` : ''}
          ${zoningInfo ? `ZONAGE PLU DÉTECTÉ VIA API IGN (GÉOPORTAIL) : ${JSON.stringify(zoningInfo)}.` : 'Zonage précis non détecté via API.'}
          Coordonnées GPS utilisées : ${selectedLocation ? JSON.stringify(selectedLocation.geometry.coordinates) : 'Non précisées'}.

          TACHE PRIORITAIRE URBANISME (PLU) :
          1. ANALYSE LE ZONAGE FOURNI CI-DESSUS (SI DISPONIBLE). C'est la source de vérité absolue.
          2. Si pas de zonage API, utilise Google Search pour trouver le PLU de la ville.
          3. Donne un verdict clair sur la constructibilité apparente.
          `;
      }

      promptText += `
      Instructions de formatage (Générer la réponse en blocs avec la structure suivante) :

      # Synthèse du Quartier
      (Un paragraphe accrocheur de 3-4 lignes décrivant l'ambiance générale du secteur).

      ${isTerrain ? `
      # Analyse Parcellaire & Urbanisme (SPÉCIAL TERRAIN)
      **Référence Cadastrale** : ${cadastralInfo ? `Section ${cadastralInfo.section} N°${cadastralInfo.numero}` : 'Non identifiée automatiquement'}.
      **Zonage PLU Officiel** : ${zoningInfo && zoningInfo.length > 0 ? `**${zoningInfo[0].code}** (${zoningInfo[0].libelle})` : '[Non détecté automatiquement, voir analyse ci-dessous]'}
      
      ## Constructibilité & Règles
      | Critère | Verdict | Détails |
      | :--- | :--- | :--- |
      | Constructibilité | [Oui/Non/Sous conditions] | [Explication] |
      | Emprise au sol | [Est. %] | [Détails] |
      | Hauteur max | [Est. m] | [Détails] |
      
      **Analyse détaillée** : (Explique les conséquences concrètes du zonage détecté).
      ` : ''}

      # Client Cible & Profil
      (Définir la cible idéale sous forme de liste à puces).
      - **Profil 1** : [Description]
      - **Profil 2** : [Description]

      # Argumentaire de Vente (Pitch)
      (3 "Bullet points" percutants avec emojis).
      - 💎 [Point fort 1]
      - 📍 [Point fort 2]
      - 📈 [Point fort 3]

      # Marché Immobilier Local
      Présente les données sous forme de tableau avec l'évolution sur 1 an et 5 ans :
      | Indicateur | Valeur Estimée | Évolution 1 an | Évolution 5 ans |
      | :--- | :--- | :--- | :--- |
      | Prix moyen vente | [Prix] €/m² | [Ex: +2%] | [Ex: +15%] |
      ${isTerrain ? '| Prix moyen terrain | [Prix] €/m² | - | - |' : '| Loyer moyen | [Prix] €/m² | - | - |'}

      # Commodités & Accessibilité
      Utilise des listes pour la clarté :
      - **Transports** : [Liste]
      - **Écoles** : [Liste]
      - **Commerces** : [Liste]
      
      VERIFICATION STRICTE : Vérifie l'existence réelle des commerces via Google Search. Ne cite pas d'enseignes fantômes.

      ${!isTerrain ? `
      # Urbanisme & Projets
      (Projets urbains à proximité).
      ` : ''}
      
      ${isPro ? `
      # Valorisation & Marché des Fonds de Commerce
      (Données pros).
      ` : ''}

      # Sources
      (Lister les sources, mentionner "Géoportail de l'Urbanisme" si le zonage a été trouvé).

      IMPORTANT : Identifie précisément la localisation (Ville, Code Postal) pour le champ 'location' du JSON de sortie.
      `;

      // Prepare parts for multimodal request
      const parts: any[] = [{ text: promptText }];
      const fileParts = await Promise.all(files.map(fileToPart));
      parts.push(...fileParts);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-generate`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
              model: "gemini-3-flash-preview",
              contents: [{ parts }],
              systemInstruction: "",
              generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: "OBJECT",
                      properties: {
                          location: { type: "STRING" },
                          report: { type: "STRING" }
                      },
                      required: ["location", "report"]
                  }
              },
              tools: [{ google_search: {} }]
          })
      });

      if (!response.ok) throw new Error('Failed to generate report');
      const data = await response.json();

      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(resultText);
      setReportResult(parsed.report);
      
      // Save to history
      if (onNewEntry) {
          // Try to find an image file for thumbnail
          const imageFile = files.find(f => f.type.startsWith('image/'));
          const imagePreview = imageFile ? URL.createObjectURL(imageFile) : "";

          const newItem: Property = {
              id: Date.now().toString(),
              address: parsed.location || address || "Localisation du bien",
              price: "Analyse Secteur", 
              image: imagePreview,
              geoScore: 98,
              date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
              type: 'intelligence',
              reportContent: parsed.report
          };
          onNewEntry(newItem);
      }
    } catch (error: any) {
        console.error("Report generation failed:", error);
        alert("Une erreur est survenue lors de la génération du rapport.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    try {
        const htmlContent = parse(reportResult);
        const blobHtml = new Blob([htmlContent as string], { type: "text/html" });
        const blobText = new Blob([reportResult], { type: "text/plain" });
        const data = [new ClipboardItem({
            ["text/html"]: blobHtml,
            ["text/plain"]: blobText
        })];
        await navigator.clipboard.write(data);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error("Erreur copie:", err);
        await navigator.clipboard.writeText(reportResult);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);
    
    let y = 20;

    // Helper to clean text
    const cleanText = (text: string) => {
        if (!text) return '';
        // Remove emojis
        let cleaned = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
        // Remove markdown bold/italic
        cleaned = cleaned.replace(/\*\*/g, '').replace(/\*/g, '');
        // Remove specific artifacts like "!—" or "!- " which might be broken markdown images or list markers
        cleaned = cleaned.replace(/!—/g, '').replace(/!-/g, '').replace(/! /g, '');
        return cleaned.trim();
    };

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text("Rapport d'Intelligence Territoriale", margin, y);
    y += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Adresse : ${address}`, margin, y);
    y += 6;
    doc.text(`Date : ${new Date().toLocaleDateString()}`, margin, y);
    y += 15;

    // Content
    doc.setTextColor(0, 0, 0);
    const lines = reportResult.split('\n');
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Check for page break
        if (y > pageHeight - margin) {
            doc.addPage();
            y = 20;
        }

        // Table Detection
        if (line.startsWith('|')) {
            if (!inTable) {
                inTable = true;
                // Parse headers
                tableHeaders = line.split('|').filter(cell => cell.trim() !== '').map(cell => cleanText(cell));
                // Skip separator line (e.g., |---|---|)
                if (lines[i+1] && lines[i+1].trim().startsWith('|') && lines[i+1].includes('---')) {
                    i++; 
                }
            } else {
                // Parse row
                const row = line.split('|').filter(cell => cell.trim() !== '').map(cell => cleanText(cell));
                if (row.length > 0) {
                    tableRows.push(row);
                }
            }
            continue; // Skip standard text rendering for table lines
        } else if (inTable) {
            // End of table, render it
            autoTable(doc, {
                startY: y,
                head: [tableHeaders],
                body: tableRows,
                margin: { left: margin, right: margin },
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], halign: 'left' }, // Indigo-600
                styles: { 
                    fontSize: 9, 
                    cellPadding: 3,
                    overflow: 'linebreak',
                    valign: 'middle'
                },
                columnStyles: {
                    // Optional: Adjust specific columns if needed, but auto usually works
                }
            });
            
            // Update y position after table
            y = (doc as any).lastAutoTable.finalY + 10;
            
            // Reset table state
            inTable = false;
            tableHeaders = [];
            tableRows = [];
        }

        // Standard Text Rendering
        let text = cleanText(line);

        if (line.startsWith('# ')) {
            // H1
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            text = text.replace(/^#\s+/, '');
            y += 5;
        } else if (line.startsWith('## ')) {
            // H2
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            text = text.replace(/^##\s+/, '');
            y += 4;
        } else if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
            // List item
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            text = text.replace(/^[-*]\s+/, '');
            
            // Draw bullet
            doc.circle(margin + 2, y - 1.5, 1, 'F');
            
            // Indent text
            const wrappedText = doc.splitTextToSize(text, maxLineWidth - 10);
            doc.text(wrappedText, margin + 8, y);
            y += (wrappedText.length * 5) + 2;
            continue;
        } else {
            // Normal text
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
        }

        if (text) {
            const wrappedText = doc.splitTextToSize(text, maxLineWidth);
            doc.text(wrappedText, margin, y);
            y += (wrappedText.length * 5) + 2;
        }
    }
    
    // Render any pending table at the end of the document
    if (inTable && tableHeaders.length > 0) {
         autoTable(doc, {
            startY: y,
            head: [tableHeaders],
            body: tableRows,
            margin: { left: margin, right: margin },
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], halign: 'left' },
            styles: { 
                fontSize: 9, 
                cellPadding: 3,
                overflow: 'linebreak',
                valign: 'middle'
            },
        });
    }

    doc.save(`Rapport_Intelligence_${new Date().getTime()}.pdf`);
  };

  // Layout Blocks
  const actionBlock = (
    <div className="mb-6">
        <button 
            onClick={handleGenerateReport}
            disabled={(!address && files.length === 0) || isProcessing}
            className={`w-full py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-3 relative z-10
            ${(!address && files.length === 0) || isProcessing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/40'}`}
        >
            {isProcessing ? (
            <>
                <Loader2 className="animate-spin" /> 
                {address.toLowerCase().includes('terrain') || specificInstructions.toLowerCase().includes('terrain')
                    ? "Consultation Cadastre & Urbanisme (IGN)..." 
                    : "Analyse du secteur en cours..."}
            </>
            ) : (
            <>
                    {initialData ? "Régénérer le rapport" : "Générer le rapport"}
            </>
            )}
        </button>
    </div>
  );

  const addressBlock = (
    <div className="relative mb-6 z-30">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {isSearchingAddress ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
        </div>
        <input 
          type="text" 
          placeholder="Saisissez l'adresse complète (ex: 6 avenue de...)" 
          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium"
          value={address}
          onChange={handleAddressChange}
          autoComplete="off"
        />
        
        {/* Address Autocomplete Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectAddress(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <MapPin size={14} />
                </div>
                <span className="text-gray-700 font-medium text-sm">{suggestion.properties.label}</span>
              </button>
            ))}
            <div className="px-2 py-1 bg-gray-50 text-[10px] text-gray-400 text-center uppercase tracking-wider">
              Source: Base Adresse Nationale
            </div>
          </div>
        )}
    </div>
  );

  const instructionsBlock = (
    <div className="mb-6 relative">
      <div className="flex justify-between items-center mb-2 px-1">
           <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <PencilLine size={14} /> Notes & Instructions (Optionnel)
           </label>
      </div>
      <textarea
        value={specificInstructions}
        onChange={(e) => setSpecificInstructions(e.target.value)}
        placeholder="Décrivez le bien pour aider l'analyse (ex: 'Terrain de 500m2', 'Proche future ligne de tramway')..."
        className={`w-full p-4 pr-4 pb-14 bg-gray-50 border rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none resize-none min-h-[120px] text-sm leading-relaxed ${isRecording ? 'ring-2 ring-red-100 bg-red-50/10 placeholder-red-300 border-red-200' : 'border-transparent'}`}
      />
      
      <div className="absolute bottom-3 right-3 flex items-center gap-3">
         <span className={`text-xs text-gray-400 font-medium transition-opacity ${specificInstructions.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
           {specificInstructions.length} chars
         </span>
         <button 
          onClick={toggleRecording}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border shadow-sm ${
            isRecording 
            ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
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

  const uploadBlock = (
    <>
        <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
        >
            <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            />
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:text-indigo-600 transition-colors">
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
          
          {actionBlock}

          <h2 className="text-xl font-semibold mb-6 text-gray-900">
            Données du bien
          </h2>

          {addressBlock}
          {instructionsBlock}
          {uploadBlock}

        </div>
      </div>

      {/* RIGHT COLUMN: OUTPUT */}
      <div className="relative h-full min-h-[500px] animate-in slide-in-from-right-4 duration-500 delay-100">
        {!reportResult ? (
          <div className={`h-full bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center p-8 opacity-50 ${isProcessing ? 'justify-start pt-20' : 'justify-center'}`}>
             {isProcessing ? (
                 <div className="flex flex-col items-center gap-4">
                     <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                            <TrendingUp size={24} />
                        </div>
                     </div>
                     <div>
                        <h3 className="text-xl font-medium text-gray-800">
                            {address.toLowerCase().includes('terrain') ? 'Consultation du Cadastre' : 'Recherche de données'}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                             {address.toLowerCase().includes('terrain') ? 'Vérification de la parcelle et du PLU...' : 'Interrogation des bases de données...'}
                        </p>
                     </div>
                 </div>
             ) : (
                 <>
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                        <TrendingUp size={40} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-400 mb-2">En attente de données</h3>
                    <p className="text-gray-400 max-w-xs">Remplissez les informations à gauche pour lancer le rapport.</p>
                 </>
             )}
          </div>
        ) : (
            <div className="h-full flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-900/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
                     <div className="flex items-center gap-2 text-indigo-800 font-semibold">
                         <FileText size={20} /> Rapport d'Intelligence
                     </div>
                     <div className="flex items-center gap-2">
                         <button 
                            onClick={handleCopy}
                            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Copier le texte"
                         >
                             {isCopied ? <Check size={18} /> : <Copy size={18} />}
                         </button>
                         <button 
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                         >
                             <Download size={16} />
                             Télécharger le rapport .pdf
                         </button>
                     </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto bg-[#FAFAFA]">
                    <div ref={reportRef} className="bg-white p-8 min-h-full">
                        <div className="mb-6 border-b pb-4">
                            <h1 className="text-2xl font-bold text-gray-900">Rapport d'Intelligence Territoriale</h1>
                            <p className="text-gray-500 mt-1">Adresse : {address}</p>
                            <p className="text-gray-400 text-sm">Généré le {new Date().toLocaleDateString()}</p>
                        </div>
                        <article 
                            className="prose prose-indigo max-w-none"
                            dangerouslySetInnerHTML={{ __html: parse(reportResult) as string }}
                        />
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};