import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  FoodCategory,
  FoodEntry,
  FoodLibraryItem,
  MealType,
} from '../types/macros';
import {
  MEAL_LABELS,
  MEAL_ORDER,
  calcCaloriesFromMacros,
  round1,
} from '../utils/macroMath';

interface LogFoodModalProps {
  isOpen: boolean;
  defaultMeal: MealType;
  editingEntry: FoodEntry | null;
  foodCatalog: FoodLibraryItem[];
  onClose: () => void;
  onSaveEntry: (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  onUpdateEntry: (entryId: string, patch: Partial<FoodEntry>) => void;
  onSaveToLibrary: (food: Omit<FoodLibraryItem, 'id' | 'isCustom'>) => void;
}

export function LogFoodModal({
  isOpen,
  defaultMeal,
  editingEntry,
  foodCatalog,
  onClose,
  onSaveEntry,
  onUpdateEntry,
  onSaveToLibrary,
}: LogFoodModalProps) {
  const [mode, setMode] = useState<'manual' | 'library'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | FoodCategory>('all');

  const [name, setName] = useState('');
  const [meal, setMeal] = useState<MealType>(defaultMeal);
  const [servingLabel, setServingLabel] = useState('1 serving');
  const [servings, setServings] = useState('1');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');
  const [overrideCalories, setOverrideCalories] = useState(false);
  const [customCalories, setCustomCalories] = useState('0');
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (editingEntry) {
      setMode('manual');
      setName(editingEntry.name);
      setMeal(editingEntry.meal);
      setServingLabel(editingEntry.servingLabel);
      setServings(String(editingEntry.servings));
      setProtein(String(editingEntry.baseMacros.protein));
      setCarbs(String(editingEntry.baseMacros.carbs));
      setFat(String(editingEntry.baseMacros.fat));
      if (typeof editingEntry.customCaloriesPerServing === 'number') {
        setOverrideCalories(true);
        setCustomCalories(String(editingEntry.customCaloriesPerServing));
      } else {
        setOverrideCalories(false);
        setCustomCalories(
          String(
            calcCaloriesFromMacros(
              editingEntry.baseMacros.protein,
              editingEntry.baseMacros.carbs,
              editingEntry.baseMacros.fat,
            ),
          ),
        );
      }
      setSaveToLibrary(false);
    } else {
      setMode('library');
      setSearchQuery('');
      setCategoryFilter('all');
      setName('');
      setMeal(defaultMeal);
      setServingLabel('1 serving');
      setServings('1');
      setProtein('0');
      setCarbs('0');
      setFat('0');
      setOverrideCalories(false);
      setCustomCalories('0');
      setSaveToLibrary(false);
    }
  }, [isOpen, editingEntry, defaultMeal]);

  const parsedServings = Math.max(0.1, Number(servings) || 1);
  const parsedP = Math.max(0, Number(protein) || 0);
  const parsedC = Math.max(0, Number(carbs) || 0);
  const parsedF = Math.max(0, Number(fat) || 0);

  const computedPerServingKcal = calcCaloriesFromMacros(parsedP, parsedC, parsedF);
  const effectivePerServingKcal = overrideCalories
    ? Math.max(0, Number(customCalories) || 0)
    : computedPerServingKcal;

  const totalPreview = {
    calories: Math.round(effectivePerServingKcal * parsedServings),
    protein: round1(parsedP * parsedServings),
    carbs: round1(parsedC * parsedServings),
    fat: round1(parsedF * parsedServings),
  };

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return foodCatalog.filter((item) => {
      const matchesCat =
        categoryFilter === 'all' || item.category === categoryFilter;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.defaultServingLabel.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [foodCatalog, searchQuery, categoryFilter]);

  if (!isOpen) return null;

  const handleSelectLibraryItem = (item: FoodLibraryItem) => {
    setName(item.name);
    setServingLabel(item.defaultServingLabel);
    setServings('1');
    setProtein(String(item.macrosPerServing.protein));
    setCarbs(String(item.macrosPerServing.carbs));
    setFat(String(item.macrosPerServing.fat));
    setOverrideCalories(false);
    setCustomCalories(
      String(
        calcCaloriesFromMacros(
          item.macrosPerServing.protein,
          item.macrosPerServing.carbs,
          item.macrosPerServing.fat,
        ),
      ),
    );
    setMode('manual');
  };

  const handleQuickAddFromLibrary = (item: FoodLibraryItem) => {
    onSaveEntry({
      name: item.name,
      meal,
      servingLabel: item.defaultServingLabel,
      servings: 1,
      baseMacros: item.macrosPerServing,
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter a food or meal name.');
      return;
    }
    if (parsedServings <= 0) {
      setErrorMsg('Servings must be greater than zero.');
      return;
    }

    const baseMacros = {
      protein: round1(parsedP),
      carbs: round1(parsedC),
      fat: round1(parsedF),
    };

    const payload: Omit<FoodEntry, 'id' | 'createdAt'> = {
      name: trimmedName,
      meal,
      servingLabel: servingLabel.trim() || '1 serving',
      servings: round1(parsedServings),
      baseMacros,
      ...(overrideCalories
        ? { customCaloriesPerServing: Math.round(effectivePerServingKcal) }
        : {}),
    };

    if (editingEntry) {
      onUpdateEntry(editingEntry.id, payload);
    } else {
      onSaveEntry(payload);
      if (saveToLibrary) {
        const dominant =
          parsedP * 4 >= parsedC * 4 && parsedP * 4 >= parsedF * 9
            ? 'protein'
            : parsedC * 4 >= parsedF * 9
              ? 'carbs'
              : 'fats';
        onSaveToLibrary({
          name: trimmedName,
          category: dominant,
          defaultServingLabel: payload.servingLabel,
          macrosPerServing: baseMacros,
        });
      }
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-food-modal-title"
    >
      <div className="bg-[#131924] border border-[#283346] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242D3D] bg-[#10151F]">
          <h2
            id="log-food-modal-title"
            className="text-lg font-semibold text-white"
          >
            {editingEntry ? 'Edit Food Entry' : 'Log Food Entry'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1C2536] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!editingEntry && (
          <div className="px-6 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2636]">
            <div className="flex items-center gap-1 p-1 bg-[#0E131C] border border-[#242D3D] rounded-lg">
              <button
                type="button"
                onClick={() => setMode('library')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'library'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                From Food Library
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Manual Macro Entry
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="modal-meal-select"
                className="text-xs font-medium text-slate-400"
              >
                Meal
              </label>
              <select
                id="modal-meal-select"
                value={meal}
                onChange={(e) => setMeal(e.target.value as MealType)}
                className="px-3 py-1.5 text-xs font-medium bg-[#0E131C] border border-[#283346] rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {MEAL_ORDER.map((m) => (
                  <option key={m} value={m}>
                    {MEAL_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {mode === 'library' && !editingEntry ? (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chicken, rice, oats, avocado..."
                  className="w-full pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-1 p-1 bg-[#0E131C] border border-[#242D3D] rounded-lg overflow-x-auto">
                {(
                  [
                    ['all', 'All'],
                    ['protein', 'Protein'],
                    ['carbs', 'Carbs'],
                    ['fats', 'Fats'],
                    ['balanced', 'Meals'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCategoryFilter(val)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      categoryFilter === val
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-[#242D3D] rounded-lg divide-y divide-[#1E2636] max-h-[48vh] overflow-y-auto bg-[#0E131C]">
              {filteredCatalog.length === 0 ? (
                <div className="p-6 text-center space-y-3">
                  <p className="text-sm text-slate-400">
                    No matching foods found in the library.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setName(searchQuery);
                      setMode('manual');
                    }}
                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    Create Manual Entry Instead
                  </button>
                </div>
              ) : (
                filteredCatalog.map((item) => {
                  const kcal = calcCaloriesFromMacros(
                    item.macrosPerServing.protein,
                    item.macrosPerServing.carbs,
                    item.macrosPerServing.fat,
                  );
                  return (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#17202F] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-100 truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono tabular-nums flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-sans">{item.defaultServingLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-sky-400">P {item.macrosPerServing.protein}g</span>
                          <span className="text-amber-400">C {item.macrosPerServing.carbs}g</span>
                          <span className="text-rose-400">F {item.macrosPerServing.fat}g</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-200 font-medium">{kcal} kcal</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectLibraryItem(item)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#18202E] border border-[#2C374B] rounded-lg hover:bg-[#222D40] transition-colors whitespace-nowrap shrink-0"
                        >
                          Adjust Portion
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAddFromLibrary(item)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
                        >
                          Add 1x
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="px-3.5 py-2.5 text-xs font-medium text-red-300 bg-red-500/15 border border-red-500/30 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="food-name-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Food or Meal Name
                </label>
                <input
                  id="food-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Grilled Chicken Breast"
                  className="w-full px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="food-meal-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Meal Slot
                </label>
                <select
                  id="food-meal-input"
                  value={meal}
                  onChange={(e) => setMeal(e.target.value as MealType)}
                  className="w-full px-3 py-2 text-sm text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {MEAL_ORDER.map((m) => (
                    <option key={m} value={m}>
                      {MEAL_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="serving-label-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Base Serving Unit
                </label>
                <input
                  id="serving-label-input"
                  type="text"
                  value={servingLabel}
                  onChange={(e) => setServingLabel(e.target.value)}
                  placeholder="e.g., 100 g, 1 scoop, 1 bowl"
                  className="w-full px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="servings-qty-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Number of Servings
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="servings-qty-input"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  {[0.5, 1, 1.5, 2].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setServings(String(mult))}
                      className={`px-2.5 py-2 text-xs font-mono tabular-nums rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                        Number(servings) === mult
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-[#0E131C] text-slate-300 border-[#283346] hover:bg-[#1A2333]'
                      }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300">
                  Macronutrients per 1 Serving (grams)
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  Formula: 4P + 4C + 9F = {computedPerServingKcal} kcal/serving
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="protein-g-input"
                    className="block text-xs text-sky-400 font-medium mb-1"
                  >
                    Protein (g)
                  </label>
                  <input
                    id="protein-g-input"
                    type="number"
                    step="0.1"
                    min="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label
                    htmlFor="carbs-g-input"
                    className="block text-xs text-amber-400 font-medium mb-1"
                  >
                    Carbs (g)
                  </label>
                  <input
                    id="carbs-g-input"
                    type="number"
                    step="0.1"
                    min="0"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label
                    htmlFor="fat-g-input"
                    className="block text-xs text-rose-400 font-medium mb-1"
                  >
                    Fats (g)
                  </label>
                  <input
                    id="fat-g-input"
                    type="number"
                    step="0.1"
                    min="0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideCalories}
                  onChange={(e) => {
                    setOverrideCalories(e.target.checked);
                    if (e.target.checked) {
                      setCustomCalories(String(computedPerServingKcal));
                    }
                  }}
                  className="rounded border-[#283346] bg-[#0E131C] text-blue-600 focus:ring-blue-500"
                />
                Override label calories per serving
              </label>

              {overrideCalories && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    aria-label="Custom calories per serving"
                    className="w-28 px-3 py-1.5 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400">kcal / serving</span>
                </div>
              )}
            </div>

            {!editingEntry && (
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToLibrary}
                  onChange={(e) => setSaveToLibrary(e.target.checked)}
                  className="rounded border-[#283346] bg-[#0E131C] text-blue-600 focus:ring-blue-500"
                />
                Save this food to My Foods library for quick reuse
              </label>
            )}

            <div className="border-t border-[#242D3D] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-mono tabular-nums">
                <span className="font-sans font-medium text-white mr-2">
                  Entry Total ({parsedServings}x):
                </span>
                <span className="text-sky-400">P {totalPreview.protein}g</span>
                {' · '}
                <span className="text-amber-400">C {totalPreview.carbs}g</span>
                {' · '}
                <span className="text-rose-400">F {totalPreview.fat}g</span>
                {' · '}
                <span className="font-semibold text-white">
                  {totalPreview.calories} kcal
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-200 bg-[#18202E] border border-[#2C374B] rounded-lg hover:bg-[#202A3C] transition-colors whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
                >
                  {editingEntry ? 'Save Changes' : 'Add to Log'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
