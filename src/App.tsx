/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardList,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { DailyLogView } from './components/DailyLogView';
import { FoodLibraryView } from './components/FoodLibraryView';
import { LogFoodModal } from './components/LogFoodModal';
import { MacroCalculatorView } from './components/MacroCalculatorView';
import { WeeklyTrendsView } from './components/WeeklyTrendsView';
import { useMacroStore } from './hooks/useMacroStore';
import { ActiveView, FoodEntry, FoodLibraryItem, MealType } from './types/macros';
import { formatDisplayDate } from './utils/macroMath';

const NAV_ITEMS: { id: ActiveView; label: string; icon: typeof ClipboardList }[] = [
  { id: 'log', label: 'Daily Log', icon: ClipboardList },
  { id: 'calculator', label: 'Macro Calculator', icon: Calculator },
  { id: 'library', label: 'Food Library', icon: BookOpen },
  { id: 'trends', label: 'Weekly Trends', icon: BarChart3 },
];

export default function App() {
  const {
    selectedDate,
    setSelectedDate,
    logsByDate,
    targets,
    setTargets,
    profile,
    setProfile,
    allFoods,
    addEntry,
    updateEntry,
    removeEntry,
    clearDayLog,
    copyFromPreviousDay,
    addCustomFood,
    removeCustomFood,
    resetDemoData,
  } = useMacroStore();

  const [activeView, setActiveView] = useState<ActiveView>('log');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalDefaultMeal, setModalDefaultMeal] = useState<MealType>('breakfast');
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  const handleOpenAddModal = (meal: MealType = 'breakfast') => {
    setEditingEntry(null);
    setModalDefaultMeal(meal);
    setIsLogModalOpen(true);
  };

  const handleOpenEditModal = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setModalDefaultMeal(entry.meal);
    setIsLogModalOpen(true);
  };

  const handleAddLibraryItemToDay = (
    item: FoodLibraryItem,
    meal: MealType,
    servings: number,
  ) => {
    addEntry(selectedDate, {
      name: item.name,
      meal,
      servingLabel: item.defaultServingLabel,
      servings,
      baseMacros: item.macrosPerServing,
    });
  };

  const activeNavTitle =
    NAV_ITEMS.find((item) => item.id === activeView)?.label ?? 'Daily Log';

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 bg-[#10151F] border-r border-[#222B3B] min-h-screen sticky top-0 h-screen justify-between">
        <div>
          <div className="h-16 px-6 flex items-center border-b border-[#222B3B]">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('log');
              }}
              className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
            >
              Macro<span className="text-blue-400">Ledger</span>
            </a>
          </div>

          <nav aria-label="Primary navigation" className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-slate-400 hover:bg-[#18202E] hover:text-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Daily Target Summary */}
        <div className="p-4 border-t border-[#222B3B] space-y-3 bg-[#0E131C]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 tracking-wide">
              Active Targets
            </span>
            <button
              type="button"
              onClick={() => setActiveView('calculator')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 whitespace-nowrap"
            >
              Edit
            </button>
          </div>
          <div className="space-y-1.5 text-xs font-mono tabular-nums">
            <div className="flex justify-between text-slate-400">
              <span className="font-sans">Energy</span>
              <span className="font-semibold text-white">
                {targets.calories.toLocaleString()} kcal
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="font-sans">Protein</span>
              <span className="text-sky-400 font-medium">{targets.protein} g</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="font-sans">Carbs</span>
              <span className="text-amber-400 font-medium">{targets.carbs} g</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="font-sans">Fats</span>
              <span className="text-rose-400 font-medium">{targets.fat} g</span>
            </div>
          </div>

          <button
            type="button"
            onClick={resetDemoData}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#161E2B] border border-[#283346] rounded-lg hover:bg-[#1D2738] hover:text-white transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Sample Data
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="bg-[#10151F] border-b border-[#222B3B] sticky top-0 z-30">
          <div className="h-14 lg:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="lg:hidden font-display text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
                Macro<span className="text-blue-400">Ledger</span>
              </span>
              <span className="lg:hidden text-slate-600" aria-hidden="true">
                /
              </span>
              <div className="flex items-center gap-2 text-sm truncate">
                <span className="font-semibold text-white truncate tracking-wide">
                  {activeNavTitle}
                </span>
                <span
                  className="hidden sm:inline text-slate-600"
                  aria-hidden="true"
                >
                  ·
                </span>
                <span className="hidden sm:inline text-xs text-slate-400 font-mono tabular-nums truncate">
                  {formatDisplayDate(selectedDate)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddModal('lunch')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Food
            </button>
          </div>

          {/* Mobile View Switcher */}
          <nav
            aria-label="Mobile navigation"
            className="lg:hidden px-4 pb-2 flex items-center gap-1 overflow-x-auto"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#18202E]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1220px] w-full mx-auto">
          {activeView === 'log' && (
            <DailyLogView
              selectedDate={selectedDate}
              logsByDate={logsByDate}
              targets={targets}
              onSelectDate={setSelectedDate}
              onOpenAddModal={handleOpenAddModal}
              onOpenEditModal={handleOpenEditModal}
              onUpdateEntry={updateEntry}
              onRemoveEntry={removeEntry}
              onClearDay={clearDayLog}
              onCopyPreviousDay={copyFromPreviousDay}
              onNavigateToCalculator={() => setActiveView('calculator')}
            />
          )}

          {activeView === 'calculator' && (
            <MacroCalculatorView
              profile={profile}
              currentTargets={targets}
              onUpdateProfile={setProfile}
              onApplyTargets={(nextTargets) => setTargets(nextTargets)}
            />
          )}

          {activeView === 'library' && (
            <FoodLibraryView
              foods={allFoods}
              selectedDate={selectedDate}
              onAddEntryToDay={handleAddLibraryItemToDay}
              onAddCustomFood={addCustomFood}
              onRemoveCustomFood={removeCustomFood}
            />
          )}

          {activeView === 'trends' && (
            <WeeklyTrendsView
              logsByDate={logsByDate}
              targets={targets}
              onSelectDateAndOpenLog={(iso) => {
                setSelectedDate(iso);
                setActiveView('log');
              }}
            />
          )}
        </main>

        {/* Quiet Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-[#222B3B] bg-[#10151F]/80 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-full">
          <span>
            Conversion factors: Protein 4 kcal/g · Carbohydrates 4 kcal/g · Fats
            9 kcal/g
          </span>
          <span>Data stored locally in your browser</span>
        </footer>
      </div>

      {/* Add / Edit Food Modal */}
      <LogFoodModal
        isOpen={isLogModalOpen}
        defaultMeal={modalDefaultMeal}
        editingEntry={editingEntry}
        foodCatalog={allFoods}
        onClose={() => {
          setIsLogModalOpen(false);
          setEditingEntry(null);
        }}
        onSaveEntry={(entry) => addEntry(selectedDate, entry)}
        onUpdateEntry={(entryId, patch) => updateEntry(selectedDate, entryId, patch)}
        onSaveToLibrary={addCustomFood}
      />
    </div>
  );
}
