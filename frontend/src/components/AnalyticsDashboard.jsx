import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, BarChart3, Tag } from 'lucide-react';

const CATEGORY_COLORS = {
  Food: '#22c55e',
  Transport: '#3b82f6',
  Entertainment: '#a855f7',
  Shopping: '#f97316',
  Utilities: '#64748b',
  Rent: '#ef4444',
  Health: '#14b8a6',
  Travel: '#eab308',
  Other: '#94a3b8',
};

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/expenses/analytics');
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-48 bg-gray-100 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">No analytics data available yet.</p>
        <p className="text-gray-400 text-sm mt-1">Start adding expenses to see your spending insights.</p>
      </div>
    );
  }

  const { monthlySpending, categoryBreakdown, summary } = analytics;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-primary-600 font-bold">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="font-bold" style={{ color: payload[0].payload.fill }}>₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <DollarSign size={16} className="text-primary-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-500">Total Spent</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">₹{summary.totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-500">Avg/Month</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">₹{summary.avgPerMonth.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Tag size={16} className="text-purple-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-500">Top Category</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{summary.topCategory}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <BarChart3 size={16} className="text-orange-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-500">Total Expenses</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.totalExpenses}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Monthly Spending</h3>
            <p className="text-sm text-gray-500">Last 6 months</p>
          </div>
          <div className="p-4 sm:p-6">
            {monthlySpending.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlySpending} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="total"
                    fill="#22c55e"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Category Breakdown</h3>
            <p className="text-sm text-gray-500">All time spending by category</p>
          </div>
          <div className="p-4 sm:p-6">
            {categoryBreakdown.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No categories yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="category"
                    stroke="none"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={CATEGORY_COLORS[entry.category] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-sm text-gray-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
