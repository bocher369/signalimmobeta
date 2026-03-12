export interface TerritorialData {
  address: string;
  coordinates?: { lat: number; lon: number };
  generated_at: string;
  report_markdown: string;
  cadastral?: { section?: string; numero?: string; contenance?: string };
  zoning?: Array<{ type?: string; libelle?: string; code?: string }>;
}

export interface GeneratedContent {
  portal: string;
  social: string;
  email: string;
  score?: {
    total: number;
    reasoning: string;
    criteria: {
      experience: number;
      expertise: number;
      authority: number;
      trust: number;
    };
    tips: string[];
  };
}

export interface PropertyMetadata {
  price?: string;
  surface?: string;
  rooms?: string;
}

export type PropertyType = 'listing' | 'intelligence';

export interface Property {
  id: string;
  address: string;
  price: string;
  image: string;
  geoScore: number;
  date: string;
  generatedContent?: GeneratedContent;
  metadata?: PropertyMetadata;
  type?: PropertyType;
  reportContent?: string;
  territorial_data?: TerritorialData;
}

export type ViewState = 'landing' | 'dashboard' | 'studio' | 'history' | 'intelligence' | 'signin' | 'signup';

export type OutputChannel = 'portal' | 'social' | 'email' | 'score';

export interface ProcessingStep {
  id: number;
  label: string;
  completed: boolean;
}