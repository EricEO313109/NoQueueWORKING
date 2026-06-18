/** Rule-based smart coach — structured for future LLM swap */
export function generateCoachInsights({ totals, targets, entries, streak }) {
  const insights = [];
  const calLeft = targets.calories - totals.calories;
  const proteinLeft = targets.protein - totals.protein;

  if (proteinLeft > 25 && totals.calories > targets.calories * 0.4) {
    insights.push({
      type: 'protein',
      priority: 1,
      message: `You still need ~${Math.round(proteinLeft)}g protein today. Add chicken, yogurt, or whey.`,
      action: 'scan',
    });
  }

  if (calLeft > 0 && calLeft < 500) {
    insights.push({
      type: 'calories',
      priority: 2,
      message: `You can still eat ~${Math.round(calLeft)} kcal today without going over your goal.`,
      action: null,
    });
  }

  if (calLeft < -150) {
    insights.push({
      type: 'warning',
      priority: 1,
      message: `You are ${Math.abs(Math.round(calLeft))} kcal over goal. Fresh start tomorrow.`,
      action: null,
    });
  }

  if (totals.sodium > targets.sodium * 0.85) {
    insights.push({
      type: 'sodium',
      priority: 3,
      message: "Watch sodium — you're close to your daily limit.",
      action: null,
    });
  }

  if (streak >= 3) {
    insights.push({
      type: 'streak',
      priority: 4,
      message: `🔥 ${streak}-day streak! Keep it going.`,
      action: null,
    });
  }

  if (!entries.length) {
    insights.push({
      type: 'empty',
      priority: 0,
      message: 'Scan your first food — takes under 3 seconds.',
      action: 'scan',
    });
  }

  return insights.sort((a, b) => a.priority - b.priority).slice(0, 2);
}

export function describeMealQuick(text) {
  const lower = text.toLowerCase();
  const hints = [];
  if (/pui|chicken/.test(lower)) hints.push('piept pui ~165 kcal/100g');
  if (/ou|egg/.test(lower)) hints.push('ou ~78 kcal');
  if (/orez|rice/.test(lower)) hints.push('orez ~130 kcal/100g');
  return hints.length ? hints.join(' · ') : 'Estimare AI: ~350 kcal (demo)';
}
