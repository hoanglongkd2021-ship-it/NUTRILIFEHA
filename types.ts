export enum MealType {
  BREAKFAST = 'Bữa sáng',
  LUNCH = 'Bữa trưa',
  DINNER = 'Bữa tối',
  SNACK1 = 'Ăn nhẹ 1',
  SNACK2 = 'Ăn nhẹ 2',
  SNACK3 = 'Ăn nhẹ 3',
  SNACK4 = 'Ăn nhẹ 4'
}

export interface UserProfile {
  name: string;
  height: number; // cm
  weight: number; // kg
  targetCalories: number;
  macroRatios: {
    protein: number; // percentage (0-100)
    carbs: number;   // percentage (0-100)
    fat: number;     // percentage (0-100)
  };
  setupComplete: boolean;
}

export interface PresetFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLog {
  id: string;
  type: MealType;
  timestamp: number;
  completed: boolean;
  imageUrl?: string;
  analysis?: FoodAnalysis;
  manualNotes?: string;
}

export interface FoodAnalysis {
  foodName: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  confidence: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: MealLog[];
  totalCalories: number;
  weight?: number;
}

export interface WeightHistory {
  id?: string;
  date: string;
  timestamp?: number;
  weight: number;
}

export type MealSchedule = {
  [key in MealType]: {
    time: string; // HH:mm format
    enabled: boolean;
  };
};

export type Language = 'vi' | 'en';