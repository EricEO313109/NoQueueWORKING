import { useState } from 'react';

import { motion } from 'framer-motion';

import { Card, SegmentedControl } from '@/components/ui/primitives';



const MACRO_COLORS = {

  protein: 'hsl(var(--macro-protein))',

  carbs: 'hsl(var(--macro-carbs))',

  fat: 'hsl(var(--macro-fat))',

};



function MacroBar({ label, value, target, type }) {

  const consumed = Math.round(value * 10) / 10;

  const goal = Math.round(target);

  const left = Math.max(0, Math.round(goal - consumed));

  const pct = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;

  const atGoal = left <= 0;



  return (

    <div className="flex-1 min-w-0 space-y-1.5">

      <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">

        <motion.div

          className="h-full rounded-full"

          style={{ backgroundColor: MACRO_COLORS[type] }}

          initial={{ width: 0 }}

          animate={{ width: `${pct}%` }}

          transition={{ duration: 0.4 }}

        />

      </div>

      <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">{label}</p>

      <p className="text-sm font-bold tabular-nums leading-none">

        {Math.round(consumed)}

        <span className="text-muted font-normal text-xs"> / {goal}g</span>

      </p>

      <p className="text-[10px] text-muted tabular-nums leading-none">

        {atGoal ? 'Goal reached' : `${left}g left`}

      </p>

    </div>

  );

}



function CalorieArc({ consumed, target, mode }) {
  const calConsumed = Math.max(0, Number(consumed) || 0);
  const calTarget = Math.max(0, Number(target) || 0);
  const calLeft = Math.max(0, calTarget - calConsumed);
  const over = calTarget > 0 && calConsumed > calTarget;
  const overBy = over ? Math.round(calConsumed - calTarget) : 0;

  const centerValue = mode === 'remaining' ? calLeft : Math.round(calConsumed);
  const centerLabel = mode === 'remaining' ? 'Remaining' : 'Consumed';

  const percentage = calTarget > 0 ? calConsumed / calTarget : 0;
  const isEmpty = calConsumed === 0;

  let fillPct = 0;
  let strokeColor = 'hsl(var(--macro-cal))';

  if (!isEmpty && over) {
    const overflowCalories = calConsumed - calTarget;
    const overflowPercentage = calTarget > 0 ? overflowCalories / calTarget : 0;
    fillPct = Math.min(1, overflowPercentage);
    strokeColor = '#ef4444';
  } else if (!isEmpty) {
    fillPct = Math.min(1, percentage);
  }

  const size = 220;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const arcLen = Math.PI * r;
  const offset = arcLen - fillPct * arcLen;
  const arcPath = `M ${stroke / 2} ${size * 0.5} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size * 0.5}`;

  return (
    <div className="space-y-4">
      <div className="relative mx-auto overflow-hidden" style={{ width: size, height: size * 0.55 }}>
        <svg
          width={size}
          height={size * 0.55}
          viewBox={`0 0 ${size} ${size * 0.55}`}
          className="block"
          aria-hidden
        >
          <path
            d={arcPath}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {!isEmpty && fillPct > 0 && (
            <motion.path
              d={arcPath}
              fill="none"
              stroke={strokeColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              pathLength={arcLen}
              strokeDasharray={`${arcLen} ${arcLen}`}
              initial={{ strokeDashoffset: arcLen }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.5 }}
            />
          )}
        </svg>
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center pointer-events-none">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{centerLabel}</p>
          <p className="text-4xl font-extrabold tabular-nums tracking-tight leading-none mt-0.5">
            {centerValue}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-1 text-center">
        <div className="rounded-xl bg-surface-2/80 py-2 px-1">
          <p className="text-[9px] text-muted font-medium uppercase">Remaining</p>
          <p className="text-sm font-bold tabular-nums mt-0.5">
            {over ? '0' : calLeft}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2/80 py-2 px-1">
          <p className="text-[9px] text-muted font-medium uppercase">Target</p>
          <p className="text-sm font-bold tabular-nums mt-0.5">{calTarget}</p>
        </div>
        <div className="rounded-xl bg-surface-2/80 py-2 px-1">
          <p className="text-[9px] text-muted font-medium uppercase">{over ? 'Over' : 'Status'}</p>
          <p className={`text-sm font-bold tabular-nums mt-0.5 ${over ? 'text-red-500' : 'text-emerald-400'}`}>
            {over ? `+${overBy}` : 'On track'}
          </p>
        </div>
      </div>
    </div>
  );
}



export default function DailySummaryCard({ totals, targets }) {

  const [mode, setMode] = useState('consumed');



  return (

    <Card className="p-5 overflow-hidden">

      <p className="text-sm font-bold mb-4">Daily Nutrition</p>

      <CalorieArc

        consumed={totals.calories}

        target={targets.calories}

        mode={mode}

      />

      <div className="flex gap-5 mt-6">

        <MacroBar label="Protein" value={totals.protein} target={targets.protein} type="protein" />

        <MacroBar label="Fat" value={totals.fat} target={targets.fat} type="fat" />

        <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} type="carbs" />

      </div>

      <div className="flex justify-center mt-5">

        <SegmentedControl

          value={mode}

          onChange={setMode}

          options={[

            { value: 'consumed', label: 'Consumed' },

            { value: 'remaining', label: 'Remaining' },

          ]}

        />

      </div>

    </Card>

  );

}


