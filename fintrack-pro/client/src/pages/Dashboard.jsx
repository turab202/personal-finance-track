import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Dashboard.module.css';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, LabelList
} from 'recharts';

const COLORS = ['#00C49F', '#FF6B6B', '#0088FE', '#FFBB28', '#845EC2', '#FF6F91', '#FFC75F', '#D65DB1'];

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', date: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchTransactions();
  }, [token]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Failed to load transactions');
      }
      const data = await res.json();
      setTransactions(data);
      setFiltered(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (text = search, category = categoryFilter) => {
    let filteredTxs = [...transactions];
    if (text) {
      filteredTxs = filteredTxs.filter(t =>
        t.description.toLowerCase().includes(text.toLowerCase())
      );
    }
    if (category) {
      filteredTxs = filteredTxs.filter(t => t.category === category);
    }
    setFiltered(filteredTxs);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete transaction');
      const updated = transactions.filter(tx => tx._id !== deleteId);
      setTransactions(updated);
      applyFilters();
      setDeleteId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditing = (tx) => {
    setEditingId(tx._id);
    setEditForm({
      description: tx.description,
      amount: tx.amount,
      date: tx.date.slice(0, 10),
      category: tx.category || '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editForm,
          amount: parseFloat(editForm.amount),
        }),
      });

      if (!res.ok) throw new Error('Failed to update transaction');

      setEditingId(null);
      fetchTransactions();
    } catch (err) {
      alert(err.message);
    }
  };

  const income = filtered.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = filtered.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
  const balance = income + expenses;

  // Bar chart data: Expenses by category, each with distinct color
  const categoryMap = {};
  const barData = Object.entries(
    filtered
      .filter(tx => tx.amount < 0)
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
        return acc;
      }, {})
  ).map(([category, amount], index) => {
    categoryMap[category] = COLORS[index % COLORS.length];
    return { category, amount };
  });

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>;
  if (error) return <p style={{ padding: '2rem', color: 'red' }}>{error}</p>;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>👋 Welcome back, {user?.name || 'User'}!</h1>
      </header>

      <section className={styles.summary}>
        <h2>💰 Financial Summary</h2>
        <div className={styles.summaryCards}>
          <div className={styles.card}>
            <h3>Income</h3>
            <p className={styles.positive}>${income.toFixed(2)}</p>
          </div>
          <div className={styles.card}>
            <h3>Expenses</h3>
            <p className={styles.negative}>${Math.abs(expenses).toFixed(2)}</p>
          </div>
          <div className={styles.card}>
            <h3>Balance</h3>
            <p>${balance.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section style={{ margin: '2rem 0' }}>
        <h2>🔍 Filter Transactions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              applyFilters(e.target.value, categoryFilter);
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              applyFilters(search, e.target.value);
            }}
          >
            <option value="">All Categories</option>
            {[...new Set(transactions.map(tx => tx.category))].map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>📊 Charts</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Income vs Expenses Pie Chart */}
          <div style={{ flex: '1 1 300px', height: '300px' }}>
            <h3>Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Income', value: income },
                    { name: 'Expenses', value: Math.abs(expenses) },
                  ]}
                  dataKey="value"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  <Cell fill="#00C49F" />
                  <Cell fill="#FF6B6B" />
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Expenses by Category Bar Chart */}
          <div style={{ flex: '1 1 300px', height: '300px' }}>
            <h3>Expenses by Category</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                {barData.map((entry, index) => (
                  <Bar
                    key={`bar-${index}`}
                    dataKey="amount"
                    data={[entry]}
                    fill={COLORS[index % COLORS.length]}
                    name={entry.category}
                    stackId="stack"
                  >
                    <LabelList dataKey="amount" position="top" formatter={(val) => `$${val.toFixed(2)}`} />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className={styles.transactions}>
        <h2>📄 Transactions</h2>
        <div className={styles.tableWrapper}>
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
              {filtered.map(tx => (
                <tr key={tx._id}>
                  {editingId === tx._id ? (
                    <>
                      <td><input name="description" value={editForm.description} onChange={handleEditChange} /></td>
                      <td><input name="amount" type="number" value={editForm.amount} onChange={handleEditChange} /></td>
                      <td><input name="category" value={editForm.category} onChange={handleEditChange} /></td>
                      <td><input name="date" type="date" value={editForm.date} onChange={handleEditChange} /></td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button onClick={handleEditSubmit} className={`${styles.actionBtn} ${styles.editBtn}`}>Save</button>
                          <button onClick={() => setEditingId(null)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{tx.description}</td>
                      <td className={tx.amount < 0 ? styles.negative : styles.positive}>${tx.amount.toFixed(2)}</td>
                      <td>{tx.category || '—'}</td>
                      <td>{new Date(tx.date).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button onClick={() => startEditing(tx)} className={`${styles.actionBtn} ${styles.editBtn}`}>Edit</button>
                          <button onClick={() => setDeleteId(tx._id)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ marginTop: '2rem' }}>
        <Link to="/add-transaction">
          <button className={styles.actionBtn + ' ' + styles.editBtn}>➕ Add New Transaction</button>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white', padding: '1.5rem', borderRadius: '10px',
              maxWidth: '400px', width: '90%', textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          >
            <p>Are you sure you want to delete this transaction?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
              <button
                onClick={handleDelete}
                style={{
                  background: '#c62828',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  background: '#777',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: 'none',
                }}
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
