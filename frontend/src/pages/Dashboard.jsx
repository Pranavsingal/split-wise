import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';
import FriendsList from '../components/FriendsList';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import RecurringExpenses from '../components/RecurringExpenses';
import { Plus, CheckCircle2, TrendingUp, TrendingDown, RefreshCcw, History, ArrowRight, BarChart3, CalendarClock, Wallet, LogOut, Menu, X } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [prefillPayee, setPrefillPayee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('balances');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balancesRes, settlementsRes] = await Promise.all([
        api.get('/expenses/balances'),
        api.get('/expenses/settlements')
      ]);
      setBalances(balancesRes.data);
      setSettlements(settlementsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePayClick = (payeeId) => {
    setPrefillPayee(payeeId);
    setIsSettleUpOpen(true);
  };

  const handleOpenSettleUp = () => {
    setPrefillPayee(null);
    setIsSettleUpOpen(true);
  };

  // Calculate totals
  const totalOwed = balances.filter(b => b.amount < 0).reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
  const totalOwedToYou = balances.filter(b => b.amount > 0).reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalOwedToYou - totalOwed;

  const tabs = [
    { id: 'balances', label: 'Balances', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'recurring', label: 'Recurring', icon: CalendarClock },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                A
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Aura<span className="text-primary-600">Split</span></h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-6">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-700 font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 font-medium">{user?.name}</span>
            </div>
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2 text-gray-500 hover:text-gray-700 py-2 text-sm font-medium transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h2>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 sm:px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-primary-500/20 text-sm sm:text-base"
            >
              <Plus size={18} />
              <span className="hidden xs:inline">Add</span> Expense
            </button>
            <button 
              onClick={handleOpenSettleUp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 sm:px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm text-sm sm:text-base"
            >
              <CheckCircle2 size={18} className="text-teal-500" />
              Settle up
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 sm:flex-none ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'balances' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Main Balances Section */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total balance</p>
                  <p className={`text-xl sm:text-2xl font-bold ${netBalance > 0 ? 'text-primary-600' : netBalance < 0 ? 'text-orange-500' : 'text-gray-900'}`}>
                    {netBalance > 0 ? '+' : ''}₹{netBalance.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">You owe</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-500">₹{totalOwed.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">You are owed</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary-600">₹{totalOwedToYou.toFixed(2)}</p>
                </div>
              </div>

              {/* Detailed Balances List */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Your Balances</h3>
                  <button onClick={fetchData} className="text-gray-400 hover:text-primary-600 transition-colors p-1">
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
                
                <div className="divide-y divide-gray-50">
                  {balances.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                      <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                        <CheckCircle2 size={32} className="text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">You're all settled up!</p>
                    </div>
                  ) : (
                    balances.map((balance, idx) => (
                      <div key={idx} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-base sm:text-lg shrink-0">
                            {balance.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{balance.user.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{balance.user.email}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1 sm:gap-2 shrink-0 ml-2">
                          <div className={`flex items-center gap-1 sm:gap-1.5 font-bold text-base sm:text-lg ${balance.amount > 0 ? 'text-primary-600' : 'text-orange-500'}`}>
                            {balance.amount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            ₹{Math.abs(balance.amount).toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-500">
                              {balance.amount > 0 ? 'owes you' : 'you owe'}
                            </span>
                            {/* ONLY SHOW PAY BUTTON IF YOU OWE THEM */}
                            {balance.amount < 0 && (
                              <button 
                                onClick={() => handlePayClick(balance.user._id)}
                                className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-1 px-2.5 sm:px-3 rounded-full shadow-sm transition-colors"
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payment Summary / Settlement History */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
                  <History size={18} className="text-gray-400" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Payment Summary</h3>
                </div>
                
                <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                  {settlements.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                      <p className="text-sm">No payment history found.</p>
                    </div>
                  ) : (
                    settlements.map((settlement) => {
                      const isPayer = settlement.payer._id === user._id;
                      return (
                        <div key={settlement._id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isPayer ? 'bg-orange-100 text-orange-600' : 'bg-primary-100 text-primary-600'}`}>
                              {isPayer ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 flex items-center gap-1 sm:gap-2">
                                <span className="truncate">{isPayer ? 'You' : settlement.payer.name}</span>
                                <ArrowRight size={12} className="text-gray-400 shrink-0" />
                                <span className="truncate">{isPayer ? settlement.payee.name : 'You'}</span>
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(settlement.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className={`font-bold shrink-0 ml-2 ${isPayer ? 'text-gray-900' : 'text-primary-600'}`}>
                            ₹{settlement.amount.toFixed(2)}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 lg:h-[600px] lg:sticky lg:top-24">
              <FriendsList />
            </div>

          </div>
        )}

        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'recurring' && <RecurringExpenses />}

      </main>

      {/* Modals */}
      <AddExpenseModal 
        isOpen={isAddExpenseOpen} 
        onClose={() => setIsAddExpenseOpen(false)} 
        onExpenseAdded={fetchData} 
      />
      
      <SettleUpModal 
        isOpen={isSettleUpOpen} 
        onClose={() => setIsSettleUpOpen(false)} 
        onSettled={fetchData} 
        prefillPayee={prefillPayee}
      />
    </div>
  );
};

export default Dashboard;
