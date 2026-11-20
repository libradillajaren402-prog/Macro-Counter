import { useMemo, useState } from 'react';
import { DayLogsMap, MacroTargets } from '../types/macros';
import {
  KCAL_PER_GRAM,
  formatDisplayDate,
  formatShortWeekday,
  getLastNDates,
  round1,
  sumEntries,
  toISODateLocal,
} from '../utils/macroMath';

interface WeeklyTrendsViewProps {
  logsByDate: DayLogsMap;
  targets: MacroTargets;
  onSelectDateAndOpenLog: (isoDate: string) => void;
}

export function WeeklyTrendsView({
  logsByDate,
  targets,
  onSelectDateAndOpenLog,
}: WeeklyTrendsViewProps) {
  const todayIso = toISODateLocal();
  const dates = useMemo(() => getLastNDates(todayIso, 7), [todayIso]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const dailyRows = useMemo(() => {
    return dates.map((iso) => {
      const entries = logsByDate[iso] ?? [];
      const totals = sumEntries(entries);
      const { weekday, dayNum } = formatShortWeekday(iso);
      return {
        iso,
        weekday,
        dayNum,
        entryCount: entries.length,
        totals,
        pKcal: Math.round(totals.protein * KCAL_PER_GRAM.protein),
        cKcal: Math.round(totals.carbs * KCAL_PER_GRAM.carbs),
        fKcal: Math.round(totals.fat * KCAL_PER_GRAM.fat),
      };
    });
  }, [dates, logsByDate]);

  const loggedDays = dailyRows.filter((r) => r.entryCount > 0);
  const divisor = loggedDays.length || 1;

  const averages = {
    calories: Math.round(
      loggedDays.reduce((acc, r) => acc + r.totals.calories, 0) / divisor,
    ),
    protein: round1(
      loggedDays.reduce((acc, r) => acc + r.totals.protein, 0) / divisor,
    ),
    carbs: round1(
      loggedDays.reduce((acc, r) => acc + r.totals.carbs, 0) / divisor,
    ),
    fat: round1(
      loggedDays.reduce((acc, r) => acc + r.totals.fat, 0) / divisor,
    ),
  };

  const maxChartKcal = Math.max(
    targets.calories * 1.15,
    ...dailyRows.map((r) => r.totals.calories * 1.1),
    1500,
  );

  const activeRow =
    hoveredIdx !== null ? dailyRows[hoveredIdx] : dailyRows[dailyRows.length - 1];

  return (
    <div className="space-y-6">
      {/* 7-Day Averages Strip */}
      <section
        aria-label="7-day macro averages"
        className="bg-[#131924] border border-[#242D3D] rounded-xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#242D3D]"
      >
        <div className="p-5 space-y-1">
          <div className="text-xs font-medium text-slate-400">
            7-Day Avg Calories ({loggedDays.length}/7 days logged)
          </div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-blue-400">
            {loggedDays.length > 0 ? averages.calories.toLocaleString() : '0'} kcal
          </div>
          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Target: {targets.calories.toLocaleString()} kcal/day
          </div>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
            <span>Avg Protein</span>
          </div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-white">
            {loggedDays.length > 0 ? averages.protein : '0'} g
          </div>
          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Target: {targets.protein} g/day
          </div>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span>Avg Carbohydrates</span>
          </div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-white">
            {loggedDays.length > 0 ? averages.carbs : '0'} g
          </div>
          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Target: {targets.carbs} g/day
          </div>
        </div>

        <div className="p-5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
            <span>Avg Fats</span>
          </div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-white">
            {loggedDays.length > 0 ? averages.fat : '0'} g
          </div>
          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Target: {targets.fat} g/day
          </div>
        </div>
      </section>

      {/* Stacked Bar Chart */}
      <section className="bg-[#131924] border border-[#242D3D] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              7-Day Caloric Intake by Macronutrient
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Stacked energy contribution from protein (4 kcal/g), carbs (4
              kcal/g), and fats (9 kcal/g)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
              Protein
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              Carbs
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
              Fats
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-4 border-t-2 border-dashed border-blue-400" />
              Target ({targets.calories} kcal)
            </span>
          </div>
        </div>

        {/* Active Day Readout Bar */}
        <div className="px-4 py-2.5 bg-[#0E131C] border border-[#242D3D] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-medium text-slate-200">
            {formatDisplayDate(activeRow.iso)}
          </span>
          <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
            <span className="text-sky-400">P {activeRow.totals.protein}g</span>
            <span className="text-amber-400">C {activeRow.totals.carbs}g</span>
            <span className="text-rose-400">F {activeRow.totals.fat}g</span>
            <span className="text-white font-semibold">
              {activeRow.totals.calories.toLocaleString()} kcal
            </span>
          </div>
        </div>

        {/* Responsive SVG Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[540px]">
            <svg
              viewBox="0 0 700 260"
              className="w-full h-64 overflow-visible"
              role="img"
              aria-label="7-day macronutrient calorie stacked bar chart"
            >
              {/* Horizontal Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = 215 - ratio * 185;
                const val = Math.round(maxChartKcal * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={52}
                      x2={684}
                      y1={y}
                      y2={y}
                      stroke="#222B3B"
                      strokeWidth={1}
                    />
                    <text
                      x={44}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Target Reference Line */}
              {(() => {
                const targetY =
                  215 - (Math.min(targets.calories, maxChartKcal) / maxChartKcal) * 185;
                return (
                  <line
                    x1={52}
                    x2={684}
                    y1={targetY}
                    y2={targetY}
                    stroke="#60A5FA"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                  />
                );
              })()}

              {/* Bars */}
              {dailyRows.map((row, idx) => {
                const slotWidth = (684 - 64) / 7;
                const barWidth = 44;
                const x = 64 + idx * slotWidth + (slotWidth - barWidth) / 2;

                const totalStackKcal = row.pKcal + row.cKcal + row.fKcal;
                const scale = totalStackKcal > 0 ? 185 / maxChartKcal : 0;

                const pH = row.pKcal * scale;
                const cH = row.cKcal * scale;
                const fH = row.fKcal * scale;

                const pY = 215 - pH;
                const cY = pY - cH;
                const fY = cY - fH;

                const isHovered = hoveredIdx === idx;

                return (
                  <g
                    key={row.iso}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSelectDateAndOpenLog(row.iso)}
                  >
                    <rect
                      x={x - 8}
                      y={24}
                      width={barWidth + 16}
                      height={200}
                      fill={isHovered ? '#18202E' : 'transparent'}
                      rx={6}
                    />
                    {totalStackKcal > 0 ? (
                      <>
                        <rect
                          x={x}
                          y={pY}
                          width={barWidth}
                          height={Math.max(0, pH)}
                          fill="#38BDF8"
                        />
                        <rect
                          x={x}
                          y={cY}
                          width={barWidth}
                          height={Math.max(0, cH)}
                          fill="#FBBF24"
                        />
                        <rect
                          x={x}
                          y={fY}
                          width={barWidth}
                          height={Math.max(0, fH)}
                          fill="#FB7185"
                        />
                      </>
                    ) : (
                      <rect
                        x={x}
                        y={211}
                        width={barWidth}
                        height={4}
                        fill="#242D3D"
                        rx={2}
                      />
                    )}
                    <text
                      x={x + barWidth / 2}
                      y={236}
                      textAnchor="middle"
                      className="fill-slate-300 text-[11px] font-medium"
                    >
                      {row.weekday} {row.dayNum}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </section>

      {/* Daily Breakdown Table */}
      <section className="bg-[#131924] border border-[#242D3D] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#242D3D] bg-[#10151F]">
          <h3 className="text-sm font-semibold text-white">
            Daily Intake Ledger (Last 7 Days)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242D3D] bg-[#10151F] text-[11px] font-medium text-slate-400">
                <th className="py-3 pl-6 pr-3">Date</th>
                <th className="py-3 px-3 text-right">Entries</th>
                <th className="py-3 px-3 text-right">Protein</th>
                <th className="py-3 px-3 text-right">Carbs</th>
                <th className="py-3 px-3 text-right">Fats</th>
                <th className="py-3 px-3 text-right">Calories</th>
                <th className="py-3 px-3 text-right">vs Target</th>
                <th className="py-3 pl-3 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2636] text-sm">
              {dailyRows
                .slice()
                .reverse()
                .map((row) => {
                  const delta = row.totals.calories - targets.calories;
                  return (
                    <tr
                      key={row.iso}
                      className="hover:bg-[#18202E] transition-colors"
                    >
                      <td className="py-3 pl-6 pr-3 font-medium text-slate-100 whitespace-nowrap">
                        {formatDisplayDate(row.iso)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-slate-400">
                        {row.entryCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-medium text-sky-400 whitespace-nowrap">
                        {row.totals.protein} g
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-medium text-amber-400 whitespace-nowrap">
                        {row.totals.carbs} g
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-medium text-rose-400 whitespace-nowrap">
                        {row.totals.fat} g
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-semibold text-white whitespace-nowrap">
                        {row.totals.calories.toLocaleString()} kcal
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs whitespace-nowrap">
                        {row.entryCount === 0 ? (
                          <span className="text-slate-500">—</span>
                        ) : delta > 0 ? (
                          <span className="text-red-400">+{delta} kcal</span>
                        ) : (
                          <span className="text-emerald-400">{delta} kcal</span>
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectDateAndOpenLog(row.iso)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#18202E] border border-[#2C374B] rounded-lg hover:bg-[#222D40] transition-colors whitespace-nowrap shrink-0"
                        >
                          Open Day
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
