import { MacroTargets } from '../types/macros';
import {
  KCAL_PER_GRAM,
  calcMacroCaloricShare,
  round1,
} from '../utils/macroMath';

interface DailySummaryPanelProps {
  consumed: MacroTargets;
  targets: MacroTargets;
  onEditTargets: () => void;
}

interface MacroCardSpec {
  key: 'calories' | 'protein' | 'carbs' | 'fat';
  label: string;
  unit: string;
  consumedVal: number;
  targetVal: number;
  barColor: string;
  dotColor: string;
  kcalContribution?: number;
}

export function DailySummaryPanel({
  consumed,
  targets,
  onEditTargets,
}: DailySummaryPanelProps) {
  const actualShare = calcMacroCaloricShare(consumed);
  const targetShare = calcMacroCaloricShare(targets);

  const specs: MacroCardSpec[] = [
    {
      key: 'calories',
      label: 'Daily Calories',
      unit: 'kcal',
      consumedVal: consumed.calories,
      targetVal: targets.calories,
      barColor: 'bg-blue-500',
      dotColor: 'bg-blue-500',
    },
    {
      key: 'protein',
      label: 'Protein',
      unit: 'g',
      consumedVal: consumed.protein,
      targetVal: targets.protein,
      barColor: 'bg-sky-400',
      dotColor: 'bg-sky-400',
      kcalContribution: Math.round(consumed.protein * KCAL_PER_GRAM.protein),
    },
    {
      key: 'carbs',
      label: 'Carbohydrates',
      unit: 'g',
      consumedVal: consumed.carbs,
      targetVal: targets.carbs,
      barColor: 'bg-amber-400',
      dotColor: 'bg-amber-400',
      kcalContribution: Math.round(consumed.carbs * KCAL_PER_GRAM.carbs),
    },
    {
      key: 'fat',
      label: 'Fats',
      unit: 'g',
      consumedVal: consumed.fat,
      targetVal: targets.fat,
      barColor: 'bg-rose-400',
      dotColor: 'bg-rose-400',
      kcalContribution: Math.round(consumed.fat * KCAL_PER_GRAM.fat),
    },
  ];

  return (
    <section
      aria-label="Daily macronutrient summary"
      className="bg-[#131924] border border-[#242D3D] rounded-xl overflow-hidden"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#242D3D]">
        {specs.map((item) => {
          const pct =
            item.targetVal > 0
              ? Math.min(100, Math.round((item.consumedVal / item.targetVal) * 100))
              : 0;
          const diff = round1(item.targetVal - item.consumedVal);
          const isOver = diff < 0;
          const isMet = diff === 0 || (diff > 0 && diff <= item.targetVal * 0.05);

          return (
            <div key={item.key} className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-sm ${item.dotColor}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-200 tracking-wide">
                    {item.label}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-xs text-slate-400">
                  {pct}%
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono tabular-nums text-2xl font-semibold tracking-tight text-white">
                    {item.key === 'calories'
                      ? Math.round(item.consumedVal).toLocaleString()
                      : item.consumedVal}
                  </span>
                  <span className="font-mono tabular-nums text-xs text-slate-400">
                    / {item.key === 'calories' ? item.targetVal.toLocaleString() : item.targetVal}{' '}
                    {item.unit}
                  </span>
                </div>
                {typeof item.kcalContribution === 'number' && (
                  <span className="font-mono tabular-nums text-xs text-slate-400">
                    {item.kcalContribution} kcal
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div
                  className="h-2 w-full bg-[#1E2736] rounded-sm overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(item.consumedVal)}
                  aria-valuemin={0}
                  aria-valuemax={item.targetVal}
                  aria-label={`${item.label} progress`}
                >
                  <div
                    className={`h-full transition-all duration-200 ${
                      isOver ? 'bg-red-500' : item.barColor
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-medium ${
                      isOver
                        ? 'text-red-400'
                        : isMet
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                    }`}
                  >
                    {isOver
                      ? `Over target by ${Math.abs(diff)} ${item.unit}`
                      : diff === 0
                        ? 'Target reached'
                        : `${diff} ${item.unit} remaining`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#242D3D] px-5 py-3.5 bg-[#10151F] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-200">
              Caloric Macro Ratio (Actual vs Target)
            </span>
            <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums text-slate-300">
              <span>
                Protein {actualShare.proteinPct}%{' '}
                <span className="text-slate-400">(target {targetShare.proteinPct}%)</span>
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span>
                Carbs {actualShare.carbsPct}%{' '}
                <span className="text-slate-400">(target {targetShare.carbsPct}%)</span>
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span>
                Fats {actualShare.fatPct}%{' '}
                <span className="text-slate-400">(target {targetShare.fatPct}%)</span>
              </span>
            </div>
          </div>

          <div className="h-2 w-full bg-[#1E2736] rounded-sm overflow-hidden flex">
            {consumed.calories > 0 ? (
              <>
                <div
                  className="bg-sky-400 h-full transition-all duration-200"
                  style={{ width: `${actualShare.proteinPct}%` }}
                  title={`Protein ${actualShare.proteinPct}%`}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-200"
                  style={{ width: `${actualShare.carbsPct}%` }}
                  title={`Carbohydrates ${actualShare.carbsPct}%`}
                />
                <div
                  className="bg-rose-400 h-full transition-all duration-200"
                  style={{ width: `${actualShare.fatPct}%` }}
                  title={`Fats ${actualShare.fatPct}%`}
                />
              </>
            ) : (
              <div className="w-full h-full bg-[#1E2736]" />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onEditTargets}
          className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#18202E] border border-[#2C374B] rounded-lg hover:bg-[#202A3C] hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Adjust Targets
        </button>
      </div>
    </section>
  );
}
