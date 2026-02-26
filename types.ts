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
}

export type ViewState = 'dashboard' | 'studio' | 'history' | 'intelligence';

export type OutputChannel = 'portal' | 'social' | 'email' | 'score';

export interface ProcessingStep {
  id: number;
  label: string;
  completed: boolean;
}