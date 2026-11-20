import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { DayLogsMap, FoodEntry, MacroTargets, MealType } from '../types/macros';
import {
  MEAL_LABELS,
  MEAL_ORDER,
  calcEntryCalories,
  calcEntryMacros,
  formatDisplayDate,
  formatShortWeekday,
  getLastNDates,
  round1,
  shiftISODate,
  sumEntries,
  toISODateLocal,
} from '../utils/macroMath';
import { DailySummaryPanel } from './DailySummaryPanel';

interface DailyLogViewProps {
  selectedDate: string;
  logsByDate: DayLogsMap;
  targets: MacroTargets;
  onSelectDate: (isoDate: string) => void;
  onOpenAddModal: (meal?: MealType) => void;
  onOpenEditModal: (entry: FoodEntry) => void;
  onUpdateEntry: (date: string, entryId: string, patch: Partial<FoodEntry>) => void;
  onRemoveEntry: (date: string, entryId: string) => void;
  onClearDay: (date: string) => void;
  onCopyPreviousDay: (targetDate: string, sourceDate: string) => void;
  onNavigateToCalculator: () => void;
}

export function DailyLogView({
  selectedDate,
  logsByDate,
  targets,
  onSelectDate,
  onOpenAddModal,
  onOpenEditModal,
  onUpdateEntry,
  onRemoveEntry,
  onClearDay,
  onCopyPreviousDay,
  onNavigateToCalculator,
}: DailyLogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mealFilter, setMealFilter] = useState<'all' | MealType>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const todayIso = toISODateLocal();
  const prevIso = shiftISODate(selectedDate, -1);
  const prevDayHasEntries = (logsByDate[prevIso] ?? []).length > 0;
  const recentDates = useMemo(() => getLastNDates(todayIso, 7), [todayIso]);

  const dayEntries = logsByDate[selectedDate] ?? [];
  const consumed = useMemo(() => sumEntries(dayEntries), [dayEntries]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dayEntries.filter((entry) => {
      const matchesMeal = mealFilter === 'all' || entry.meal === mealFilter;
      const matchesQuery =
        !q ||
        entry.name.toLowerCase().includes(q) ||
        entry.servingLabel.toLowerCase().includes(q);
      return matchesMeal && matchesQuery;
    });
  }, [dayEntries, searchQuery, mealFilter]);

  const visibleMeals = useMemo(() => {
    if (mealFilter !== 'all') return [mealFilter];
    return MEAL_ORDER;
  }, [mealFilter]);

  const handleStepServings = (entry: FoodEntry, delta: number) => {
    const next = round1(Math.max(0.25, entry.servings + delta));
    onUpdateEntry(selectedDate, entry.id, { servings: next });
  };

  return (
    <div className="space-y-6">
      {/* Date Selector & Quick 7-Day Strip */}
      <div className="bg-[#131924] border border-[#242D3D] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectDate(shiftISODate(selectedDate, -1))}
            aria-label="Previous day"
            className="p-2 text-slate-300 hover:text-white hover:bg-[#1B2332] bg-[#0E131C] border border-[#283346] rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-2 min-w-[190px]">
            <div className="text-sm font-semibold text-white">
              {selectedDate === todayIso
                ? 'Today'
                : selectedDate === shiftISODate(todayIso, -1)
                  ? 'Yesterday'
                  : formatDisplayDate(selectedDate)}
            </div>
            <div className="text-xs text-slate-400 font-mono tabular-nums">
              {formatDisplayDate(selectedDate)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectDate(shiftISODate(selectedDate, 1))}
            aria-label="Next day"
            className="p-2 text-slate-300 hover:text-white hover:bg-[#1B2332] bg-[#0E131C] border border-[#283346] rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {selectedDate !== todayIso && (
            <button
              type="button"
              onClick={() => onSelectDate(todayIso)}
              className="ml-1 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-600/15 border border-blue-500/30 rounded-lg hover:bg-blue-600/25 transition-colors whitespace-nowrap shrink-0"
            >
              Jump to Today
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {recentDates.map((iso) => {
            const { weekday, dayNum } = formatShortWeekday(iso);
            const isSelected = iso === selectedDate;
            const daySum = sumEntries(logsByDate[iso] ?? []);
            const hasEntries = (logsByDate[iso] ?? []).length > 0;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDate(iso)}
                className={`px-3 py-1.5 rounded-lg border text-left transition-colors whitespace-nowrap shrink-0 min-w-[74px] ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-[#0E131C] text-slate-300 border-[#242D3D] hover:bg-[#1A2231] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className={isSelected ? 'text-blue-100' : 'text-slate-400'}>
                    {weekday}
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    {dayNum}
                  </span>
                </div>
                <div
                  className={`font-mono tabular-nums text-[11px] mt-0.5 ${
                    isSelected ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {hasEntries ? `${daySum.calories} kcal` : 'No log'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Macro Summary Panel */}
      <DailySummaryPanel
        consumed={consumed}
        targets={targets}
        onEditTargets={onNavigateToCalculator}
      />

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logged foods..."
              aria-label="Filter logged foods"
              className="w-full pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 bg-[#131924] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#131924] border border-[#242D3D] rounded-lg overflow-x-auto">
            {(['all', ...MEAL_ORDER] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMealFilter(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  mealFilter === m
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {m === 'all' ? 'All Meals' : MEAL_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {prevDayHasEntries && (
            <button
              type="button"
              onClick={() => onCopyPreviousDay(selectedDate, prevIso)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#131924] border border-[#283346] rounded-lg hover:bg-[#1B2332] hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Previous Day
            </button>
          )}

          {dayEntries.length > 0 &&
            (!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="px-3 py-2 text-xs font-medium text-slate-300 bg-[#131924] border border-[#283346] rounded-lg hover:text-red-400 hover:border-red-500/40 transition-colors whitespace-nowrap shrink-0"
              >
                Clear Day
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onClearDay(selectedDate);
                    setConfirmClear(false);
                  }}
                  className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors whitespace-nowrap shrink-0"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-2 text-xs font-medium text-slate-300 bg-[#131924] border border-[#283346] rounded-lg hover:bg-[#1B2332] transition-colors whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Empty State for Whole Day */}
      {dayEntries.length === 0 ? (
        <div className="bg-[#131924] border border-[#242D3D] rounded-xl p-10 text-center space-y-4">
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-semibold text-white">
              No foods logged for {formatDisplayDate(selectedDate)}
            </h3>
            <p className="text-sm text-slate-400">
              Add a meal from the whole-food library or enter custom protein,
              carbohydrate, and fat grams to begin tracking this day.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAddModal('breakfast')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
            >
              Log First Entry
            </button>
            {prevDayHasEntries && (
              <button
                type="button"
                onClick={() => onCopyPreviousDay(selectedDate, prevIso)}
                className="px-4 py-2 text-sm font-medium text-slate-200 bg-[#18202E] border border-[#2C374B] rounded-lg hover:bg-[#202A3C] transition-colors whitespace-nowrap shrink-0"
              >
                Copy Yesterday&apos;s Meals
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Meal Sections */
        <div className="space-y-4">
          {visibleMeals.map((mealKey) => {
            const mealEntries = filteredEntries.filter(
              (entry) => entry.meal === mealKey,
            );
            const mealTotals = sumEntries(mealEntries);

            return (
              <section
                key={mealKey}
                aria-label={`${MEAL_LABELS[mealKey]} log`}
                className="bg-[#131924] border border-[#242D3D] rounded-xl overflow-hidden"
              >
                <div className="px-5 py-3.5 border-b border-[#242D3D] bg-[#10151F] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-white tracking-wide">
                      {MEAL_LABELS[mealKey]}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      {mealEntries.length}{' '}
                      {mealEntries.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {mealEntries.length > 0 && (
                      <div className="hidden sm:flex items-center gap-3 font-mono tabular-nums text-xs text-slate-300">
                        <span className="text-sky-400 font-medium">
                          P {mealTotals.protein}g
                        </span>
                        <span className="text-amber-400 font-medium">
                          C {mealTotals.carbs}g
                        </span>
                        <span className="text-rose-400 font-medium">
                          F {mealTotals.fat}g
                        </span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="text-white font-semibold">
                          {mealTotals.calories} kcal
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenAddModal(mealKey)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-600/15 border border-blue-500/30 rounded-lg hover:bg-blue-600/25 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add {MEAL_LABELS[mealKey]}
                    </button>
                  </div>
                </div>

                {mealEntries.length === 0 ? (
                  <div className="px-5 py-4 text-xs text-slate-400 flex items-center justify-between">
                    <span>
                      {searchQuery
                        ? 'No matching items in this meal.'
                        : `No foods logged for ${MEAL_LABELS[mealKey].toLowerCase()} yet.`}
                    </span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1E2636] text-[11px] font-medium text-slate-400">
                          <th className="py-2.5 pl-5 pr-3">Food &amp; Portion</th>
                          <th className="py-2.5 px-3 text-right">Servings</th>
                          <th className="py-2.5 px-3 text-right">Protein</th>
                          <th className="py-2.5 px-3 text-right">Carbs</th>
                          <th className="py-2.5 px-3 text-right">Fats</th>
                          <th className="py-2.5 px-3 text-right">Calories</th>
                          <th className="py-2.5 pl-3 pr-5 text-right">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E2636] text-sm">
                        {mealEntries.map((entry) => {
                          const m = calcEntryMacros(entry);
                          const kcal = calcEntryCalories(entry);

                          return (
                            <tr
                              key={entry.id}
                              className="hover:bg-[#18202E] transition-colors"
                            >
                              <td className="py-2.5 pl-5 pr-3">
                                <div className="font-medium text-slate-100">
                                  {entry.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {entry.servingLabel}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1 border border-[#283346] rounded-md bg-[#0E131C] px-1 py-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStepServings(entry, -0.5)}
                                    aria-label={`Decrease servings for ${entry.name}`}
                                    className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-mono tabular-nums text-xs font-medium text-slate-200 min-w-[34px] text-center">
                                    {entry.servings}x
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleStepServings(entry, 0.5)}
                                    aria-label={`Increase servings for ${entry.name}`}
                                    className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-medium text-sky-400 whitespace-nowrap">
                                {m.protein} g
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-medium text-amber-400 whitespace-nowrap">
                                {m.carbs} g
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-medium text-rose-400 whitespace-nowrap">
                                {m.fat} g
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-white whitespace-nowrap">
                                {kcal} kcal
                              </td>

                              <td className="py-2.5 pl-3 pr-5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onOpenEditModal(entry)}
                                    aria-label={`Edit ${entry.name}`}
                                    className="p-1.5 text-slate-400 hover:text-blue-300 hover:bg-[#212C3F] rounded-md transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onRemoveEntry(selectedDate, entry.id)}
                                    aria-label={`Delete ${entry.name}`}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/15 rounded-md transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
            );
          })}
        </div>
      )}
    </div>
  );
}
