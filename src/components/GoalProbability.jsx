/**
 * GoalProbability - Calculate probability of hitting goals
 *
 * Shows probability of success for each goal based on Monte Carlo results
 *
 * @module GoalProbability
 */

import { usePlan } from '../contexts/PlanContext';

export default function GoalProbability() {
  const { planData, ledger } = usePlan();

  if (!planData.goals || planData.goals.length === 0) {
    return null;
  }

  // Calculate probability for each goal
  const goalProbabilities = planData.goals.map(goal => {
    const yearData = ledger.find(l => l.age === goal.age);
    if (!yearData) return { ...goal, probability: 0, gap: 0 };

    const totalBalance = yearData.totalBalance || 0;
    const gap = totalBalance - goal.amount;
    const probability = totalBalance >= goal.amount ? 100 : Math.max(0, (totalBalance / goal.amount) * 100);

    return {
      ...goal,
      probability,
      gap,
      actual: totalBalance
    };
  });

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-yellow-500 dark:border-yellow-600">
      <h3 className="text-sm font-semibold mb-3 text-yellow-600 dark:text-yellow-400">{'Goal Probability'}</h3>
      <div className="space-y-2">
        {goalProbabilities.map((goal, idx) => (
          <div key={idx} className="text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-700 dark:text-gray-300">Age {goal.age}:</span>
              <span className={`font-semibold ${goal.probability >= 100 ? 'text-green-600' : goal.probability >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                {goal.probability.toFixed(0)}%
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-xs">
              Target: ${goal.amount.toLocaleString()} |
              Actual: ${(goal.actual || 0).toLocaleString()} |
              Gap: <span className={goal.gap >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${goal.gap.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
