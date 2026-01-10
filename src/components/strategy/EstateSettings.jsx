import { useContext } from 'react';
import { PlanContext } from '../../contexts/PlanContext';
import LegacyWaterfall from './LegacyWaterfall';

const EstateSettings = () => {
  const { planData, setPlanData, ledger } = useContext(PlanContext);
  const estate = planData.estate || {};

  const updateEstate = (key, value) => {
    setPlanData((prev) => ({
      ...prev,
      estate: {
        ...prev.estate,
        [key]: value,
      },
    }));
  };

  const toggleILIT = () => {
    const currentILIT = estate.ilit?.enabled || false;
    updateEstate('ilit', { ...estate.ilit, enabled: !currentILIT });
  };

  const updateCharity = (val) => {
    updateEstate('bequest', { ...estate.bequest, charityPercent: Number(val) });
  };

  // Specific Bequest Handlers
  const addSpecificBequest = () => {
    const currentRecipients = estate.bequest?.specific || [];
    const newRecipient = { id: crypto.randomUUID(), name: '', amount: 0 };
    updateEstate('bequest', { ...estate.bequest, specific: [...currentRecipients, newRecipient] });
  };

  const updateSpecificBequest = (id, field, value) => {
    const currentRecipients = estate.bequest?.specific || [];
    const updated = currentRecipients.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    updateEstate('bequest', { ...estate.bequest, specific: updated });
  };

  const removeSpecificBequest = (id) => {
    const currentRecipients = estate.bequest?.specific || [];
    updateEstate('bequest', {
      ...estate.bequest,
      specific: currentRecipients.filter((r) => r.id !== id),
    });
  };

  // Get final ledger entry for visualization
  const finalEntry = ledger && ledger.length > 0 ? ledger[ledger.length - 1] : null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🏛️ Legacy & Estate Planning
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Optimize wealth transfer efficiency and minimize estate taxes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* ILIT Strategy */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-gray-700 dark:text-gray-200">
                Irrevocable Life Insurance Trust (ILIT)
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={estate.ilit?.enabled || false}
                  onChange={toggleILIT}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Move life insurance policies into a trust to exclude proceeds from factors determining
              Estate Tax liability.
            </p>
            {estate.ilit?.enabled && (
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                ✅ Insurance proceeds removed from Gross Estate calculation.
              </div>
            )}
          </div>

          {/* Charitable Intent */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Charitable Bequest (% of Residual)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={estate.bequest?.charityPercent || 0}
                onChange={(e) => updateCharity(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
              />
              <div className="text-right font-mono font-bold w-16">
                {estate.bequest?.charityPercent || 0}%
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Percentage of net estate gifted to charity, reducing inheritance to heirs.
            </p>
          </div>

          {/* Specific Bequests */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                  Specific Bequests (Cash Gifts)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fixed dollar amounts distributed *before* the residual split.
                </p>
              </div>
              <button
                onClick={addSpecificBequest}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                + Add Gift
              </button>
            </div>

            <div className="space-y-3">
              {(estate.bequest?.specific || []).length === 0 && (
                <div className="text-center py-4 text-xs text-gray-400 italic border border-dashed border-gray-300 dark:border-gray-600 rounded">
                  No specific bequests defined. (e.g. &quot;$10k to Grandchild&quot;)
                </div>
              )}
              {(estate.bequest?.specific || []).map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Recipient Name"
                    value={item.name}
                    onChange={(e) => updateSpecificBequest(item.id, 'name', e.target.value)}
                    className="flex-grow px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  />
                  <div className="relative w-40">
                    <span className="absolute left-3 top-2 text-gray-500 text-xs">$</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) =>
                        updateSpecificBequest(item.id, 'amount', Number(e.target.value))
                      }
                      className="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      step="1000"
                    />
                  </div>
                  <button
                    onClick={() => removeSpecificBequest(item.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Projected Legacy Flow (End of Plan)
          </h3>
          <LegacyWaterfall finalLedgerEntry={finalEntry} />
        </div>
      </div>
    </div>
  );
};

export default EstateSettings;
