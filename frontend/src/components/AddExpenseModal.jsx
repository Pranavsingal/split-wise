import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { X } from 'lucide-react';

const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [splitType, setSplitType] = useState('EQUAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [percentages, setPercentages] = useState({});
  const [exactAmounts, setExactAmounts] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      // Reset form
      setDescription('');
      setAmount('');
      setSelectedFriends([]);
      setSplitType('EQUAL');
      setPercentages({});
      setExactAmounts({});
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
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const currentUserId = userInfo._id;

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
        // Assume current user pays their own share if not explicitly set (or we can just require all percentages)
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
      await api.post('/expenses', {
        description,
        amount: totalAmount,
        payer: currentUserId,
        splits
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">Add an Expense</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="Dinner, Taxi, etc."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Split with</label>
            <div className="max-h-32 overflow-y-auto space-y-2 p-2 border border-gray-100 rounded-xl bg-gray-50/50">
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No friends added yet.</p>
              ) : (
                friends.map((friend) => (
                  <label key={friend._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
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
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                      splitType === type ? 'bg-white text-primary-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setSplitType(type)}
                  >
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {(splitType === 'PERCENTAGE' || splitType === 'EXACT') && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {/* Current User */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">You</span>
                    <div className="w-24">
                      <input
                        type="number"
                        placeholder={splitType === 'PERCENTAGE' ? "%" : "₹"}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        value={splitType === 'PERCENTAGE' ? (percentages[JSON.parse(localStorage.getItem('userInfo'))._id] || '') : (exactAmounts[JSON.parse(localStorage.getItem('userInfo'))._id] || '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          const myId = JSON.parse(localStorage.getItem('userInfo'))._id;
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
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition duration-200 shadow-sm shadow-primary-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
