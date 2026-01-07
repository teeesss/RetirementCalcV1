/**
 * CFORecommendations - Automated financial advisor recommendations
 *
 * Provides intelligent recommendations based on plan analysis
 * Similar to RightCapital, Empower, eMoney CFO features
 *
 * @module CFORecommendations
 */

import { usePlan } from '../contexts/PlanContext';
import { calculateRMD } from '../lib/taxEngine';

/**
 * Calculate crypto balance from holdings
 */
function calculateCryptoBalance(crypto) {
  if (!crypto) return 0;
  return (
    (crypto.btc?.quantity || 0) * (crypto.btc?.price || 0) +
    (crypto.eth?.quantity || 0) * (crypto.eth?.price || 0) +
    (crypto.sol?.quantity || 0) * (crypto.sol?.price || 0)
  );
}

export default function CFORecommendations({ ledger, planData, updatePlan, onNavigate }) {
  const { calculateSuccess } = usePlan();

  if (!ledger || ledger.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
        Calculate plan to see CFO recommendations
      </div>
    );
  }

  const success = calculateSuccess;
  const recommendations = [];

  // Analyze plan and generate recommendations
  const finalYear = ledger[ledger.length - 1];
  const lifetimeTax = ledger.reduce((sum, year) => sum + (year.taxes?.totalTax || 0), 0);

  // Check for RMD issues
  const rmdYears = ledger.filter(y => y.age >= 73);
  if (rmdYears.length > 0) {
    const firstRMD = rmdYears[0];
    const rmd = calculateRMD(firstRMD.balances?.traditional || 0, firstRMD.age);
    if (rmd > 100000) {
      recommendations.push({
        type: 'warning',
        title: 'High RMD Risk',
        message: `At age ${firstRMD.age}, RMD will be $${rmd.toLocaleString()}. Consider Roth conversions before age 73 to reduce future tax burden.`,
        action: 'Enable 12% Bracket Fill',
        onApply: () => updatePlan({ taxOptimization: { ...planData.taxOptimization, rothStrategy: '12' } }),
        targetTab: 'strategy',
        targetSubTab: 'tax'
      });
    }
  }

  // Check tax efficiency
  const avgTaxRate = lifetimeTax / ledger.reduce((sum, y) => sum + (y.taxes?.agi || 0), 1);
  if (avgTaxRate > 0.25) {
    recommendations.push({
      type: 'warning',
      title: 'High Tax Burden',
      message: `Average tax rate is ${(avgTaxRate * 100).toFixed(1)}%. Optimize withdrawal strategy to reduce lifetime taxes.`,
      action: 'Review Withdrawal Order',
      onApply: () => updatePlan({ taxOptimization: { ...planData.taxOptimization, withdrawalOrder: 'optimal' } }),
      targetTab: 'strategy',
      targetSubTab: 'tax'
    });
  }

  // Check goal achievement
  if (planData.goals && planData.goals.length > 0) {
    planData.goals.forEach(goal => {
      const yearData = ledger.find(l => l.age === goal.age);
      if (yearData) {
        const gap = (yearData.totalBalance || 0) - goal.amount;
        if (gap < 0) {
          recommendations.push({
            type: 'error',
            title: `Goal Gap at Age ${goal.age}`,
            message: `Projected to be $${Math.abs(gap).toLocaleString()} short of $${goal.amount.toLocaleString()} target.`,
            action: 'Increase Savings',
            targetTab: 'cashflow'
          });
        } else if (gap > goal.amount * 0.2) {
          recommendations.push({
            type: 'success',
            title: `Goal Exceeded at Age ${goal.age}`,
            message: `Projected to exceed target by $${gap.toLocaleString()}. Consider increasing lifestyle spending or earlier retirement.`,
            action: 'Review Spending Goals',
            targetTab: 'cashflow'
          });
        }
      }
    });
  }

  // Check Roth conversion opportunities
  const preRetirementYears = ledger.filter(y => !y.isRetired && y.age < 73);
  if (preRetirementYears.length > 0) {
    const avgIncome = preRetirementYears.reduce((sum, y) => sum + (y.income?.total || 0), 0) / preRetirementYears.length;
    if (avgIncome < 100000) {
      recommendations.push({
        type: 'info',
        title: 'Roth Conversion Opportunity',
        message: `Low income years before retirement. Consider converting up to $50k-$100k annually to Roth to fill 12% bracket.`,
        action: 'Enable Auto Roth Conversions',
        onApply: () => updatePlan({ taxOptimization: { ...planData.taxOptimization, rothStrategy: '12' } }),
        targetTab: 'strategy',
        targetSubTab: 'tax'
      });
    }
  }

  // Check withdrawal strategy
  const retirementYears = ledger.filter(y => y.isRetired);
  /*
  const avgWithdrawal = retirementYears.reduce((sum, y) => {
    const w = (y.withdrawals?.traditional || 0) + (y.withdrawals?.roth || 0) +
      (y.withdrawals?.brokerage || 0) + (y.withdrawals?.crypto || 0);
    return sum + w;
  }, 0) / retirementYears.length;
  */

  if (retirementYears.some(y => (y.withdrawals?.roth || 0) > (y.withdrawals?.traditional || 0) && y.age < 75)) {
    recommendations.push({
      type: 'warning',
      title: 'Suboptimal Withdrawal Order',
      message: 'Roth withdrawals happening before Traditional. Preserve Roth for later years when tax brackets may be higher.',
      action: 'Switch to Optimal Withdrawal Order',
      onApply: () => updatePlan({ taxOptimization: { ...planData.taxOptimization, withdrawalOrder: 'optimal' } }),
      targetTab: 'strategy',
      targetSubTab: 'tax'
    });
  }

  // Check success probability
  if (!success.success) {
    recommendations.push({
      type: 'error',
      title: 'Plan Depletion Risk',
      message: 'Assets projected to deplete before life expectancy. Increase savings rate or reduce expenses.',
      action: 'Adjust Plan Parameters',
      targetTab: 'cashflow'
    });
  }

  // Social Security optimization
  const ssStartAge = planData.socialSecurity?.primary?.startAge || 62;
  if (ssStartAge === 62) {
    recommendations.push({
      type: 'info',
      title: 'Social Security Optimization',
      message: `Starting SS at 62 reduces benefits by ~30% vs age 70. Consider delaying if health allows.`,
      action: 'Review SS Start Age',
      targetTab: 'strategy', // Wait, SS bridge is in Strategy/Optimization panel now
      targetSubTab: 'tax'
    });
  }

  // Check Tax Loss Harvesting Opportunity
  const totalTaxable = (planData.assets?.brokerage || 0) + calculateCryptoBalance(planData.assets?.crypto);
  const currentTLH = (planData.taxOptimization?.taxLossHarvesting?.brokerage || 0) + (planData.taxOptimization?.taxLossHarvesting?.crypto || 0);

  if (totalTaxable > 50000 && currentTLH < 3000) {
    recommendations.push({
      type: 'info',
      title: 'Tax Loss Harvesting Opportunity',
      message: 'You have significant taxable assets but low loss harvesting. Harvesting losses can offset up to $3,000 of ordinary income annually.',
      action: 'Enable Max Loss Harvesting',
      onApply: () => updatePlan({
        taxOptimization: {
          ...planData.taxOptimization,
          taxLossHarvesting: { brokerage: 3000, crypto: 20000, startAge: planData.people?.[0]?.age || 50 }
        }
      }),
      targetTab: 'strategy', // No explicit UI for TLH manual entry in panel, but apply works
      targetSubTab: 'tax'
    });
  }

  // Maximize Tax Efficiency (Catch-all)
  if (avgTaxRate > 0.20 && planData.taxOptimization?.withdrawalOrder !== 'optimal') {
    recommendations.push({
      type: 'success',
      title: 'Maximize Tax Efficiency',
      message: 'One-click optimization to apply best-practice withdrawal order, Roth conversions, and loss harvesting.',
      action: 'Apply All Tax Strategies',
      onApply: () => updatePlan({
        taxOptimization: {
          ...planData.taxOptimization,
          withdrawalOrder: 'optimal',
          rothStrategy: '12',
          taxLossHarvesting: { brokerage: 3000, crypto: 10000, startAge: planData.people?.[0]?.age || 50 }
        }
      }),
      targetTab: 'strategy',
      targetSubTab: 'tax'
    });
  }

  // Mortgage strategy
  const mortgageYears = ledger.filter(y => (y.expenses?.mortgage || 0) > 0);
  if (mortgageYears.length > 0 && mortgageYears.length > 10) {
    recommendations.push({
      type: 'info',
      title: 'Mortgage Payoff Strategy',
      message: `Mortgage payments continue for ${mortgageYears.length} years (until Age ${mortgageYears[mortgageYears.length - 1].age}). Consider accelerated payoff.`,
      action: 'Review Mortgage Strategy',
      targetTab: 'strategy',
      targetSubTab: 'expenses'
    });
  }

  const getColorClass = (type) => {
    switch (type) {
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'success': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return '💡';
    }
  };

  return (
    <div className="space-y-3">
      {recommendations.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
          <div className="text-2xl mb-2">✅</div>
          <div>Plan looks optimal! No critical recommendations at this time.</div>
        </div>
      ) : (
        recommendations.map((rec, idx) => (
          <div key={idx} className={`p-3 rounded-lg border-2 ${getColorClass(rec.type)}`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">{getIcon(rec.type)}</span>
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">{rec.title}</h4>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{rec.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => onNavigate && onNavigate(rec.targetTab, rec.targetSubTab)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    💡 {rec.action} <span className="text-[10px] ml-1">↗</span>
                  </button>
                  {rec.onApply && (
                    <button
                      onClick={() => {
                        rec.onApply();
                        alert(`Applied: ${rec.action}`);
                      }}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Auto-Apply
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400">Success Rate</div>
          <div className={`text-sm font-bold ${success.success ? 'text-green-600' : 'text-red-600'}`}>
            {success.success ? '100%' : '0%'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400">Lifetime Tax</div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            ${(lifetimeTax / 1000).toFixed(0)}k
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400">Final Legacy</div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            ${((finalYear?.netWorth || 0) / 1000000).toFixed(1)}M
          </div>
        </div>
      </div>
    </div>
  );
}
