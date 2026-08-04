export interface SurveyQuestion {
  id: string;
  type: "multiple_choice" | "rating" | "text" | "voice" | "video";
  text: string;
  options?: string[];
}

export interface Survey {
  id: string;
  title: string;
  type: string;
  points: number;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  questions: SurveyQuestion[];
}

export interface Transaction {
  id: string;
  date: string;
  type: "earn" | "redeem";
  amount: number;
  description: string;
}

export interface Wallet {
  balance: number;
  lifetimeEarnings: number;
  pending: number;
  history: Transaction[];
}
