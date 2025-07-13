import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tooltip } from 'react-tooltip';

const BudgetTracker = ({ transactions }) => {
  const [budgets, setBudgets] = useState([
    { category: 'Food', allocated: 300, spent: 245, icon: '🍔' },
    { category: 'Transport', allocated: 150, spent: 180, icon: '🚗' },
    { category: 'Entertainment', allocated: 100, spent: 75, icon: '🎬' },
    { category: 'Utilities', allocated: 200, spent: 195, icon: '💡' },
    { category: 'Shopping', allocated: 150, spent: 220, icon: '🛍️' },
  ]);

  // Add new budget (demo functionality)
  const [newBudget, setNewBudget] = useState({ category: '', allocated: 0 });
  const [isAdding, setIsAdding] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 dark:bg-gray-800 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg mr-3 dark:bg-purple-900/50">
            <span className="text-purple-600 text-xl dark:text-purple-300">💰</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Budget Tracker</h3>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition-colors"
        >
          {isAdding ? 'Cancel' : '+ Add Budget'}
        </button>
      </div>

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-700"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <input
                type="text"
                value={newBudget.category}
                onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                placeholder="e.g. Groceries"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</label>
              <input
                type="number"
                value={newBudget.allocated}
                onChange={(e) => setNewBudget({...newBudget, allocated: +e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
            </div>
          </div>
          <button 
            onClick={() => {
              if (newBudget.category && newBudget.allocated) {
                setBudgets([...budgets, {...newBudget, spent: 0, icon: '📌'}]);
                setNewBudget({ category: '', allocated: 0 });
                setIsAdding(false);
              }
            }}
            className="mt-3 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Save Budget
          </button>
        </motion.div>
      )}

      <div className="space-y-4">
        {budgets.map((budget, index) => {
          const remaining = budget.allocated - budget.spent;
          const percentage = (budget.spent / budget.allocated) * 100;
          const isOver = budget.spent > budget.allocated;

          return (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.01 }}
              className="p-4 bg-gray-50 rounded-xl dark:bg-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-xl mr-3">{budget.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white">{budget.category}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ${budget.spent.toFixed(2)} of ${budget.allocated.toFixed(2)}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${
                  remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  ${Math.abs(remaining).toFixed(2)} {remaining >= 0 ? 'left' : 'over'}
                </span>
              </div>

              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600 mr-2">
                  <div 
                    className={`h-2.5 rounded-full ${
                      isOver ? 'bg-rose-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                    data-tooltip-id={`budget-tooltip-${index}`}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {Math.round(percentage)}%
                </span>
              </div>

              <Tooltip 
                id={`budget-tooltip-${index}`}
                place="top"
                content={`${budget.spent.toFixed(2)} spent (${Math.round(percentage)}% of budget)`}
                className="!bg-gray-800 !text-xs !py-1 !px-2 !rounded-lg"
              />
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between items-center text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
          <span className="text-gray-600 dark:text-gray-300">Budget Used</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-rose-500 rounded-full mr-2"></div>
          <span className="text-gray-600 dark:text-gray-300">Over Budget</span>
        </div>
      </div>
    </motion.div>
  );
};

export default BudgetTracker;