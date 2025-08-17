import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, LabelList,
  ResponsiveContainer, AreaChart, Area, CartesianGrid
} from 'recharts';
import { format, subMonths, eachDayOfInterval, isSameDay } from 'date-fns';
import TrendChart from '../components/TrendChart';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Modern color palette
const COLORS = {
  income: '#10B981',
  expense: '#EF4444',
  balance: '#3B82F6',
  background: '#F9FAFB',
  text: '#111827',
  categories: [
    '#10B981', '#EF4444', '#3B82F6', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'
  ]
};

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState('30days');
  const [deleteId, setDeleteId] = useState(null);

  // Enhanced data calculations
  const { income, expenses, balance, categoryData, monthlyTrends, topTransactions } = useMemo(() => {
    if (loading || !filtered.length) {
      return {
        income: 0,
        expenses: 0,
        balance: 0,
        categoryData: [],
        monthlyTrends: [],
        topTransactions: []
      };
    }
    
    // Calculate income, expenses, balance
    const income = filtered.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = filtered.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
    const balance = income + expenses;

    // Enhanced category analysis
    const categoryMap = filtered
      .filter(tx => tx.amount < 0)
      .reduce((acc, tx) => {
        if (!acc[tx.category]) {
          acc[tx.category] = { amount: 0, count: 0, percentage: 0 };
        }
        acc[tx.category].amount += Math.abs(tx.amount);
        acc[tx.category].count++;
        return acc;
      }, {});

    // Calculate percentages
    const totalExpenses = Math.abs(expenses);
    const categoryData = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses * 100) : 0,
      color: COLORS.categories[Object.keys(categoryMap).indexOf(category) % COLORS.categories.length]
    })).sort((a, b) => b.amount - a.amount);

    // Monthly trend data
    const now = new Date();
    const startDate = subMonths(now, 3);
    const dateRange = eachDayOfInterval({ start: startDate, end: now });
    
    const monthlyTrends = dateRange.map(date => {
      const dayTransactions = filtered.filter(t => 
        isSameDay(new Date(t.date), date)
      );
      const dayIncome = dayTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const dayExpenses = dayTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
      
      return {
        date: format(date, 'MMM dd'),
        income: dayIncome,
        expenses: Math.abs(dayExpenses),
        balance: dayIncome + dayExpenses
      };
    });

    // Top 5 transactions (highest amounts)
    const topTransactions = [...filtered]
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5);

    return { income, expenses, balance, categoryData, monthlyTrends, topTransactions };
  }, [filtered, loading]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchTransactions();
  }, [token]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transactions`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) throw new Error('Failed to load transactions');
      
      const data = await res.json();
      setTransactions(data);
      setFiltered(data);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      if (err.message.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredTxs = [...transactions];
    
    // Text search
    if (search) {
      filteredTxs = filteredTxs.filter(t =>
        t.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Category filter
    if (categoryFilter) {
      filteredTxs = filteredTxs.filter(t => t.category === categoryFilter);
    }
    
    // Date range filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = subMonths(new Date(), days / 30);
      filteredTxs = filteredTxs.filter(t => new Date(t.date) >= cutoffDate);
    }
    
    setFiltered(filteredTxs);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete transaction');

      setDeleteId(null);
      await fetchTransactions();
    } catch (err) {
      alert(err.message);
    }
  };

  // Enhanced summary cards component with Tailwind
  const SummaryCard = ({ title, value, type }) => {
    const bgColor = {
      income: 'bg-green-50',
      expense: 'bg-red-50',
      balance: 'bg-blue-50'
    }[type];
    
    const textColor = {
      income: 'text-green-600',
      expense: 'text-red-600',
      balance: 'text-blue-600'
    }[type];
    
    const borderColor = {
      income: 'border-green-200',
      expense: 'border-red-200',
      balance: 'border-blue-200'
    }[type];
    
    return (
      <div className={`${bgColor} ${borderColor} rounded-xl border p-6 shadow-sm transition-all hover:shadow-md`}>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-2 text-3xl font-semibold ${textColor}`}>
          ${Math.abs(value).toFixed(2)}
        </p>
        {type === 'balance' && (
          <div className="mt-2 flex items-center text-sm">
            {value >= 0 ? (
              <span className="text-green-500">↑</span>
            ) : (
              <span className="text-red-500">↓</span>
            )}
            <span className="ml-1 text-gray-500">from last month</span>
          </div>
        )}
      </div>
    );
  };

  if (error) return (
    <div className="p-4 text-red-500 bg-red-50 rounded-lg max-w-4xl mx-auto mt-8">
      {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Financial Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user?.name || 'User'}! Here's your financial overview.</p>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100">
              <span className="text-indigo-600 font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* Enhanced Summary Section */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">💰 Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <>
                <Skeleton height={120} borderRadius={12} />
                <Skeleton height={120} borderRadius={12} />
                <Skeleton height={120} borderRadius={12} />
              </>
            ) : (
              <>
                <SummaryCard title="Income" value={income} type="income" />
                <SummaryCard title="Expenses" value={expenses} type="expense" />
                <SummaryCard title="Balance" value={balance} type="balance" />
              </>
            )}
          </div>
        </section>

        {/* Enhanced Filter Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">🔍 Filter Transactions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyUp={() => applyFilters()}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  applyFilters();
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              >
                <option value="">All Categories</option>
                {[...new Set(transactions.map(tx => tx.category))].map((cat, i) => (
                  <option key={i} value={cat}>{cat || 'Uncategorized'}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  applyFilters();
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 3 Months</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </section>

        {/* Enhanced Charts Section */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Financial Insights</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income vs Expenses Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-md font-medium text-gray-900 mb-4">Income vs Expenses</h3>
              {loading ? (
                <Skeleton height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <Pie
                      data={[
                        { name: 'Income', value: income },
                        { name: 'Expenses', value: Math.abs(expenses) },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      animationDuration={500}
                      label={({ name, percent }) => (
                        <text 
                          x={0} 
                          y={0} 
                          fill="#333" 
                          textAnchor="middle" 
                          dominantBaseline="central"
                        >
                          {`${name}: ${(percent * 100).toFixed(0)}%`}
                        </text>
                      )}
                      labelLine={false}
                    >
                      <Cell fill={COLORS.income} />
                      <Cell fill={COLORS.expense} />
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
                      contentStyle={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend 
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Expenses by Category */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-md font-medium text-gray-900 mb-4">Expense Breakdown</h3>
              {loading ? (
                <Skeleton height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={categoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={80} />
                    <Tooltip 
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                    <Bar dataKey="amount" name="Amount" animationDuration={500}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList 
                        dataKey="amount" 
                        position="right" 
                        formatter={(val) => `$${val.toFixed(2)}`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Monthly Trends */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-md font-medium text-gray-900 mb-4">90-Day Trend</h3>
              {loading ? (
                <Skeleton height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={monthlyTrends}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stackId="1"
                      stroke={COLORS.income}
                      fill={COLORS.income}
                      fillOpacity={0.2}
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stackId="1"
                      stroke={COLORS.expense}
                      fill={COLORS.expense}
                      fillOpacity={0.2}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* Top Transactions Section */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">🏆 Top Transactions</h2>
          {loading ? (
            <Skeleton count={5} height={60} style={{ marginBottom: '10px' }} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topTransactions?.map((tx, index) => (
                <div key={tx._id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900 line-clamp-1">{tx.description}</h4>
                        <p className="text-xs text-gray-500">{format(new Date(tx.date), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${
                      tx.amount < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ${Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Transactions Table */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">📄 Recent Transactions</h2>
            <Link 
              to="/add-transaction" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ➕ Add Transaction
            </Link>
          </div>
          
          {loading ? (
            <Skeleton count={5} height={60} style={{ marginBottom: '10px' }} />
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.slice(0, 10).map(tx => (
                      <tr key={tx._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tx.description}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          tx.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ${tx.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${categoryData?.find(c => c.category === tx.category)?.color || '#ccc'}20`,
                              color: categoryData?.find(c => c.category === tx.category)?.color || '#666'
                            }}
                          >
                            {tx.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(tx.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => setDeleteId(tx._id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length > 10 && (
                <div className="px-6 py-4 bg-gray-50 text-right text-sm">
                  <Link 
                    to="/transactions" 
                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    View All Transactions →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this transaction? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}