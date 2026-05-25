import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { RefreshCcw, Pause, Play, Trash2, Clock, CalendarClock } from 'lucide-react';

const FREQUENCY_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const FREQUENCY_COLORS = {
  daily: 'bg-blue-50 text-blue-700 border-blue-200',
  weekly: 'bg-purple-50 text-purple-700 border-purple-200',
  monthly: 'bg-orange-50 text-orange-700 border-orange-200',
};

const RecurringExpenses = () => {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/recurring');
      setRecurring(data);
    } catch (error) {
      console.error('Error fetching recurring expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.put(`/recurring/${id}/toggle`);
      fetchRecurring();
    } catch (error) {
      console.error('Error toggling recurring expense:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring expense?')) return;
    try {
      await api.delete(`/recurring/${id}`);
      fetchRecurring();
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-3 bg-gray-100 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Recurring Expenses</h3>
          <p className="text-sm text-gray-500">Auto-created on schedule</p>
        </div>
        <button
          onClick={fetchRecurring}
          className="text-gray-400 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      {recurring.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <CalendarClock size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No recurring expenses</p>
          <p className="text-gray-400 text-sm mt-1">
            Add an expense and toggle "Make Recurring" to set one up.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurring.map((item) => (
            <div
              key={item._id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                item.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{item.description}</h4>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${FREQUENCY_COLORS[item.frequency]}`}>
                      <Clock size={10} />
                      {FREQUENCY_LABELS[item.frequency]}
                    </span>
                    {!item.isActive && (
                      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                        Paused
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="font-bold text-gray-900 text-lg">₹{item.amount.toFixed(2)}</span>
                    <span>•</span>
                    <span>{item.category}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">
                      Next: {new Date(item.nextRunDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="sm:hidden text-xs text-gray-400 mt-1">
                    Next: {new Date(item.nextRunDate).toLocaleDateString()}
                  </div>
                  {item.splits && item.splits.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.splits.map((split, idx) => (
                        <span key={idx} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">
                          {split.user?.name || 'You'} — ₹{split.amountOwed.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(item._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.isActive
                        ? 'text-orange-500 hover:bg-orange-50'
                        : 'text-primary-600 hover:bg-primary-50'
                    }`}
                    title={item.isActive ? 'Pause' : 'Resume'}
                  >
                    {item.isActive ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringExpenses;
