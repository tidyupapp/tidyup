export type Platform = 'ebay' | 'facebook' | 'offerup' | 'nextdoor' | 'craigslist';

export type Condition = 'new' | 'like-new' | 'good' | 'fair' | 'for-parts';

export interface Listing {
  id: string;
  createdAt: number;
  imageDataUrl: string;
  title: string;
  description: string;
  priceMin: number;
  priceMax: number;
  category: string;
  condition: Condition;
  suggestedPlatforms: Platform[];
  selectedPlatforms: Platform[];
  status: 'draft' | 'published';
  postedTo: Platform[];
}

export type Provider = 'claude' | 'gemini';

export interface AiListingDraft {
  title: string;
  description: string;
  priceMin: number;
  priceMax: number;
  category: string;
  condition: Condition;
  suggestedPlatforms: Platform[];
  identifiedItem: string;
  notes?: string;
}

export type ChatMessage =
  | { id: string; kind: 'text'; from: 'assistant' | 'user'; text: string }
  | { id: string; kind: 'photo'; from: 'user'; imageDataUrl: string }
  | { id: string; kind: 'thinking'; from: 'assistant' }
  | { id: string; kind: 'listing'; from: 'assistant'; listing: Listing };
