import {
  ActivityLevel,
  CalculatorProfile,
  FoodEntry,
  GoalMode,
  MacroSplit,
  MacroTargets,
  MacroValues,
  MealType,
  SplitPreset,
} from '../types/macros';

export const KCAL_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export const ACTIVITY_MULTIPLIERS: Record<
  ActivityLevel,
  { factor: number; label: string; detail: string }
> = {
  sedentary: {
    factor: 1.2,
    label: 'Sedentary',
    detail: 'Desk job, little or no structured exercise',
  },
  light: {
    factor: 1.375,
    label: 'Lightly Active',
    detail: '1–3 light workouts or walks per week',
  },
  moderate: {
    factor: 1.55,
    label: 'Moderately Active',
    detail: '3–5 moderate training sessions per week',
  },
  active: {
    factor: 1.725,
    label: 'Very Active',
    detail: '6–7 intense workouts or physical labor',
  },
  athlete: {
    factor: 1.9,
    label: 'Athlete',
    detail: 'Twice-daily training or high-volume endurance',
  },
};

export const GOAL_ADJUSTMENTS: Record<
  GoalMode,
  { deltaKcal: number; label: string; detail: string }
> = {
  fat_loss: {
    deltaKcal: -500,
    label: 'Fat Loss (-500 kcal)',
    detail: 'Steady ~0.45 kg / 1 lb per week deficit',
  },
  mild_cut: {
    deltaKcal: -250,
    label: 'Mild Cut (-250 kcal)',
    detail: 'Gentle recomposition deficit',
  },
  maintain: {
    deltaKcal: 0,
    label: 'Maintenance (0 kcal)',
    detail: 'Maintain current body weight & performance',
  },
  lean_gain: {
    deltaKcal: 250,
    label: 'Lean Bulk (+250 kcal)',
    detail: 'Controlled surplus for lean tissue gain',
  },
  muscle_gain: {
    deltaKcal: 450,
    label: 'Muscle Gain (+450 kcal)',
    detail: 'Higher surplus for strength & hypertrophy',
  },
};

export const SPLIT_PRESETS: Record<
  Exclude<SplitPreset, 'custom'>,
  { label: string; split: MacroSplit; detail: string }
> = {
  balanced: {
    label: 'Balanced (30/40/30)',
    split: { proteinPct: 30, carbsPct: 40, fatPct: 30 },
    detail: 'Sustainable everyday macro distribution',
  },
  high_protein: {
    label: 'High Protein (40/35/25)',
    split: { proteinPct: 40, carbsPct: 35, fatPct: 25 },
    detail: 'Supports satiety and lean mass retention',
  },
  low_carb: {
    label: 'Low Carb (35/20/45)',
    split: { proteinPct: 35, carbsPct: 20, fatPct: 45 },
    detail: 'Reduced glycemic load with higher dietary fats',
  },
  endurance: {
    label: 'Endurance (25/55/20)',
    split: { proteinPct: 25, carbsPct: 55, fatPct: 20 },
    detail: 'Glycogen-prioritized split for high volume',
  },
};

export function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

export function calcCaloriesFromMacros(
  protein: number,
  carbs: number,
  fat: number,
): number {
  return Math.round(
    protein * KCAL_PER_GRAM.protein +
      carbs * KCAL_PER_GRAM.carbs +
      fat * KCAL_PER_GRAM.fat,
  );
}

export function calcEntryMacros(entry: FoodEntry): MacroValues {
  return {
    protein: round1(entry.baseMacros.protein * entry.servings),
    carbs: round1(entry.baseMacros.carbs * entry.servings),
    fat: round1(entry.baseMacros.fat * entry.servings),
  };
}

export function calcEntryCalories(entry: FoodEntry): number {
  if (
    typeof entry.customCaloriesPerServing === 'number' &&
    entry.customCaloriesPerServing >= 0
  ) {
    return Math.round(entry.customCaloriesPerServing * entry.servings);
  }
  const m = calcEntryMacros(entry);
  return calcCaloriesFromMacros(m.protein, m.carbs, m.fat);
}

export function sumEntries(entries: FoodEntry[]): MacroTargets {
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let calories = 0;

  for (const entry of entries) {
    const m = calcEntryMacros(entry);
    protein += m.protein;
    carbs += m.carbs;
    fat += m.fat;
    calories += calcEntryCalories(entry);
  }

  return {
    calories: Math.round(calories),
    protein: round1(protein),
    carbs: round1(carbs),
    fat: round1(fat),
  };
}

export function calcMacroCaloricShare(macros: MacroValues): MacroSplit {
  const pKcal = macros.protein * KCAL_PER_GRAM.protein;
  const cKcal = macros.carbs * KCAL_PER_GRAM.carbs;
  const fKcal = macros.fat * KCAL_PER_GRAM.fat;
  const total = pKcal + cKcal + fKcal;

  if (total <= 0) {
    return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
  }

  const proteinPct = Math.round((pKcal / total) * 100);
  const carbsPct = Math.round((cKcal / total) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  return { proteinPct, carbsPct, fatPct };
}

export function calcBMR(profile: CalculatorProfile): number {
  const base =
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.age +
    (profile.sex === 'male' ? 5 : -161);
  return Math.max(800, Math.round(base));
}

export function calcTDEE(
  bmr: number,
  activityLevel: ActivityLevel,
): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel].factor);
}

export function calcTargetCalories(tdee: number, goal: GoalMode): number {
  return Math.max(1200, Math.round(tdee + GOAL_ADJUSTMENTS[goal].deltaKcal));
}

export function calcTargetsFromProfile(
  profile: CalculatorProfile,
): { bmr: number; tdee: number; targets: MacroTargets; activeSplit: MacroSplit } {
  const bmr = calcBMR(profile);
  const tdee = calcTDEE(bmr, profile.activityLevel);
  const targetCalories = calcTargetCalories(tdee, profile.goal);

  const activeSplit =
    profile.splitPreset === 'custom'
      ? profile.customSplit
      : SPLIT_PRESETS[profile.splitPreset].split;

  const protein = Math.round(
    (targetCalories * (activeSplit.proteinPct / 100)) / KCAL_PER_GRAM.protein,
  );
  const carbs = Math.round(
    (targetCalories * (activeSplit.carbsPct / 100)) / KCAL_PER_GRAM.carbs,
  );
  const fat = Math.round(
    (targetCalories * (activeSplit.fatPct / 100)) / KCAL_PER_GRAM.fat,
  );

  return {
    bmr,
    tdee,
    activeSplit,
    targets: {
      calories: calcCaloriesFromMacros(protein, carbs, fat),
      protein,
      carbs,
      fat,
    },
  };
}

export function toISODateLocal(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODateLocal(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function shiftISODate(isoDate: string, deltaDays: number): string {
  const d = parseISODateLocal(isoDate);
  d.setDate(d.getDate() + deltaDays);
  return toISODateLocal(d);
}

export function formatDisplayDate(isoDate: string): string {
  const d = parseISODateLocal(isoDate);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortWeekday(isoDate: string): {
  weekday: string;
  dayNum: string;
} {
  const d = parseISODateLocal(isoDate);
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: String(d.getDate()),
  };
}

export function getLastNDates(endIsoDate: string, count: number): string[] {
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    dates.push(shiftISODate(endIsoDate, -i));
  }
  return dates;
}
