import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Import navigate
import styles from './AddTransaction.module.css';
import { useAuth } from '../context/AuthContext';

export default function AddTransaction({ onAdd }) {
  const { token } = useAuth();
  const navigate = useNavigate(); // ✅ Hook for redirecting

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('income');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const transactionData = {
      description,
      amount: parseFloat(type === 'expense' ? -Math.abs(amount) : amount),
      date,
      category,
    };

    try {
      const res = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add transaction');

      // ✅ Redirect to dashboard
      navigate('/dashboard');

      // Optional: call onAdd if you use this component inside a modal/dashboard
      if (onAdd) onAdd();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g., Freelance project"
        required
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        required
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="e.g., Salary, Utility, Donation"
        required
      />
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <button type="submit">Add</button>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
