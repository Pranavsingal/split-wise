import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { X, RefreshCcw } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Rent', 'Health', 'Travel', 'Other'];

const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded }) => {
  const { user } = useContext(AuthContext);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [splitType, setSplitType] = useState('EQUAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [percentages, setPercentages] = useState({});
  const [exactAmounts, setExactAmounts] = useState({});
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      // Reset form
      setDescription('');
      setAmount('');
      setCategory('Other');
      setSelectedFriends([]);
      setSplitType('EQUAL');
      setPercentages({});
      setExactAmounts({});
      setIsRecurring(false);
      setFrequency('monthly');
      setError('');
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    try {
      const { data } = await api.get('/friends');
      setFriends(data);
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const handleFriendSelection = (friendId) => {
    setSelectedFriends((prev) => 
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description) return setError('Please fill all fields');
    if (selectedFriends.length === 0) return setError('Select at least one friend to split with');

    const totalAmount = parseFloat(amount);
    
    // User Info (current user is the payer)
    const currentUserId = user?._id;

    const allInvolved = [currentUserId, ...selectedFriends];
    let splits = [];

    if (splitType === 'EQUAL') {
      const splitAmount = totalAmount / allInvolved.length;
      splits = allInvolved.map(userId => ({
        user: userId,
        amountOwed: Number(splitAmount.toFixed(2)),
        splitType: 'EQUAL'
      }));
    } else if (splitType === 'PERCENTAGE') {
      let totalPercentage = 0;
      splits = allInvolved.map(userId => {
        const pct = parseFloat(percentages[userId] || 0);
        totalPercentage += pct;
        return {
          user: userId,
          amountOwed: Number(((totalAmount * pct) / 100).toFixed(2)),
          splitType: 'PERCENTAGE',
          percentage: pct
        };
      });
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return setError('Percentages must add up to 100%');
      }
    } else if (splitType === 'EXACT') {
      let totalExact = 0;
      splits = allInvolved.map(userId => {
        const exact = parseFloat(exactAmounts[userId] || 0);
        totalExact += exact;
        return {
          user: userId,
          amountOwed: Number(exact.toFixed(2)),
          splitType: 'EXACT'
        };
      });
      if (Math.abs(totalExact - totalAmount) > 0.01) {
        return setError('Exact amounts must add up to the total amount');
      }
    }

    // Fix rounding errors by adjusting the current user's split
    const currentTotal = splits.reduce((acc, curr) => acc + curr.amountOwed, 0);
    if (currentTotal !== totalAmount) {
       const diff = totalAmount - currentTotal;
       splits[0].amountOwed += diff; // Just add diff to first user to balance it exactly
    }

    try {
      setLoading(true);

      if (isRecurring) {
        // Create recurring expense
        await api.post('/recurring', {
          description,
          amount: totalAmount,
          category,
          splits,
          frequency,
        });
      } else {
        // Create one-time expense
        await api.post('/expenses', {
          description,
          amount: totalAmount,
          category,
          payer: currentUserId,
          splits
        });
      }

      setLoading(false);
      onExpenseAdded();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to add expense');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto transform transition-all">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Add an Expense</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          
          {/* Description + Amount */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="Dinner, Taxi, etc."
                className="w-full px-4 py-2.5 sm:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-base sm:text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2.5 sm:py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-base sm:text-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    category === cat
                      ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Split with */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Split with</label>
            <div className="max-h-32 overflow-y-auto space-y-1 p-2 border border-gray-100 rounded-xl bg-gray-50/50">
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No friends added yet.</p>
              ) : (
                friends.map((friend) => (
                  <label key={friend._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm">
                    <input
                      type="checkbox"
                      className="w-5 h-5 sm:w-4 sm:h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      checked={selectedFriends.includes(friend._id)}
                      onChange={() => handleFriendSelection(friend._id)}
                    />
                    <span className="text-gray-800 font-medium">{friend.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {selectedFriends.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50">
                {['EQUAL', 'PERCENTAGE', 'EXACT'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`flex-1 py-2 sm:py-1.5 text-sm font-medium rounded-md transition-all ${
                      splitType === type ? 'bg-white text-primary-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setSplitType(type)}
                  >
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {(splitType === 'PERCENTAGE' || splitType === 'EXACT') && (
                <div className="space-y-3 bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
                  {/* Current User */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">You</span>
                    <div className="w-24">
                      <input
                        type="number"
                        placeholder={splitType === 'PERCENTAGE' ? "%" : "₹"}
                        className="w-full px-3 py-2 sm:py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        value={splitType === 'PERCENTAGE' ? (percentages[user?._id] || '') : (exactAmounts[user?._id] || '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          const myId = user?._id;
                          if (splitType === 'PERCENTAGE') setPercentages(prev => ({...prev, [myId]: val}));
                          else setExactAmounts(prev => ({...prev, [myId]: val}));
                        }}
                      />
                    </div>
                  </div>
                  {/* Friends */}
                  {selectedFriends.map(friendId => {
                    const friend = friends.find(f => f._id === friendId);
                    return (
                      <div key={friendId} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{friend?.name}</span>
                        <div className="w-24">
                          <input
                            type="number"
                            placeholder={splitType === 'PERCENTAGE' ? "%" : "₹"}
                            className="w-full px-3 py-2 sm:py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            value={splitType === 'PERCENTAGE' ? (percentages[friendId] || '') : (exactAmounts[friendId] || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (splitType === 'PERCENTAGE') setPercentages(prev => ({...prev, [friendId]: val}));
                              else setExactAmounts(prev => ({...prev, [friendId]: val}));
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Recurring Toggle */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 sm:p-4 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <RefreshCcw size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Make Recurring</span>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 transition-colors"></div>
                <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
              </div>
            </label>

            {isRecurring && (
              <div className="flex gap-2">
                {['daily', 'weekly', 'monthly'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`flex-1 py-2 sm:py-1.5 text-sm font-medium rounded-lg transition-all border ${
                      frequency === freq
                        ? 'bg-primary-50 text-primary-700 border-primary-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 sm:pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 sm:py-2.5 px-4 rounded-xl transition duration-200 shadow-sm shadow-primary-600/20 disabled:opacity-70 disabled:cursor-not-allowed text-base sm:text-sm"
            >
              {loading ? 'Saving...' : isRecurring ? 'Save Recurring Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
