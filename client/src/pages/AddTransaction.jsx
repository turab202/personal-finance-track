import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUpload, FiDollarSign, FiCalendar, FiTag, FiType } from 'react-icons/fi';

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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transactions`, {
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add New Transaction</h2>
            <p className="mt-2 text-gray-600">Track your finances with precision</p>
          </div>
          
          <form onSubmit={submit} className="space-y-6" encType="multipart/form-data">
            {/* Transaction Type Toggle */}
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  form.type === 'income' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setForm({...form, type: 'income'})}
              >
                Income
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  form.type === 'expense' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setForm({...form, type: 'expense'})}
              >
                Expense
              </button>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiType className="mr-2 text-gray-400" />
                Description
              </label>
              <input
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="e.g. Salary, Transport"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiDollarSign className="mr-2 text-gray-400" />
                Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiCalendar className="mr-2 text-gray-400" />
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiTag className="mr-2 text-gray-400" />
                Category
              </label>
              <input
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                list="categories"
                placeholder="Select or enter category"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <datalist id="categories">
                {commonCategories[form.type].map((cat, i) => (
                  <option key={i} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Recurring Transaction */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={form.isRecurring}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700">
                  Recurring Transaction
                </label>
              </div>
              
              {form.isRecurring && (
                <select
                  name="repeatInterval"
                  value={form.repeatInterval}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
            </div>

            {/* File Upload - Optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt or Document (Optional)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        onChange={e => setFile(e.target.files[0])}
                        accept="image/*,application/pdf"
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>
              {file && (
                <div className="mt-2 flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    {file.type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="h-10 w-10 object-cover rounded" 
                      />
                    ) : (
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-700">{file.name}</div>
                        <div className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</div>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-900"
                  >
                    × Remove
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button 
                type="submit" 
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : 'Add Transaction'}
              </button>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}