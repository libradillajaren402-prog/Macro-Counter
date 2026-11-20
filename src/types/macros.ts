export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export type FoodCategory = 'protein' | 'carbs' | 'fats' | 'balanced';

export interface MacroValues {
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  meal: MealType;
  servingLabel: string;
  servings: number;
  baseMacros: MacroValues;
  customCaloriesPerServing?: number;
  createdAt: string;
}

export interface FoodLibraryItem {
  id: string;
  name: string;
  category: FoodCategory;
  defaultServingLabel: string;
  macrosPerServing: MacroValues;
  isCustom?: boolean;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'athlete';

export type GoalMode =
  | 'fat_loss'
  | 'mild_cut'
  | 'maintain'
  | 'lean_gain'
  | 'muscle_gain';

export type SplitPreset =
  | 'balanced'
  | 'high_protein'
  | 'low_carb'
  | 'endurance'
  | 'custom';

export interface MacroSplit {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export interface CalculatorProfile {
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: GoalMode;
  splitPreset: SplitPreset;
  customSplit: MacroSplit;
}

export type DayLogsMap = Record<string, FoodEntry[]>;

export type ActiveView = 'log' | 'calculator' | 'library' | 'trends';
