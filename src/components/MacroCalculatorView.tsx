import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  ActivityLevel,
  CalculatorProfile,
  GoalMode,
  MacroTargets,
  SplitPreset,
} from '../types/macros';
import {
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  SPLIT_PRESETS,
  calcCaloriesFromMacros,
  calcTargetsFromProfile,
} from '../utils/macroMath';

interface MacroCalculatorViewProps {
  profile: CalculatorProfile;
  currentTargets: MacroTargets;
  onUpdateProfile: (profile: CalculatorProfile) => void;
  onApplyTargets: (targets: MacroTargets) => void;
}

export function MacroCalculatorView({
  profile,
  currentTargets,
  onUpdateProfile,
  onApplyTargets,
}: MacroCalculatorViewProps) {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [appliedBanner, setAppliedBanner] = useState<string>('');

  // Manual gram override state
  const [manualProtein, setManualProtein] = useState(String(currentTargets.protein));
  const [manualCarbs, setManualCarbs] = useState(String(currentTargets.carbs));
  const [manualFat, setManualFat] = useState(String(currentTargets.fat));

  useEffect(() => {
    setManualProtein(String(currentTargets.protein));
    setManualCarbs(String(currentTargets.carbs));
    setManualFat(String(currentTargets.fat));
  }, [currentTargets]);

  const computed = calcTargetsFromProfile(profile);

  // Imperial helpers
  const weightLbs = Math.round(profile.weightKg * 2.20462);
  const totalInches = Math.round(profile.heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  const handleWeightLbsChange = (lbs: number) => {
    const kg = Math.max(35, Math.min(250, Math.round((lbs / 2.20462) * 10) / 10));
    onUpdateProfile({ ...profile, weightKg: kg });
  };

  const handleImperialHeightChange = (nextFeet: number, nextInches: number) => {
    const cm = Math.max(
      120,
      Math.min(230, Math.round((nextFeet * 12 + nextInches) * 2.54)),
    );
    onUpdateProfile({ ...profile, heightCm: cm });
  };

  const handleCustomSplitChange = (
    key: 'proteinPct' | 'carbsPct' | 'fatPct',
    rawVal: number,
  ) => {
    const clamped = Math.max(5, Math.min(80, Math.round(rawVal)));
    const current = profile.customSplit;
    const remainder = 100 - clamped;

    let nextSplit = { ...current, [key]: clamped };
    if (key === 'proteinPct') {
      const prevRest = current.carbsPct + current.fatPct || 1;
      const nextCarbs = Math.max(5, Math.round((current.carbsPct / prevRest) * remainder));
      const nextFat = Math.max(5, 100 - clamped - nextCarbs);
      nextSplit = {
        proteinPct: 100 - nextCarbs - nextFat,
        carbsPct: nextCarbs,
        fatPct: nextFat,
      };
    } else if (key === 'carbsPct') {
      const prevRest = current.proteinPct + current.fatPct || 1;
      const nextProtein = Math.max(
        5,
        Math.round((current.proteinPct / prevRest) * remainder),
      );
      const nextFat = Math.max(5, 100 - clamped - nextProtein);
      nextSplit = {
        proteinPct: nextProtein,
        carbsPct: 100 - nextProtein - nextFat,
        fatPct: nextFat,
      };
    } else {
      const prevRest = current.proteinPct + current.carbsPct || 1;
      const nextProtein = Math.max(
        5,
        Math.round((current.proteinPct / prevRest) * remainder),
      );
      const nextCarbs = Math.max(5, 100 - clamped - nextProtein);
      nextSplit = {
        proteinPct: nextProtein,
        carbsPct: nextCarbs,
        fatPct: 100 - nextProtein - nextCarbs,
      };
    }

    onUpdateProfile({
      ...profile,
      splitPreset: 'custom',
      customSplit: nextSplit,
    });
  };

  const handleApplyCalculated = () => {
    onApplyTargets(computed.targets);
    setAppliedBanner('Calculated targets applied to your daily tracker.');
    setTimeout(() => setAppliedBanner(''), 3500);
  };

  const manualP = Math.max(0, Math.round(Number(manualProtein) || 0));
  const manualC = Math.max(0, Math.round(Number(manualCarbs) || 0));
  const manualF = Math.max(0, Math.round(Number(manualFat) || 0));
  const manualTotalCalories = calcCaloriesFromMacros(manualP, manualC, manualF);

  const handleApplyManual = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyTargets({
      calories: manualTotalCalories,
      protein: manualP,
      carbs: manualC,
      fat: manualF,
    });
    setAppliedBanner('Custom gram targets saved to your daily tracker.');
    setTimeout(() => setAppliedBanner(''), 3500);
  };

  const proteinPerKg =
    profile.weightKg > 0
      ? (computed.targets.protein / profile.weightKg).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {appliedBanner && (
        <div
          role="status"
          className="bg-blue-600/15 border border-blue-500/35 text-blue-200 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{appliedBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Body Profile, Activity, Goal & Split Controls */}
        <section className="lg:col-span-7 bg-[#131924] border border-[#242D3D] rounded-xl divide-y divide-[#242D3D]">
          <div className="p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Macronutrient &amp; Energy Calculator
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mifflin-St Jeor basal metabolic rate scaled by activity and macro
                distribution
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#0E131C] border border-[#242D3D] rounded-lg">
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  unitSystem === 'metric'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Metric (kg / cm)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  unitSystem === 'imperial'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Imperial (lb / ft)
              </button>
            </div>
          </div>

          {/* Biometrics */}
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300">
              1. Body Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="block text-xs text-slate-400 mb-1.5">Sex</span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#0E131C] border border-[#242D3D] rounded-lg">
                  {(['male', 'female'] as const).map((sex) => (
                    <button
                      key={sex}
                      type="button"
                      onClick={() => onUpdateProfile({ ...profile, sex })}
                      className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                        profile.sex === sex
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sex}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="calc-age"
                  className="block text-xs text-slate-400 mb-1.5"
                >
                  Age (years)
                </label>
                <input
                  id="calc-age"
                  type="number"
                  min={14}
                  max={95}
                  value={profile.age}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...profile,
                      age: Math.max(14, Math.min(95, Number(e.target.value) || 25)),
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {unitSystem === 'metric' ? (
                <>
                  <div>
                    <label
                      htmlFor="calc-height-cm"
                      className="block text-xs text-slate-400 mb-1.5"
                    >
                      Height (cm)
                    </label>
                    <input
                      id="calc-height-cm"
                      type="number"
                      min={120}
                      max={230}
                      value={profile.heightCm}
                      onChange={(e) =>
                        onUpdateProfile({
                          ...profile,
                          heightCm: Math.max(
                            120,
                            Math.min(230, Number(e.target.value) || 170),
                          ),
                        })
                      }
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="calc-weight-kg"
                      className="block text-xs text-slate-400 mb-1.5"
                    >
                      Weight (kg)
                    </label>
                    <input
                      id="calc-weight-kg"
                      type="number"
                      step="0.5"
                      min={35}
                      max={250}
                      value={profile.weightKg}
                      onChange={(e) =>
                        onUpdateProfile({
                          ...profile,
                          weightKg: Math.max(
                            35,
                            Math.min(250, Number(e.target.value) || 70),
                          ),
                        })
                      }
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="block text-xs text-slate-400 mb-1.5">
                      Height (ft / in)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        min={4}
                        max={7}
                        aria-label="Height feet"
                        value={feet}
                        onChange={(e) =>
                          handleImperialHeightChange(
                            Number(e.target.value) || 5,
                            inches,
                          )
                        }
                        className="w-full px-2.5 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        min={0}
                        max={11}
                        aria-label="Height inches"
                        value={inches}
                        onChange={(e) =>
                          handleImperialHeightChange(
                            feet,
                            Math.max(0, Math.min(11, Number(e.target.value) || 0)),
                          )
                        }
                        className="w-full px-2.5 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="calc-weight-lbs"
                      className="block text-xs text-slate-400 mb-1.5"
                    >
                      Weight (lbs)
                    </label>
                    <input
                      id="calc-weight-lbs"
                      type="number"
                      min={80}
                      max={500}
                      value={weightLbs}
                      onChange={(e) =>
                        handleWeightLbsChange(Number(e.target.value) || 150)
                      }
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Activity Level */}
          <div className="p-6 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300">
              2. Weekly Activity Level
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((key) => {
                const info = ACTIVITY_MULTIPLIERS[key];
                const active = profile.activityLevel === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      onUpdateProfile({ ...profile, activityLevel: key })
                    }
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      active
                        ? 'border-blue-500 bg-blue-600/15'
                        : 'border-[#242D3D] bg-[#0E131C] hover:bg-[#17202F]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">
                        {info.label}
                      </span>
                      <span
                        className={`font-mono tabular-nums text-[11px] ${
                          active ? 'text-blue-300' : 'text-slate-400'
                        }`}
                      >
                        {info.factor}x
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{info.detail}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal & Macro Split */}
          <div className="p-6 space-y-5">
            <div className="space-y-2.5">
              <label
                htmlFor="calc-goal-select"
                className="block text-xs font-semibold text-slate-300"
              >
                3. Calorie Goal
              </label>
              <select
                id="calc-goal-select"
                value={profile.goal}
                onChange={(e) =>
                  onUpdateProfile({
                    ...profile,
                    goal: e.target.value as GoalMode,
                  })
                }
                className="w-full px-3 py-2 text-sm text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-blue-500"
              >
                {(Object.keys(GOAL_ADJUSTMENTS) as GoalMode[]).map((g) => (
                  <option key={g} value={g}>
                    {GOAL_ADJUSTMENTS[g].label} — {GOAL_ADJUSTMENTS[g].detail}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  4. Macronutrient Caloric Split
                </span>
                <span className="font-mono tabular-nums text-xs text-slate-400">
                  {computed.activeSplit.proteinPct}% P ·{' '}
                  {computed.activeSplit.carbsPct}% C ·{' '}
                  {computed.activeSplit.fatPct}% F
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(SPLIT_PRESETS) as Exclude<SplitPreset, 'custom'>[]).map(
                  (presetKey) => {
                    const active = profile.splitPreset === presetKey;
                    return (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() =>
                          onUpdateProfile({ ...profile, splitPreset: presetKey })
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-[#0E131C] text-slate-300 border-[#283346] hover:bg-[#1A2333] hover:text-white'
                        }`}
                      >
                        {SPLIT_PRESETS[presetKey].label}
                      </button>
                    );
                  },
                )}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProfile({ ...profile, splitPreset: 'custom' })
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    profile.splitPreset === 'custom'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#0E131C] text-slate-300 border-[#283346] hover:bg-[#1A2333] hover:text-white'
                  }`}
                >
                  Custom %
                </button>
              </div>

              {profile.splitPreset === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-sky-400 font-medium">Protein</span>
                      <span className="font-mono tabular-nums text-slate-200">
                        {profile.customSplit.proteinPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={profile.customSplit.proteinPct}
                      onChange={(e) =>
                        handleCustomSplitChange('proteinPct', Number(e.target.value))
                      }
                      aria-label="Custom protein percentage"
                      className="w-full accent-sky-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-amber-400 font-medium">Carbs</span>
                      <span className="font-mono tabular-nums text-slate-200">
                        {profile.customSplit.carbsPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={70}
                      value={profile.customSplit.carbsPct}
                      onChange={(e) =>
                        handleCustomSplitChange('carbsPct', Number(e.target.value))
                      }
                      aria-label="Custom carbohydrates percentage"
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-rose-400 font-medium">Fats</span>
                      <span className="font-mono tabular-nums text-slate-200">
                        {profile.customSplit.fatPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={65}
                      value={profile.customSplit.fatPct}
                      onChange={(e) =>
                        handleCustomSplitChange('fatPct', Number(e.target.value))
                      }
                      aria-label="Custom fats percentage"
                      className="w-full accent-rose-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right: Calculated Output + Direct Manual Target Override */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-[#131924] border border-[#242D3D] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-white">
                Recommended Daily Targets
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live calculation from your body profile &amp; goal
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-y border-[#242D3D]">
              <div>
                <div className="text-xs text-slate-400">Basal Metabolic Rate</div>
                <div className="font-mono tabular-nums text-lg font-semibold text-white mt-0.5">
                  {computed.bmr.toLocaleString()} kcal
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Maintenance (TDEE)</div>
                <div className="font-mono tabular-nums text-lg font-semibold text-white mt-0.5">
                  {computed.tdee.toLocaleString()} kcal
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-slate-300">
                  Target Daily Energy
                </span>
                <span className="font-mono tabular-nums text-2xl font-bold text-blue-400">
                  {computed.targets.calories.toLocaleString()} kcal
                </span>
              </div>

              <div className="h-2.5 w-full rounded-sm overflow-hidden flex bg-[#1E2736]">
                <div
                  className="bg-sky-400 h-full"
                  style={{ width: `${computed.activeSplit.proteinPct}%` }}
                />
                <div
                  className="bg-amber-400 h-full"
                  style={{ width: `${computed.activeSplit.carbsPct}%` }}
                />
                <div
                  className="bg-rose-400 h-full"
                  style={{ width: `${computed.activeSplit.fatPct}%` }}
                />
              </div>

              <div className="divide-y divide-[#1E2636] text-sm">
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                    <span className="font-medium text-slate-200">Protein</span>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      ({proteinPerKg} g/kg)
                    </span>
                  </div>
                  <div className="font-mono tabular-nums text-right">
                    <span className="font-semibold text-white">
                      {computed.targets.protein} g
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      {computed.targets.protein * 4} kcal
                    </span>
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                    <span className="font-medium text-slate-200">
                      Carbohydrates
                    </span>
                  </div>
                  <div className="font-mono tabular-nums text-right">
                    <span className="font-semibold text-white">
                      {computed.targets.carbs} g
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      {computed.targets.carbs * 4} kcal
                    </span>
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                    <span className="font-medium text-slate-200">Fats</span>
                  </div>
                  <div className="font-mono tabular-nums text-right">
                    <span className="font-semibold text-white">
                      {computed.targets.fat} g
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      {computed.targets.fat * 9} kcal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyCalculated}
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
            >
              Apply Targets to Daily Tracker
            </button>
          </section>

          {/* Direct Manual Target Override */}
          <section className="bg-[#131924] border border-[#242D3D] rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Set Custom Gram Targets Directly
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active tracker targets: {currentTargets.calories.toLocaleString()}{' '}
                kcal · {currentTargets.protein}P / {currentTargets.carbs}C /{' '}
                {currentTargets.fat}F
              </p>
            </div>

            <form onSubmit={handleApplyManual} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="manual-target-protein"
                    className="block text-xs font-medium text-sky-400 mb-1"
                  >
                    Protein (g)
                  </label>
                  <input
                    id="manual-target-protein"
                    type="number"
                    min={0}
                    value={manualProtein}
                    onChange={(e) => setManualProtein(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label
                    htmlFor="manual-target-carbs"
                    className="block text-xs font-medium text-amber-400 mb-1"
                  >
                    Carbs (g)
                  </label>
                  <input
                    id="manual-target-carbs"
                    type="number"
                    min={0}
                    value={manualCarbs}
                    onChange={(e) => setManualCarbs(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label
                    htmlFor="manual-target-fat"
                    className="block text-xs font-medium text-rose-400 mb-1"
                  >
                    Fats (g)
                  </label>
                  <input
                    id="manual-target-fat"
                    type="number"
                    min={0}
                    value={manualFat}
                    onChange={(e) => setManualFat(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-100 bg-[#0E131C] border border-[#283346] rounded-lg focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  Total:{' '}
                  <strong className="text-white">
                    {manualTotalCalories.toLocaleString()} kcal
                  </strong>
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-slate-100 bg-[#18202E] border border-[#2C374B] rounded-lg hover:bg-[#202A3C] transition-colors whitespace-nowrap shrink-0"
                >
                  Save Custom Targets
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
