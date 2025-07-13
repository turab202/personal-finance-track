import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUpload, FiDollarSign, FiCalendar, FiTag, FiType } from 'react-icons/fi';
import styles from './AddTransaction.module.css';

export default function AddTransaction({ onAdd }) {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    description: '', 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    category: '', 
    type: 'income',
    isRecurring: false, 
    repeatInterval: 'monthly'
  });

  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({...form, [name]: type === 'checkbox' ? checked : value });
  };

  const submit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const fd = new FormData();
    fd.append('description', form.description.trim());
    fd.append('amount', form.type === 'expense' ? -Math.abs(form.amount) : form.amount);
    fd.append('date', form.date);
    fd.append('category', form.category.trim());
    
    if(form.isRecurring) {
      fd.append('isRecurring', true);
      fd.append('repeatInterval', form.repeatInterval);
    }
    
    if(file) fd.append('file', file);

    try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions`, {
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` }, 
        body: fd
      });
      
      if(!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Transaction failed');
      }
      
      onAdd?.();
      navigate('/dashboard');
    } catch (e) { 
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common categories for quick selection
  const commonCategories = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transport', 'Housing', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Other']
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Add New Transaction</h2>
        <p className={styles.subtitle}>Track your finances with precision</p>
        
        <form onSubmit={submit} className={styles.form} encType="multipart/form-data">
          {/* Transaction Type Toggle */}
          <div className={styles.typeToggle}>
            <button
              type="button"
              className={`${styles.toggleButton} ${form.type === 'income' ? styles.active : ''}`}
              onClick={() => setForm({...form, type: 'income'})}
            >
              Income
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${form.type === 'expense' ? styles.active : ''}`}
              onClick={() => setForm({...form, type: 'expense'})}
            >
              Expense
            </button>
          </div>

          {/* Description */}
          <div className={styles.inputGroup}>
            <label htmlFor="description" className={styles.label}>
              <FiType className={styles.icon} />
              Description
            </label>
            <input
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="e.g. Salary, Groceries"
              className={styles.input}
              required
            />
          </div>

          {/* Amount */}
          <div className={styles.inputGroup}>
            <label htmlFor="amount" className={styles.label}>
              <FiDollarSign className={styles.icon} />
              Amount
            </label>
            <div className={styles.amountInput}>
              <span className={styles.currency}>$</span>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Date */}
          <div className={styles.inputGroup}>
            <label htmlFor="date" className={styles.label}>
              <FiCalendar className={styles.icon} />
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          {/* Category */}
          <div className={styles.inputGroup}>
            <label htmlFor="category" className={styles.label}>
              <FiTag className={styles.icon} />
              Category
            </label>
            <div className={styles.categoryContainer}>
              <input
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                list="categories"
                placeholder="Select or enter category"
                className={styles.input}
                required
              />
              <datalist id="categories">
                {commonCategories[form.type].map((cat, i) => (
                  <option key={i} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Recurring Transaction */}
          <div className={styles.recurringContainer}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isRecurring"
                checked={form.isRecurring}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span className={styles.checkboxCustom}></span>
              Recurring Transaction
            </label>
            
            {form.isRecurring && (
              <select
                name="repeatInterval"
                value={form.repeatInterval}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>

          {/* File Upload - Optional */}
          <div className={styles.fileUpload}>
            <label className={styles.fileLabel}>
              <FiUpload className={styles.uploadIcon} />
              <span>Receipt or Document (Optional)</span>
              <input
                type="file"
                onChange={e => setFile(e.target.files[0])}
                accept="image/*,application/pdf"
                className={styles.fileInput}
              />
            </label>
            {file && (
              <div className={styles.filePreview}>
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="Preview" 
                    className={styles.previewImage} 
                  />
                ) : (
                  <div className={styles.fileInfo}>
                    <span>{file.name}</span>
                    <span>{Math.round(file.size / 1024)} KB</span>
                  </div>
                )}
                <button 
                  type="button" 
                  onClick={() => setFile(null)}
                  className={styles.removeFile}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Transaction'}
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}