export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  authProvider: 'google' | 'custom' | 'guest';
  signedInAt: string;
}

export interface MetricLog {
  id: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  type: 'steps' | 'water' | 'calories' | 'sleep' | 'mood' | 'weight' | 'food';
  value: number; // e.g. steps quantity, water in ml, calories in kcal, sleep in hours, mood value (1-5), weight in kg, food calories in kcal
  notes?: string;
  photo?: string; // base64 or object URL of captured meal photo
}

export interface DailyGoals {
  steps: number;
  water: number; // in ml
  calories: number; // target active burn in kcal
  sleep: number; // target in hours
  food: number; // target food intake in kcal
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string
}

export interface HealthState {
  logs: MetricLog[];
  goals: DailyGoals;
  chatHistory: ChatMessage[];
}
