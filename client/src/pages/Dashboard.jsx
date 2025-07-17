import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Dashboard.module.css';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, LabelList,
  ResponsiveContainer, AreaChart, Area, CartesianGrid
} from 'recharts';
import { format, subMonths, eachDayOfInterval, isSameDay } from 'date-fns';
import TrendChart from '../components/TrendChart';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import BudgetTracker from '../components/BudgetTracker';
import GoalPlanner from '../components/GoalPlanner';
import HealthScore from '../components/HealthScore';
import NetWorthTracker from '../components/NetWorthTracker';
import SuccessMeter from '../components/SuccessMeter';

// Modern color palette
const COLORS = {
  income: '#00C49F',
  expense: '#FF6B6B',
  balance: '#0088FE',
  background: '#f8f9fa',
  text: '#212529',
  categories: [
    '#00C49F', '#FF6B6B', '#0088FE', '#FFBB28', 
    '#845EC2', '#FF6F91', '#FFC75F', '#D65DB1'
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

  // Enhanced summary cards component
  const SummaryCard = ({ title, value, type }) => (
    <div className={`${styles.card} ${styles.summaryCard} ${styles[type]}`}>
      <h3>{title}</h3>
      <p className={styles.summaryValue}>${Math.abs(value).toFixed(2)}</p>
      {type === 'balance' && (
        <div className={styles.trendIndicator}>
          {value >= 0 ? '↑' : '↓'} {type !== 'balance' ? 'from last month' : ''}
        </div>
      )}
    </div>
  );

  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1>💰 Financial Dashboard</h1>
          <p className={styles.welcome}>Welcome back, {user?.name || 'User'}! Here's your financial overview.</p>
        </div>
        <div className={styles.profileInfo}>
          <span className={styles.profileInitial}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </header>

      {/* Enhanced Summary Section */}
      <section className={styles.summary}>
        <h2 className={styles.sectionTitle}>💰 Financial Summary</h2>
        <div className={styles.summaryCards}>
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
      <section className={styles.filterSection}>
        <h2 className={styles.sectionTitle}>🔍 Filter Transactions</h2>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label>Search</label>
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyUp={() => applyFilters()}
              className={styles.filterInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                applyFilters();
              }}
              className={styles.filterSelect}
            >
              <option value="">All Categories</option>
              {[...new Set(transactions.map(tx => tx.category))].map((cat, i) => (
                <option key={i} value={cat}>{cat || 'Uncategorized'}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                applyFilters();
              }}
              className={styles.filterSelect}
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
      <section className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>📊 Financial Insights</h2>
        
        <div className={styles.chartGrid}>
          {/* Income vs Expenses Pie Chart */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Income vs Expenses</h3>
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
</ResponsiveContainer>)}
          </div>

          {/* Expenses by Category */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Expense Breakdown</h3>
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
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>90-Day Trend</h3>
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
      <section className={styles.topTransactions}>
        <h2 className={styles.sectionTitle}>🏆 Top Transactions</h2>
        {loading ? (
          <Skeleton count={5} height={60} style={{ marginBottom: '10px' }} />
        ) : (
          <div className={styles.topTransactionsGrid}>
            {topTransactions?.map((tx, index) => (
              <div key={tx._id} className={styles.topTransactionCard}>
                <div className={styles.transactionRank}>#{index + 1}</div>
                <div className={styles.transactionDetails}>
                  <h4>{tx.description}</h4>
                  <p>{format(new Date(tx.date), 'MMM dd, yyyy')}</p>
                </div>
                <div className={`${styles.transactionAmount} ${tx.amount < 0 ? styles.negative : styles.positive}`}>
                  ${Math.abs(tx.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transactions Table */}
      <section className={styles.transactions}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>📄 Recent Transactions</h2>
          <Link to="/add-transaction" className={styles.addButton}>
            ➕ Add Transaction
          </Link>
        </div>
        
        {loading ? (
          <Skeleton count={5} height={60} style={{ marginBottom: '10px' }} />
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.transactionTable}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 10).map(tx => (
                  <tr key={tx._id}>
                    <td>{tx.description}</td>
                    <td className={tx.amount < 0 ? styles.negative : styles.positive}>
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td>
                      <span 
                        className={styles.categoryBadge}
                        style={{ 
                          backgroundColor: categoryData?.find(c => c.category === tx.category)?.color || '#ccc'
                        }}
                      >
                        {tx.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td>{format(new Date(tx.date), 'MMM dd, yyyy')}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          onClick={() => setDeleteId(tx._id)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 10 && (
              <div className={styles.viewAll}>
                <Link to="/transactions">View All Transactions →</Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button 
                onClick={() => handleDelete(deleteId)}
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
              >
                Delete
              </button>
              <button 
                onClick={() => setDeleteId(null)}
                className={`${styles.actionBtn} ${styles.editBtn}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}