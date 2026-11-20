import {
  CalculatorProfile,
  DayLogsMap,
  FoodEntry,
  FoodLibraryItem,
  MacroTargets,
} from '../types/macros';
import { shiftISODate, toISODateLocal } from '../utils/macroMath';

export const DEFAULT_CALCULATOR_PROFILE: CalculatorProfile = {
  sex: 'male',
  age: 29,
  heightCm: 178,
  weightKg: 76,
  activityLevel: 'moderate',
  goal: 'maintain',
  splitPreset: 'high_protein',
  customSplit: { proteinPct: 35, carbsPct: 40, fatPct: 25 },
};

export const DEFAULT_MACRO_TARGETS: MacroTargets = {
  calories: 2450,
  protein: 185,
  carbs: 245,
  fat: 80,
};

export const CURATED_FOOD_CATALOG: FoodLibraryItem[] = [
  // Protein
  {
    id: 'food-chicken-breast',
    name: 'Grilled Chicken Breast',
    category: 'protein',
    defaultServingLabel: '100 g',
    macrosPerServing: { protein: 31, carbs: 0, fat: 3.6 },
  },
  {
    id: 'food-greek-yogurt',
    name: 'Greek Yogurt (0% Fat)',
    category: 'protein',
    defaultServingLabel: '170 g (1 cup)',
    macrosPerServing: { protein: 17, carbs: 6, fat: 0.7 },
  },
  {
    id: 'food-salmon',
    name: 'Atlantic Salmon Fillet',
    category: 'protein',
    defaultServingLabel: '100 g',
    macrosPerServing: { protein: 22, carbs: 0, fat: 13 },
  },
  {
    id: 'food-egg-whole',
    name: 'Whole Large Egg',
    category: 'protein',
    defaultServingLabel: '1 egg (50 g)',
    macrosPerServing: { protein: 6.3, carbs: 0.4, fat: 5 },
  },
  {
    id: 'food-egg-whites',
    name: 'Liquid Egg Whites',
    category: 'protein',
    defaultServingLabel: '100 g',
    macrosPerServing: { protein: 11, carbs: 0.7, fat: 0.2 },
  },
  {
    id: 'food-whey-isolate',
    name: 'Whey Protein Isolate',
    category: 'protein',
    defaultServingLabel: '1 scoop (30 g)',
    macrosPerServing: { protein: 25, carbs: 1, fat: 0.5 },
  },
  {
    id: 'food-tofu-firm',
    name: 'Extra-Firm Tofu',
    category: 'protein',
    defaultServingLabel: '100 g',
    macrosPerServing: { protein: 10, carbs: 2, fat: 5.5 },
  },
  {
    id: 'food-cottage-cheese',
    name: 'Low-Fat Cottage Cheese (2%)',
    category: 'protein',
    defaultServingLabel: '113 g (1/2 cup)',
    macrosPerServing: { protein: 13, carbs: 4.5, fat: 2.5 },
  },
  {
    id: 'food-lean-beef',
    name: '93% Lean Ground Beef',
    category: 'protein',
    defaultServingLabel: '100 g cooked',
    macrosPerServing: { protein: 26, carbs: 0, fat: 8.5 },
  },
  {
    id: 'food-tuna-canned',
    name: 'Yellowfin Tuna (in Water)',
    category: 'protein',
    defaultServingLabel: '1 can (120 g)',
    macrosPerServing: { protein: 28, carbs: 0, fat: 1 },
  },

  // Carbohydrates
  {
    id: 'food-rolled-oats',
    name: 'Rolled Oats (Dry)',
    category: 'carbs',
    defaultServingLabel: '50 g (1/2 cup)',
    macrosPerServing: { protein: 6.5, carbs: 34, fat: 3.5 },
  },
  {
    id: 'food-jasmine-rice',
    name: 'Cooked White Rice',
    category: 'carbs',
    defaultServingLabel: '150 g (1 cup)',
    macrosPerServing: { protein: 4, carbs: 42, fat: 0.4 },
  },
  {
    id: 'food-sweet-potato',
    name: 'Baked Sweet Potato',
    category: 'carbs',
    defaultServingLabel: '150 g',
    macrosPerServing: { protein: 3, carbs: 31, fat: 0.2 },
  },
  {
    id: 'food-sourdough',
    name: 'Sourdough Bread',
    category: 'carbs',
    defaultServingLabel: '1 slice (50 g)',
    macrosPerServing: { protein: 4.5, carbs: 24, fat: 0.8 },
  },
  {
    id: 'food-banana',
    name: 'Medium Banana',
    category: 'carbs',
    defaultServingLabel: '1 medium (118 g)',
    macrosPerServing: { protein: 1.3, carbs: 27, fat: 0.4 },
  },
  {
    id: 'food-blueberries',
    name: 'Fresh Blueberries',
    category: 'carbs',
    defaultServingLabel: '100 g',
    macrosPerServing: { protein: 0.7, carbs: 14.5, fat: 0.3 },
  },
  {
    id: 'food-quinoa',
    name: 'Cooked Quinoa',
    category: 'carbs',
    defaultServingLabel: '150 g (1 cup)',
    macrosPerServing: { protein: 6.6, carbs: 32, fat: 2.9 },
  },
  {
    id: 'food-pasta-cooked',
    name: 'Durum Wheat Pasta (Cooked)',
    category: 'carbs',
    defaultServingLabel: '140 g (1 cup)',
    macrosPerServing: { protein: 8.1, carbs: 43, fat: 1.3 },
  },
  {
    id: 'food-broccoli',
    name: 'Steamed Broccoli Florets',
    category: 'carbs',
    defaultServingLabel: '100 g',
    macrosPerServing: { protein: 2.8, carbs: 7.2, fat: 0.4 },
  },

  // Fats
  {
    id: 'food-avocado',
    name: 'Hass Avocado',
    category: 'fats',
    defaultServingLabel: '1/2 avocado (75 g)',
    macrosPerServing: { protein: 1.5, carbs: 6.4, fat: 11 },
  },
  {
    id: 'food-olive-oil',
    name: 'Extra Virgin Olive Oil',
    category: 'fats',
    defaultServingLabel: '1 tbsp (14 g)',
    macrosPerServing: { protein: 0, carbs: 0, fat: 14 },
  },
  {
    id: 'food-almonds',
    name: 'Raw Almonds',
    category: 'fats',
    defaultServingLabel: '28 g (23 nuts)',
    macrosPerServing: { protein: 6, carbs: 6, fat: 14 },
  },
  {
    id: 'food-peanut-butter',
    name: 'Natural Peanut Butter',
    category: 'fats',
    defaultServingLabel: '2 tbsp (32 g)',
    macrosPerServing: { protein: 8, carbs: 6, fat: 16 },
  },
  {
    id: 'food-chia-seeds',
    name: 'Chia Seeds',
    category: 'fats',
    defaultServingLabel: '15 g (1 tbsp)',
    macrosPerServing: { protein: 2.5, carbs: 6.3, fat: 4.6 },
  },
  {
    id: 'food-cheddar',
    name: 'Sharp Cheddar Cheese',
    category: 'fats',
    defaultServingLabel: '28 g (1 oz)',
    macrosPerServing: { protein: 7, carbs: 0.4, fat: 9.4 },
  },

  // Balanced Meals
  {
    id: 'food-protein-oat-bowl',
    name: 'Protein Oatmeal Bowl',
    category: 'balanced',
    defaultServingLabel: '1 bowl (320 g)',
    macrosPerServing: { protein: 32, carbs: 46, fat: 9 },
  },
  {
    id: 'food-chicken-rice-bowl',
    name: 'Chicken, Jasmine Rice & Greens',
    category: 'balanced',
    defaultServingLabel: '1 plate (420 g)',
    macrosPerServing: { protein: 46, carbs: 54, fat: 11 },
  },
  {
    id: 'food-salmon-sweet-potato',
    name: 'Salmon & Roasted Sweet Potato',
    category: 'balanced',
    defaultServingLabel: '1 plate (380 g)',
    macrosPerServing: { protein: 36, carbs: 38, fat: 19 },
  },
];

function makeEntry(
  idSuffix: string,
  name: string,
  meal: FoodEntry['meal'],
  servingLabel: string,
  servings: number,
  protein: number,
  carbs: number,
  fat: number,
): FoodEntry {
  return {
    id: `seed-${idSuffix}`,
    name,
    meal,
    servingLabel,
    servings,
    baseMacros: { protein, carbs, fat },
    createdAt: new Date().toISOString(),
  };
}

export function createInitialSeedLogs(): DayLogsMap {
  const today = toISODateLocal();
  const d1 = shiftISODate(today, -1);
  const d2 = shiftISODate(today, -2);
  const d3 = shiftISODate(today, -3);
  const d4 = shiftISODate(today, -4);
  const d5 = shiftISODate(today, -5);
  const d6 = shiftISODate(today, -6);

  return {
    [today]: [
      makeEntry('t-1', 'Rolled Oats (Dry)', 'breakfast', '50 g (1/2 cup)', 1.5, 6.5, 34, 3.5),
      makeEntry('t-2', 'Whey Protein Isolate', 'breakfast', '1 scoop (30 g)', 1, 25, 1, 0.5),
      makeEntry('t-3', 'Fresh Blueberries', 'breakfast', '100 g', 1, 0.7, 14.5, 0.3),
      makeEntry('t-4', 'Grilled Chicken Breast', 'lunch', '100 g', 1.8, 31, 0, 3.6),
      makeEntry('t-5', 'Cooked White Rice', 'lunch', '150 g (1 cup)', 1.5, 4, 42, 0.4),
      makeEntry('t-6', 'Hass Avocado', 'lunch', '1/2 avocado (75 g)', 1, 1.5, 6.4, 11),
      makeEntry('t-7', 'Greek Yogurt (0% Fat)', 'snacks', '170 g (1 cup)', 1, 17, 6, 0.7),
      makeEntry('t-8', 'Raw Almonds', 'snacks', '28 g (23 nuts)', 1, 6, 6, 14),
    ],
    [d1]: [
      makeEntry('d1-1', 'Whole Large Egg', 'breakfast', '1 egg (50 g)', 3, 6.3, 0.4, 5),
      makeEntry('d1-2', 'Sourdough Bread', 'breakfast', '1 slice (50 g)', 2, 4.5, 24, 0.8),
      makeEntry('d1-3', 'Chicken, Jasmine Rice & Greens', 'lunch', '1 plate (420 g)', 1, 46, 54, 11),
      makeEntry('d1-4', 'Atlantic Salmon Fillet', 'dinner', '100 g', 1.8, 22, 0, 13),
      makeEntry('d1-5', 'Baked Sweet Potato', 'dinner', '150 g', 1.5, 3, 31, 0.2),
      makeEntry('d1-6', 'Extra Virgin Olive Oil', 'dinner', '1 tbsp (14 g)', 1, 0, 0, 14),
      makeEntry('d1-7', 'Whey Protein Isolate', 'snacks', '1 scoop (30 g)', 1, 25, 1, 0.5),
      makeEntry('d1-8', 'Medium Banana', 'snacks', '1 medium (118 g)', 1, 1.3, 27, 0.4),
    ],
    [d2]: [
      makeEntry('d2-1', 'Protein Oatmeal Bowl', 'breakfast', '1 bowl (320 g)', 1, 32, 46, 9),
      makeEntry('d2-2', '93% Lean Ground Beef', 'lunch', '100 g cooked', 1.6, 26, 0, 8.5),
      makeEntry('d2-3', 'Cooked Quinoa', 'lunch', '150 g (1 cup)', 1.5, 6.6, 32, 2.9),
      makeEntry('d2-4', 'Salmon & Roasted Sweet Potato', 'dinner', '1 plate (380 g)', 1, 36, 38, 19),
      makeEntry('d2-5', 'Low-Fat Cottage Cheese (2%)', 'snacks', '113 g (1/2 cup)', 1.5, 13, 4.5, 2.5),
      makeEntry('d2-6', 'Natural Peanut Butter', 'snacks', '2 tbsp (32 g)', 1, 8, 6, 16),
    ],
    [d3]: [
      makeEntry('d3-1', 'Liquid Egg Whites', 'breakfast', '100 g', 2, 11, 0.7, 0.2),
      makeEntry('d3-2', 'Whole Large Egg', 'breakfast', '1 egg (50 g)', 2, 6.3, 0.4, 5),
      makeEntry('d3-3', 'Sourdough Bread', 'breakfast', '1 slice (50 g)', 2, 4.5, 24, 0.8),
      makeEntry('d3-4', 'Yellowfin Tuna (in Water)', 'lunch', '1 can (120 g)', 1.5, 28, 0, 1),
      makeEntry('d3-5', 'Durum Wheat Pasta (Cooked)', 'lunch', '140 g (1 cup)', 1.5, 8.1, 43, 1.3),
      makeEntry('d3-6', 'Extra Virgin Olive Oil', 'lunch', '1 tbsp (14 g)', 1, 0, 0, 14),
      makeEntry('d3-7', 'Grilled Chicken Breast', 'dinner', '100 g', 1.8, 31, 0, 3.6),
      makeEntry('d3-8', 'Cooked White Rice', 'dinner', '150 g (1 cup)', 1.5, 4, 42, 0.4),
      makeEntry('d3-9', 'Raw Almonds', 'snacks', '28 g (23 nuts)', 1.5, 6, 6, 14),
    ],
    [d4]: [
      makeEntry('d4-1', 'Greek Yogurt (0% Fat)', 'breakfast', '170 g (1 cup)', 1.5, 17, 6, 0.7),
      makeEntry('d4-2', 'Rolled Oats (Dry)', 'breakfast', '50 g (1/2 cup)', 1, 6.5, 34, 3.5),
      makeEntry('d4-3', 'Chicken, Jasmine Rice & Greens', 'lunch', '1 plate (420 g)', 1.2, 46, 54, 11),
      makeEntry('d4-4', 'Extra-Firm Tofu', 'dinner', '100 g', 2, 10, 2, 5.5),
      makeEntry('d4-5', 'Baked Sweet Potato', 'dinner', '150 g', 1.5, 3, 31, 0.2),
      makeEntry('d4-6', 'Hass Avocado', 'dinner', '1/2 avocado (75 g)', 1, 1.5, 6.4, 11),
      makeEntry('d4-7', 'Whey Protein Isolate', 'snacks', '1 scoop (30 g)', 1.5, 25, 1, 0.5),
    ],
    [d5]: [
      makeEntry('d5-1', 'Protein Oatmeal Bowl', 'breakfast', '1 bowl (320 g)', 1, 32, 46, 9),
      makeEntry('d5-2', 'Grilled Chicken Breast', 'lunch', '100 g', 2, 31, 0, 3.6),
      makeEntry('d5-3', 'Cooked Quinoa', 'lunch', '150 g (1 cup)', 1.5, 6.6, 32, 2.9),
      makeEntry('d5-4', 'Atlantic Salmon Fillet', 'dinner', '100 g', 1.8, 22, 0, 13),
      makeEntry('d5-5', 'Steamed Broccoli Florets', 'dinner', '100 g', 2, 2.8, 7.2, 0.4),
      makeEntry('d5-6', 'Cooked White Rice', 'dinner', '150 g (1 cup)', 1, 4, 42, 0.4),
      makeEntry('d5-7', 'Natural Peanut Butter', 'snacks', '2 tbsp (32 g)', 1, 8, 6, 16),
      makeEntry('d5-8', 'Medium Banana', 'snacks', '1 medium (118 g)', 1, 1.3, 27, 0.4),
    ],
    [d6]: [
      makeEntry('d6-1', 'Whole Large Egg', 'breakfast', '1 egg (50 g)', 3, 6.3, 0.4, 5),
      makeEntry('d6-2', 'Rolled Oats (Dry)', 'breakfast', '50 g (1/2 cup)', 1.2, 6.5, 34, 3.5),
      makeEntry('d6-3', '93% Lean Ground Beef', 'lunch', '100 g cooked', 1.8, 26, 0, 8.5),
      makeEntry('d6-4', 'Cooked White Rice', 'lunch', '150 g (1 cup)', 1.5, 4, 42, 0.4),
      makeEntry('d6-5', 'Chicken, Jasmine Rice & Greens', 'dinner', '1 plate (420 g)', 1, 46, 54, 11),
      makeEntry('d6-6', 'Greek Yogurt (0% Fat)', 'snacks', '170 g (1 cup)', 1, 17, 6, 0.7),
      makeEntry('d6-7', 'Fresh Blueberries', 'snacks', '100 g', 1, 0.7, 14.5, 0.3),
    ],
  };
}
