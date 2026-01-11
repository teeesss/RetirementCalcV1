import { useState } from 'react';
import SmartInput from './SmartInput';

export default function AnnuityManager({ annuities = [], updatePlan, currentAge = 50 }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newAnnuity, setNewAnnuity] = useState({
    name: 'New Annuity',
    monthlyPayout: 1000,
    startAge: 65,
    purchaseAmount: 0,
    purchaseYear: new Date().getFullYear(),
    inflationAdjusted: false,
    growthRate: 2.5,
  });

  const handleAdd = () => {
    const updated = [...annuities, { ...newAnnuity, id: Date.now().toString() }];
    updatePlan({ annuities: updated });
    setShowAdd(false);
  };

  const handleRemove = (id) => {
    updatePlan({ annuities: annuities.filter((a) => a.id !== id) });
  };

  const handleUpdate = (id, field, value) => {
    updatePlan({
      annuities: annuities.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
          Annuities (SPIA / DIA)
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded hover:bg-indigo-100 transition-colors uppercase"
        >
          {showAdd ? 'Cancel' : '+ Add Asset'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-full">
              <label className="block text-[8px] font-black text-indigo-400 uppercase mb-1">
                Name (e.g., Allianz Core Income)
              </label>
              <input
                type="text"
                value={newAnnuity.name}
                onChange={(e) => setNewAnnuity({ ...newAnnuity, name: e.target.value })}
                className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-800 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-indigo-400 uppercase mb-1">
                Monthly Payout ($)
              </label>
              <SmartInput
                value={newAnnuity.monthlyPayout}
                onChange={(val) => setNewAnnuity({ ...newAnnuity, monthlyPayout: val })}
                className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-800 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-indigo-400 uppercase mb-1">
                Start Age
              </label>
              <SmartInput
                value={newAnnuity.startAge}
                onChange={(val) => setNewAnnuity({ ...newAnnuity, startAge: val })}
                className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-800 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-indigo-400 uppercase mb-1">
                Purchase Cost ($)
              </label>
              <SmartInput
                value={newAnnuity.purchaseAmount}
                onChange={(val) => setNewAnnuity({ ...newAnnuity, purchaseAmount: val })}
                className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-800 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-indigo-400 uppercase mb-1">
                Purchase Year
              </label>
              <SmartInput
                value={newAnnuity.purchaseYear}
                onChange={(val) => setNewAnnuity({ ...newAnnuity, purchaseYear: val })}
                className="w-full bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-800 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="col-span-full flex items-center gap-4 py-2 border-t border-indigo-100 dark:border-indigo-800 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAnnuity.inflationAdjusted}
                  onChange={(e) =>
                    setNewAnnuity({ ...newAnnuity, inflationAdjusted: e.target.checked })
                  }
                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                />
                <span className="text-[10px] font-black text-indigo-600 uppercase">
                  Inflation Protected (COLA)
                </span>
              </label>
              {newAnnuity.inflationAdjusted && (
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-indigo-400 uppercase">Rate:</span>
                  <SmartInput
                    value={newAnnuity.growthRate}
                    onChange={(val) => setNewAnnuity({ ...newAnnuity, growthRate: val })}
                    className="w-12 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-800 rounded px-1 py-0.5 text-[10px] font-bold outline-none"
                  />
                  <span className="text-[10px] font-bold text-gray-400">%</span>
                </div>
              )}
            </div>
            <button
              onClick={handleAdd}
              className="col-span-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
            >
              Add to Retirement Plan
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {annuities.length === 0 && !showAdd && (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              No annuities detected in plan.
            </p>
          </div>
        )}

        {annuities.map((ann) => {
          const isDIA = (ann.startAge || 65) > currentAge;
          const isStarted = (ann.startAge || 65) <= currentAge;

          return (
            <div
              key={ann.id}
              className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{isDIA ? '⏳' : '🏦'}</span>
                    <input
                      type="text"
                      value={ann.name}
                      onChange={(e) => handleUpdate(ann.id, 'name', e.target.value)}
                      className="bg-transparent text-xs font-black text-gray-800 dark:text-gray-100 outline-none"
                    />
                  </div>
                  <p className="text-[9px] font-black text-indigo-500 uppercase ml-7">
                    {isDIA ? 'Deferred Income (DIA)' : 'Immediate Income (SPIA)'}
                    {isStarted && ' • PAYOUT ACTIVE'}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(ann.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 ml-7">
                <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">
                    Monthly
                  </label>
                  <SmartInput
                    value={ann.monthlyPayout}
                    onChange={(val) => handleUpdate(ann.id, 'monthlyPayout', val)}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg px-2 py-1 text-[11px] font-black text-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">
                    Starts
                  </label>
                  <SmartInput
                    value={ann.startAge}
                    onChange={(val) => handleUpdate(ann.id, 'startAge', val)}
                    className="w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">
                    Options
                  </label>
                  <div className="flex items-center gap-2 h-7 px-2">
                    <button
                      onClick={() =>
                        handleUpdate(ann.id, 'inflationAdjusted', !ann.inflationAdjusted)
                      }
                      className={`p-1 rounded-md transition-all ${ann.inflationAdjusted ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-300'}`}
                      title="Inflation Adjustment (COLA)"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </button>
                    {ann.inflationAdjusted && (
                      <div className="flex items-center gap-1">
                        <SmartInput
                          value={ann.growthRate || 2.5}
                          onChange={(val) => handleUpdate(ann.id, 'growthRate', val)}
                          className="w-8 bg-transparent text-[9px] font-black h-4 p-0 focus:ring-0 border-none"
                        />
                        <span className="text-[9px] font-bold text-indigo-400">%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
