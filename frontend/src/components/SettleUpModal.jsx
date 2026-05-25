import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { X } from 'lucide-react';

const SettleUpModal = ({ isOpen, onClose, onSettled, prefillPayee }) => {
  const [balances, setBalances] = useState([]);
  const [selectedPayee, setSelectedPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchBalances();
      setError('');
    }
  }, [isOpen, prefillPayee]);

  const fetchBalances = async () => {
    try {
      const { data } = await api.get('/expenses/balances');
      const oweBalances = data.filter(b => b.amount < 0);
      setBalances(oweBalances);
      
      // Handle prefill
      if (prefillPayee) {
        setSelectedPayee(prefillPayee);
        const balance = oweBalances.find(b => b.user._id === prefillPayee);
        if (balance) {
          setAmount(Math.abs(balance.amount).toString());
        }
      } else {
        setSelectedPayee('');
        setAmount('');
      }
    } catch (err) {
      console.error('Error fetching balances:', err);
    }
  };



  const handlePayeeChange = (e) => {
    const payeeId = e.target.value;
    setSelectedPayee(payeeId);
    
    // Auto-fill amount
    const balance = balances.find(b => b.user._id === payeeId);
    if (balance) {
      setAmount(Math.abs(balance.amount).toString());
    } else {
      setAmount('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayee || !amount) return setError('Please select a person and enter an amount');

    try {
      setLoading(true);
      await api.post('/expenses/settle', {
        payee: selectedPayee,
        amount: parseFloat(amount),
      });
      setLoading(false);
      onSettled();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to settle up');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden transform transition-all">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Settle Up</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          
          {balances.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-gray-400 mb-2">🎉</div>
              <p className="text-gray-600 font-medium">You don't owe anyone!</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pay to</label>
                <select
                  className="w-full px-4 py-2.5 sm:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white outline-none text-base sm:text-sm"
                  value={selectedPayee}
                  onChange={handlePayeeChange}
                >
                  <option value="">Select a friend...</option>
                  {balances.map(b => (
                    <option key={b.user._id} value={b.user._id}>
                      {b.user.name} (You owe ₹{Math.abs(b.amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2.5 sm:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base sm:text-sm"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 sm:pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 sm:py-2.5 px-4 rounded-xl transition duration-200 shadow-sm shadow-primary-600/20 disabled:opacity-70 disabled:cursor-not-allowed text-base sm:text-sm"
                >
                  {loading ? 'Settling...' : 'Mark as Paid'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default SettleUpModal;
