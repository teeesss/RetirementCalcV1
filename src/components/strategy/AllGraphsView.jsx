import NetWorthChart from '../NetWorthChart';
import CashFlowChart from '../CashFlowChart';
import DetailedCashFlowChart from './DetailedCashFlowChart';
import GrowthDrawdownChart from './GrowthDrawdownChart';
import WealthFlowChart from './WealthFlowChart';
import SourceAndFlowChart from './SourceAndFlowChart';
import { usePlan } from '../../contexts/PlanContext';

export default function AllGraphsView({ darkMode }) {
  const { ledger } = usePlan();

  if (!ledger || ledger.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <span className="text-4xl mb-4">📊</span>
        <p>Run the simulation to generate charts.</p>
      </div>
    );
  }

  const ChartCard = ({ title, children, className = '' }) => (
    <div
      className={`bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col ${className}`}
    >
      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        {title}
      </h3>
      <div className="flex-grow min-h-[300px] relative">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <span>📈</span> Master Chart Dashboard
        </h2>
        <div className="text-xs text-gray-500">Comprehensive view of all financial projections</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 1. Net Worth (The big picture) */}
        <ChartCard title="💰 Net Worth Trajectory" className="xl:col-span-2 min-h-[400px]">
          <NetWorthChart ledger={ledger} darkMode={darkMode} />
        </ChartCard>

        {/* 2. Source + Flow (The unified flow) */}
        <ChartCard title="⛲ Wealth Sources & Flow" className="xl:col-span-2 min-h-[500px]">
          <SourceAndFlowChart ledger={ledger} darkMode={darkMode} />
        </ChartCard>

        {/* 3. Detailed Cash Flow */}
        <ChartCard title="📊 Detailed Cash Flow (In vs Out)">
          <DetailedCashFlowChart ledger={ledger} darkMode={darkMode} />
        </ChartCard>

        {/* 4. Wealth Flow (Simplified) */}
        <ChartCard title="🌊 Wealth Flow (Growth/Income vs Expenses)">
          <WealthFlowChart ledger={ledger} darkMode={darkMode} />
        </ChartCard>

        {/* 5. Growth & Drawdown */}
        <ChartCard title="📉 Growth vs Drawdown">
          <GrowthDrawdownChart ledger={ledger} darkMode={darkMode} />
        </ChartCard>

        {/* 6. Simple Cash Flow */}
        <ChartCard title="💵 Net Cash Flow">
          <CashFlowChart ledger={ledger} darkMode={darkMode} />
        </ChartCard>
      </div>
    </div>
  );
}
