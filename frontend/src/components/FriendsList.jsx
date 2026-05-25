import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserPlus } from 'lucide-react';

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data } = await api.get('/friends');
      setFriends(data);
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await api.post('/friends', { friendEmail: email });
      setEmail('');
      setSuccess('Friend added successfully!');
      fetchFriends();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 h-auto lg:h-full flex flex-col">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
        <UserPlus className="text-primary-600" size={20} />
        Friends
      </h3>

      <form onSubmit={handleAddFriend} className="mb-4 sm:mb-6 relative">
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Friend's email"
            required
            className="flex-1 px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 sm:py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
          >
            Add
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        {success && <p className="text-primary-600 text-xs mt-2">{success}</p>}
      </form>

      <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-2 sm:space-y-3 max-h-60 lg:max-h-none">
        {friends.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-400">
            <p className="text-sm">You haven't added any friends yet.</p>
          </div>
        ) : (
          friends.map(friend => (
            <div key={friend._id} className="flex items-center gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl border border-gray-100/50 transition-all hover:border-gray-200">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                {friend.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{friend.name}</p>
                <p className="text-xs text-gray-500 truncate">{friend.email}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendsList;
