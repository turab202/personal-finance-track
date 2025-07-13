import React from 'react';

const HealthScore = ({ transactions }) => {
  // Mock calculations - replace with real logic
  const calculateScore = () => {
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    
    // Simple scoring algorithm
    let score = 50; // Base score
    
    if (savingsRate > 20) score += 25;
    else if (savingsRate > 10) score += 15;
    else if (savingsRate > 0) score += 5;
    
    if (totalIncome > totalExpenses * 3) score += 15;
    
    return Math.min(100, Math.max(0, score));
  };

  const score = calculateScore();
  
  const getHealthLevel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const getHealthColor = () => {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200';
    if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
    if (score >= 40) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200';
    return 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
          <span className="text-red-600 dark:text-red-300 text-xl">❤️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Financial Health</h3>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40 mb-6">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              dark:stroke="#374151"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={
                score >= 80 ? '#10b981' :
                score >= 60 ? '#3b82f6' :
                score >= 40 ? '#f59e0b' : '#ef4444'
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${score * 2.83}, 283`}
              transform="rotate(-90 50 50)"
            />
            {/* Center text */}
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-2xl font-bold"
              fill="#111827"
              dark:fill="#f3f4f6"
            >
              {score}
            </text>
          </svg>
        </div>

        <div className={`px-4 py-2 rounded-full ${getHealthColor()} text-sm font-medium mb-4`}>
          {getHealthLevel()}
        </div>

        <div className="w-full space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Rate</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {((transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) - 
                Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))) / 
                transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 1) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Debt Ratio</span>
            <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              {(Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)) / 
               transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 1) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Emergency Fund</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {transactions.filter(t => t.category === 'Savings').length > 0 ? '✅' : '❌'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthScore;