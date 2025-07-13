import React from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const SuccessMeter = ({ transactions }) => {
  // Mock calculation - replace with real logic
  const calculateSuccessProbability = () => {
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    return Math.min(100, Math.max(0, savingsRate * 1.5 + 30)); // Adjusted formula
  };

  const successProbability = calculateSuccessProbability();
  
  const getProbabilityColor = () => {
    if (successProbability >= 75) return '#10b981';
    if (successProbability >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
          <span className="text-blue-600 dark:text-blue-300 text-xl">📈</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Success Probability</h3>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-40 h-40 mb-6">
          <CircularProgressbar
            value={successProbability}
            text={`${successProbability}%`}
            strokeWidth={10}
            styles={{
              path: {
                stroke: getProbabilityColor(),
                transition: 'stroke-dashoffset 0.5s ease 0s',
              },
              text: {
                fill: '#1f2937',
                dark: {
                  fill: '#f3f4f6'
                },
                fontSize: '24px',
                fontWeight: 'bold',
              },
              trail: {
                stroke: '#f3f4f6',
                dark: {
                  stroke: '#374151'
                }
              }
            }}
          />
        </div>

        <div className="w-full space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Rate</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">15%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Spending Consistency</span>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">82%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Goal Alignment</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">64%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessMeter;