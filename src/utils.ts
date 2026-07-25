import { MetricLog, DailyGoals } from './types';

// Helper to generate dates relative to today
export function getRelativeDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export const DEFAULT_GOALS: DailyGoals = {
  steps: 10000,
  water: 2500, // 2500 ml
  calories: 500, // 500 kcal active burn
  sleep: 8, // 8 hours
  food: 2000, // 2000 kcal food intake target
};

export const SEED_LOGS: MetricLog[] = [
  // 6 Days Ago
  { id: '1', timestamp: new Date(getRelativeDateString(6) + 'T08:00:00Z').toISOString(), date: getRelativeDateString(6), type: 'steps', value: 8400, notes: 'Morning walk' },
  { id: '2', timestamp: new Date(getRelativeDateString(6) + 'T12:00:00Z').toISOString(), date: getRelativeDateString(6), type: 'water', value: 1500 },
  { id: '3', timestamp: new Date(getRelativeDateString(6) + 'T17:00:00Z').toISOString(), date: getRelativeDateString(6), type: 'calories', value: 420, notes: 'Quick run' },
  { id: '4', timestamp: new Date(getRelativeDateString(6) + 'T07:00:00Z').toISOString(), date: getRelativeDateString(6), type: 'sleep', value: 7.5, notes: 'Bedtime: 11:30 PM, Wake: 7:00 AM' },
  { id: '5', timestamp: new Date(getRelativeDateString(6) + 'T21:00:00Z').toISOString(), date: getRelativeDateString(6), type: 'mood', value: 4, notes: 'Felt productive' },
  { id: '6', timestamp: new Date(getRelativeDateString(6) + 'T09:00:00Z').toISOString(), date: getRelativeDateString(6), type: 'weight', value: 74.2 },
  { id: 'f1', timestamp: new Date(getRelativeDateString(6) + 'T08:30:00Z').toISOString(), date: getRelativeDateString(6), type: 'food', value: 450, notes: 'Breakfast: Oatmeal & Fruit' },
  { id: 'f2', timestamp: new Date(getRelativeDateString(6) + 'T13:00:00Z').toISOString(), date: getRelativeDateString(6), type: 'food', value: 680, notes: 'Lunch: Chicken Salad & Quinoa' },
  { id: 'f3', timestamp: new Date(getRelativeDateString(6) + 'T19:30:00Z').toISOString(), date: getRelativeDateString(6), type: 'food', value: 720, notes: 'Dinner: Salmon & Asparagus' },

  // 5 Days Ago
  { id: '11', timestamp: new Date(getRelativeDateString(5) + 'T08:00:00Z').toISOString(), date: getRelativeDateString(5), type: 'steps', value: 9200 },
  { id: '12', timestamp: new Date(getRelativeDateString(5) + 'T12:00:00Z').toISOString(), date: getRelativeDateString(5), type: 'water', value: 2000 },
  { id: '13', timestamp: new Date(getRelativeDateString(5) + 'T18:00:00Z').toISOString(), date: getRelativeDateString(5), type: 'calories', value: 480, notes: 'HIIT workout' },
  { id: '14', timestamp: new Date(getRelativeDateString(5) + 'T07:15:00Z').toISOString(), date: getRelativeDateString(5), type: 'sleep', value: 7.0, notes: 'Bedtime: 11:45 PM, Wake: 6:45 AM' },
  { id: '15', timestamp: new Date(getRelativeDateString(5) + 'T21:00:00Z').toISOString(), date: getRelativeDateString(5), type: 'mood', value: 3, notes: 'Slightly tired' },
  { id: '16', timestamp: new Date(getRelativeDateString(5) + 'T09:00:00Z').toISOString(), date: getRelativeDateString(5), type: 'weight', value: 73.9 },
  { id: 'f11', timestamp: new Date(getRelativeDateString(5) + 'T08:15:00Z').toISOString(), date: getRelativeDateString(5), type: 'food', value: 520, notes: 'Breakfast: Avocado Toast & Eggs' },
  { id: 'f12', timestamp: new Date(getRelativeDateString(5) + 'T12:45:00Z').toISOString(), date: getRelativeDateString(5), type: 'food', value: 610, notes: 'Lunch: Turkey Wrap & Hummus' },
  { id: 'f13', timestamp: new Date(getRelativeDateString(5) + 'T20:00:00Z').toISOString(), date: getRelativeDateString(5), type: 'food', value: 810, notes: 'Dinner: Beef Stir-fry with Brown Rice' },

  // 4 Days Ago
  { id: '21', timestamp: new Date(getRelativeDateString(4) + 'T08:00:00Z').toISOString(), date: getRelativeDateString(4), type: 'steps', value: 11500, notes: 'Hit goal early' },
  { id: '22', timestamp: new Date(getRelativeDateString(4) + 'T12:00:00Z').toISOString(), date: getRelativeDateString(4), type: 'water', value: 2750, notes: 'Feeling hydrated!' },
  { id: '23', timestamp: new Date(getRelativeDateString(4) + 'T18:30:00Z').toISOString(), date: getRelativeDateString(4), type: 'calories', value: 650, notes: 'Evening basketball' },
  { id: '24', timestamp: new Date(getRelativeDateString(4) + 'T06:30:00Z').toISOString(), date: getRelativeDateString(4), type: 'sleep', value: 8.2 },
  { id: '25', timestamp: new Date(getRelativeDateString(4) + 'T21:00:00Z').toISOString(), date: getRelativeDateString(4), type: 'mood', value: 5, notes: 'Excellent energy!' },
  { id: '26', timestamp: new Date(getRelativeDateString(4) + 'T09:00:00Z').toISOString(), date: getRelativeDateString(4), type: 'weight', value: 73.5 },

  // 3 Days Ago
  { id: '31', timestamp: new Date(getRelativeDateString(3) + 'T08:00:00Z').toISOString(), date: getRelativeDateString(3), type: 'steps', value: 6000 },
  { id: '32', timestamp: new Date(getRelativeDateString(3) + 'T12:00:00Z').toISOString(), date: getRelativeDateString(3), type: 'water', value: 1250 },
  { id: '33', timestamp: new Date(getRelativeDateString(3) + 'T18:30:00Z').toISOString(), date: getRelativeDateString(3), type: 'calories', value: 210, notes: 'Stretch session' },
  { id: '34', timestamp: new Date(getRelativeDateString(3) + 'T07:30:00Z').toISOString(), date: getRelativeDateString(3), type: 'sleep', value: 6.5 },
  { id: '35', timestamp: new Date(getRelativeDateString(3) + 'T21:00:00Z').toISOString(), date: getRelativeDateString(3), type: 'mood', value: 2, notes: 'Rest day, felt sluggish' },
  { id: '36', timestamp: new Date(getRelativeDateString(3) + 'T09:00:00Z').toISOString(), date: getRelativeDateString(3), type: 'weight', value: 73.8 },

  // 2 Days Ago
  { id: '41', timestamp: new Date(getRelativeDateString(2) + 'T08:00:00Z').toISOString(), date: getRelativeDateString(2), type: 'steps', value: 10400 },
  { id: '42', timestamp: new Date(getRelativeDateString(2) + 'T12:00:00Z').toISOString(), date: getRelativeDateString(2), type: 'water', value: 2600 },
  { id: '43', timestamp: new Date(getRelativeDateString(2) + 'T18:30:00Z').toISOString(), date: getRelativeDateString(2), type: 'calories', value: 510 },
  { id: '44', timestamp: new Date(getRelativeDateString(2) + 'T06:45:00Z').toISOString(), date: getRelativeDateString(2), type: 'sleep', value: 8.0, notes: 'Very deep sleep' },
  { id: '45', timestamp: new Date(getRelativeDateString(2) + 'T21:00:00Z').toISOString(), date: getRelativeDateString(2), type: 'mood', value: 4 },
  { id: '46', timestamp: new Date(getRelativeDateString(2) + 'T09:00:00Z').toISOString(), date: getRelativeDateString(2), type: 'weight', value: 73.4 },

  // 1 Day Ago
  { id: '51', timestamp: new Date(getRelativeDateString(1) + 'T08:00:00Z').toISOString(), date: getRelativeDateString(1), type: 'steps', value: 8800 },
  { id: '52', timestamp: new Date(getRelativeDateString(1) + 'T12:00:00Z').toISOString(), date: getRelativeDateString(1), type: 'water', value: 2200 },
  { id: '53', timestamp: new Date(getRelativeDateString(1) + 'T18:30:00Z').toISOString(), date: getRelativeDateString(1), type: 'calories', value: 390 },
  { id: '54', timestamp: new Date(getRelativeDateString(1) + 'T07:15:00Z').toISOString(), date: getRelativeDateString(1), type: 'sleep', value: 7.2 },
  { id: '55', timestamp: new Date(getRelativeDateString(1) + 'T21:00:00Z').toISOString(), date: getRelativeDateString(1), type: 'mood', value: 4 },
  { id: '56', timestamp: new Date(getRelativeDateString(1) + 'T09:00:00Z').toISOString(), date: getRelativeDateString(1), type: 'weight', value: 73.1 },

  // Today (Partial Logs)
  { id: '61', timestamp: new Date(getRelativeDateString(0) + 'T08:30:00Z').toISOString(), date: getRelativeDateString(0), type: 'steps', value: 4200, notes: 'Morning commute' },
  { id: '62', timestamp: new Date(getRelativeDateString(0) + 'T10:15:00Z').toISOString(), date: getRelativeDateString(0), type: 'water', value: 800 },
  { id: '64', timestamp: new Date(getRelativeDateString(0) + 'T06:30:00Z').toISOString(), date: getRelativeDateString(0), type: 'sleep', value: 7.8, notes: 'Bedtime: 11:30 PM, Wake: 7:18 AM' },
  { id: '65', timestamp: new Date(getRelativeDateString(0) + 'T11:00:00Z').toISOString(), date: getRelativeDateString(0), type: 'mood', value: 4 },
  { id: '66', timestamp: new Date(getRelativeDateString(0) + 'T07:30:00Z').toISOString(), date: getRelativeDateString(0), type: 'weight', value: 72.8 },
  { id: 'f61', timestamp: new Date(getRelativeDateString(0) + 'T08:45:00Z').toISOString(), date: getRelativeDateString(0), type: 'food', value: 480, notes: 'Eggs, Spinach & Black Coffee' },
  { id: 'f62', timestamp: new Date(getRelativeDateString(0) + 'T12:30:00Z').toISOString(), date: getRelativeDateString(0), type: 'food', value: 580, notes: 'Tofu & Noodle Salad bowl' }
];

export function getStatsForDay(logs: MetricLog[], dateStr: string) {
  const dayLogs = logs.filter(l => l.date === dateStr);
  
  const steps = dayLogs.filter(l => l.type === 'steps').reduce((sum, l) => sum + l.value, 0);
  const water = dayLogs.filter(l => l.type === 'water').reduce((sum, l) => sum + l.value, 0);
  const calories = dayLogs.filter(l => l.type === 'calories').reduce((sum, l) => sum + l.value, 0);
  const sleepLog = dayLogs.filter(l => l.type === 'sleep').sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0];
  const sleep = sleepLog ? sleepLog.value : 0;
  
  const moodLog = dayLogs.filter(l => l.type === 'mood').sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0];
  const mood = moodLog ? moodLog.value : 0;

  const weightLog = dayLogs.filter(l => l.type === 'weight').sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0];
  const weight = weightLog ? weightLog.value : 0;

  const food = dayLogs.filter(l => l.type === 'food').reduce((sum, l) => sum + l.value, 0);

  return { steps, water, calories, sleep, mood, weight, food };
}

export function formatDatePretty(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export const MOOD_DETAILS: Record<number, { emoji: string; label: string; bg: string; text: string }> = {
  1: { emoji: '😩', label: 'Stressed', bg: 'bg-red-50', text: 'text-red-600' },
  2: { emoji: '🙁', label: 'Tired', bg: 'bg-orange-50', text: 'text-orange-600' },
  3: { emoji: '😐', label: 'Okay', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  4: { emoji: '🙂', label: 'Good', bg: 'bg-green-50', text: 'text-green-600' },
  5: { emoji: '😆', label: 'Excellent', bg: 'bg-emerald-50', text: 'text-emerald-500' },
};
