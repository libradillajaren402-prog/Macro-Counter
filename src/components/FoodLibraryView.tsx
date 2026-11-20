import { useMemo, useState } from 'react';
import { Check, Plus, Search, Trash2 } from 'lucide-react';
import { FoodCategory, FoodLibraryItem, MealType } from '../types/macros';
import {
  MEAL_LABELS,
  MEAL_ORDER,
  calcCaloriesFromMacros,
  formatDisplayDate,
  round1,
} from '../utils/macroMath';

interface FoodLibraryViewProps {
  foods: FoodLibraryItem[];
  selectedDate: string;
  onAddEntryToDay: (
    item: FoodLibraryItem,
    meal: MealType,
    servings: number,
  ) => void;
  onAddCustomFood: (food: Omit<FoodLibraryItem, 'id' | 'isCustom'>) => void;
  onRemoveCustomFood: (foodId: string) => void;
}

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  protein: 'Protein',
  carbs: 'Carbohydrates',
  fats: 'Fats',
  balanced: 'Balanced Meals',
};

export function FoodLibraryView({
  foods,
  selectedDate,
  onAddEntryToDay,
  onAddCustomFood,
  onRemoveCustomFood,
}: FoodLibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'custom' | FoodCategory>('all');
  const [targetMeal, setTargetMeal] = useState<MealType>('lunch');
  const [addedFeedback, setAddedFeedback] = useState('');

  // Custom food creation form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<FoodCategory>('protein');
  const [newServing, setNewServing] = useState('100 g');
  const [newP, setNewP] = useState('20');
  const [newC, setNewC] = useState('0');
  const [newF, setNewF] = useState('5');

  const filteredFoods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return foods.filter((item) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'custom'
            ? Boolean(item.isCustom)
            : item.category === filter;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.defaultServingLabel.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [foods, searchQuery, filter]);

  const handleQuickAdd = (item: FoodLibraryItem) => {
    onAddEntryToDay(item, targetMeal, 1);
    setAddedFeedback(
      `Added ${item.name} to ${MEAL_LABELS[targetMeal]} (${formatDisplayDate(selectedDate)}).`,
    );
    setTimeout(() => setAddedFeedback(''), 3000);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    onAddCustomFood({
      name: trimmed,
      category: newCategory,
      defaultServingLabel: newServing.trim() || '1 serving',
      macrosPerServing: {
        protein: round1(Math.max(0, Number(newP) || 0)),
        carbs: round1(Math.max(0, Number(newC) || 0)),
        fat: round1(Math.max(0, Number(newF) || 0)),
      },
    });

    setNewName('');
    setNewServing('100 g');
    setNewP('20');
    setNewC('0');
    setNewF('5');
    setShowCreateForm(false);
    setFilter('custom');
  };

  return (
    <div className="space-y-6">
      {addedFeedback && (
        <div
          role="status"
          className="bg-blue-600/15 border border-blue-500/35 text-blue-200 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{addedFeedback}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#131924] border border-[#242D3D] rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Whole Foods &amp; Saved Meals Library
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reference macro values per serving · Add directly to{' '}
              {formatDisplayDate(selectedDate)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="library-meal-target"
                className="text-xs font-medium text-slate-400"
              >
                Add to meal
              </label>
              <select
                id="library-meal-target"
                value={targetMeal}
                onChange={(e) => setTargetMeal(e.target.value as MealType)}
                className="px-3 py-2 text-xs font-medium bg-[#0E131C] border border-[#283346] rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {MEAL_ORDER.map((m) => (
                  <option key={m} value={m}>
                    {MEAL_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {showCreateForm ? 'Close Form' : 'New Custom Food'}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateCustom}
            className="border-t border-[#242D3D] pt-4 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="custom-food-name"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Food Name
                </label>
                <input
                  id="custom-food-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Turkey Breast Deli Slices"
                  className="w-full px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="custom-food-serving"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Serving Size
                </label>
                <input
                  id="custom-food-serving"
                  type="text"
                  value={newServing}
                  onChange={(e) => setNewServing(e.target.value)}
                  placeholder="e.g., 100 g"
                  className="w-full px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="custom-food-category"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Category
                </label>
                <select
                  id="custom-food-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as FoodCategory)}
                  className="w-full px-3 py-2 text-sm text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {(Object.keys(CATEGORY_LABELS) as FoodCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label
                  htmlFor="custom-food-p"
                  className="block text-xs font-medium text-sky-400 mb-1"
                >
                  Protein (g)
                </label>
                <input
                  id="custom-food-p"
                  type="number"
                  step="0.1"
                  min={0}
                  value={newP}
                  onChange={(e) => setNewP(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label
                  htmlFor="custom-food-c"
                  className="block text-xs font-medium text-amber-400 mb-1"
                >
                  Carbs (g)
                </label>
                <input
                  id="custom-food-c"
                  type="number"
                  step="0.1"
                  min={0}
                  value={newC}
                  onChange={(e) => setNewC(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label
                  htmlFor="custom-food-f"
                  className="block text-xs font-medium text-rose-400 mb-1"
                >
                  Fats (g)
                </label>
                <input
                  id="custom-food-f"
                  type="number"
                  step="0.1"
                  min={0}
                  value={newF}
                  onChange={(e) => setNewF(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-rose-400"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
              >
                Save Food (
                {calcCaloriesFromMacros(
                  Number(newP) || 0,
                  Number(newC) || 0,
                  Number(newF) || 0,
                )}{' '}
                kcal)
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search foods by name or serving..."
              aria-label="Search food library"
              className="w-full pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0E131C] border border-[#242D3D] rounded-lg overflow-x-auto">
            {(
              [
                ['all', 'All'],
                ['custom', 'My Foods'],
                ['protein', 'Protein'],
                ['carbs', 'Carbs'],
                ['fats', 'Fats'],
                ['balanced', 'Meals'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilter(val)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === val
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Food Table */}
      <section className="bg-[#131924] border border-[#242D3D] rounded-xl overflow-hidden">
        {filteredFoods.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <h3 className="text-sm font-semibold text-white">
              {filter === 'custom'
                ? 'No custom foods saved yet'
                : 'No matching foods found'}
            </h3>
            <p className="text-xs text-slate-400">
              {filter === 'custom'
                ? 'Create a custom food above or check "Save to My Foods" when logging.'
                : 'Try adjusting your search query or switching category tabs.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#242D3D] bg-[#10151F] text-[11px] font-medium text-slate-400">
                  <th className="py-3 pl-5 pr-3">Food Item</th>
                  <th className="py-3 px-3">Serving</th>
                  <th className="py-3 px-3 text-right">Protein</th>
                  <th className="py-3 px-3 text-right">Carbs</th>
                  <th className="py-3 px-3 text-right">Fats</th>
                  <th className="py-3 px-3 text-right">Calories</th>
                  <th className="py-3 pl-3 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2636] text-sm">
                {filteredFoods.map((item) => {
                  const kcal = calcCaloriesFromMacros(
                    item.macrosPerServing.protein,
                    item.macrosPerServing.carbs,
                    item.macrosPerServing.fat,
                  );

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#18202E] transition-colors"
                    >
                      <td className="py-3 pl-5 pr-3">
                        <div className="font-medium text-slate-100">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {CATEGORY_LABELS[item.category]}
                          {item.isCustom ? ' · Saved by you' : ''}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-300 whitespace-nowrap">
                        {item.defaultServingLabel}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-medium text-sky-400 whitespace-nowrap">
                        {item.macrosPerServing.protein} g
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-medium text-amber-400 whitespace-nowrap">
                        {item.macrosPerServing.carbs} g
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-medium text-rose-400 whitespace-nowrap">
                        {item.macrosPerServing.fat} g
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-semibold text-white whitespace-nowrap">
                        {kcal} kcal
                      </td>

                      <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={() => onRemoveCustomFood(item.id)}
                              aria-label={`Delete ${item.name}`}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/15 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-600/15 border border-blue-500/30 rounded-lg hover:bg-blue-600/25 transition-colors whitespace-nowrap shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add to {MEAL_LABELS[targetMeal]}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
