/**
 * AssetInputForm - Form component for inputting asset balances
 *
 * Handles all asset types: Traditional, Roth, HSA, Brokerage, Crypto
 *
 * @module AssetInputForm
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { usePlan } from '../contexts/PlanContext';

export default function AssetInputForm() {
  const { planData, updatePlan } = usePlan();
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      traditionalClient: planData.assets?.traditional?.client || 0,
      traditionalSpouse: planData.assets?.traditional?.spouse || 0,
      rothClient: planData.assets?.roth?.client || 0,
      rothSpouse: planData.assets?.roth?.spouse || 0,
      hsaClient: planData.assets?.hsa?.client || 0,
      hsaSpouse: planData.assets?.hsa?.spouse || 0,
      brokerageJoint: planData.assets?.brokerage?.joint || 0,
      brokerageBasis: planData.assets?.brokerageBasis?.joint || 0,
      btcQty: planData.assets?.crypto?.btc?.quantity || 0,
      btcPrice: planData.assets?.crypto?.btc?.price || 0,
      ethQty: planData.assets?.crypto?.eth?.quantity || 0,
      ethPrice: planData.assets?.crypto?.eth?.price || 0,
      solQty: planData.assets?.crypto?.sol?.quantity || 0,
      solPrice: planData.assets?.crypto?.sol?.price || 0
    }
  });

  const onSubmit = (data) => {
    updatePlan({
      assets: {
        traditional: {
          client: parseFloat(data.traditionalClient) || 0,
          spouse: parseFloat(data.traditionalSpouse) || 0
        },
        roth: {
          client: parseFloat(data.rothClient) || 0,
          spouse: parseFloat(data.rothSpouse) || 0
        },
        hsa: {
          client: parseFloat(data.hsaClient) || 0,
          spouse: parseFloat(data.hsaSpouse) || 0
        },
        brokerage: {
          joint: parseFloat(data.brokerageJoint) || 0
        },
        brokerageBasis: {
          joint: parseFloat(data.brokerageBasis) || 0
        },
        crypto: {
          btc: { quantity: parseFloat(data.btcQty) || 0, price: parseFloat(data.btcPrice) || 0, owner: 'client' },
          eth: { quantity: parseFloat(data.ethQty) || 0, price: parseFloat(data.ethPrice) || 0, owner: 'client' },
          sol: { quantity: parseFloat(data.solQty) || 0, price: parseFloat(data.solPrice) || 0, owner: 'joint' }
        }
      }
    });
  };

  // Sync form with planData updates (e.g., auto-fetched crypto prices)
  useEffect(() => {
    if (planData?.assets?.crypto) {
      const crypto = planData.assets.crypto;
      // Only update if values differ to avoid loops, though setValue is safe
      if (crypto.btc?.price) setValue('btcPrice', crypto.btc.price);
      if (crypto.eth?.price) setValue('ethPrice', crypto.eth.price);
      if (crypto.sol?.price) setValue('solPrice', crypto.sol.price);
    }
  }, [planData, setValue]);

  // Watch crypto prices for live calculation
  const btcQty = watch('btcQty');
  const btcPrice = watch('btcPrice');
  const ethQty = watch('ethQty');
  const ethPrice = watch('ethPrice');
  const solQty = watch('solQty');
  const solPrice = watch('solPrice');

  const cryptoTotal = (btcQty || 0) * (btcPrice || 0) +
    (ethQty || 0) * (ethPrice || 0) +
    (solQty || 0) * (solPrice || 0);

  // Fetch live crypto prices
  const fetchCryptoPrices = async () => {
    try {
      const [btcRes, ethRes, solRes] = await Promise.all([
        fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot'),
        fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot'),
        fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot')
      ]);

      const btcData = await btcRes.json();
      const ethData = await ethRes.json();
      const solData = await solRes.json();

      if (btcData?.data?.amount) setValue('btcPrice', Math.round(parseFloat(btcData.data.amount)));
      if (ethData?.data?.amount) setValue('ethPrice', Math.round(parseFloat(ethData.data.amount)));
      if (solData?.data?.amount) setValue('solPrice', Math.round(parseFloat(solData.data.amount)));

      // Trigger form update
      handleSubmit(onSubmit)();
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] text-left">
          <thead>
            <tr className="text-gray-500 uppercase tracking-wider">
              <th className="pb-2 font-medium">Account</th>
              <th className="pb-2 font-medium">Primary ($)</th>
              <th className="pb-2 font-medium">Spouse ($)</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            <tr>
              <td className="py-1 font-medium text-gray-700 dark:text-gray-300">Trad 401k</td>
              <td className="py-1 pr-1">
                <input
                  type="number"
                  {...register('traditionalClient', { valueAsNumber: true })}
                  className="w-full px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  {...register('traditionalSpouse', { valueAsNumber: true })}
                  className="w-full px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </td>
            </tr>
            <tr>
              <td className="py-1 font-medium text-gray-700 dark:text-gray-300">Roth IRA</td>
              <td className="py-1 pr-1">
                <input
                  type="number"
                  {...register('rothClient', { valueAsNumber: true })}
                  className="w-full px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  {...register('rothSpouse', { valueAsNumber: true })}
                  className="w-full px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </td>
            </tr>
            <tr>
              <td className="py-1 font-medium text-gray-700 dark:text-gray-300">Start HSA</td>
              <td className="py-1 pr-1">
                <input
                  type="number"
                  {...register('hsaClient', { valueAsNumber: true })}
                  className="w-full px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  {...register('hsaSpouse', { valueAsNumber: true })}
                  className="w-full px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Joint Brokerage</label>
          <input
            type="number"
            {...register('brokerageJoint', { valueAsNumber: true })}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Cost Basis (Brok)</label>
          <input
            type="number"
            {...register('brokerageBasis', { valueAsNumber: true })}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Crypto Holdings</h3>
          <button
            type="button"
            onClick={fetchCryptoPrices}
            className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors uppercase font-bold"
          >
            ⚡ Live Prices
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[10px] text-left">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider">
                <th className="pb-1 font-medium">Asset</th>
                <th className="pb-1 font-medium">Qty</th>
                <th className="pb-1 font-medium text-right">Price</th>
                <th className="pb-1 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="space-y-1">
              {['btc', 'eth', 'sol'].map((id) => (
                <tr key={id}>
                  <td className="py-1 font-bold text-gray-400 uppercase">{id}</td>
                  <td className="py-1 pr-1">
                    <input
                      type="number"
                      {...register(`${id}Qty`, { valueAsNumber: true })}
                      className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      step="any"
                    />
                  </td>
                  <td className="py-1 pr-1">
                    <input
                      type="number"
                      {...register(`${id}Price`, { valueAsNumber: true })}
                      className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-right"
                      step="any"
                    />
                  </td>
                  <td className="py-1 text-right font-medium text-gray-600 dark:text-gray-400">
                    ${((watch(`${id}Qty`) || 0) * (watch(`${id}Price`) || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 pt-1 border-t border-gray-50 dark:border-gray-900 flex justify-between items-center text-[10px]">
          <span className="text-gray-500 uppercase">Crypto Total</span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            ${cryptoTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-2 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-bold uppercase tracking-wider"
      >
        Update Assets
      </button>
    </form>
  );
}
