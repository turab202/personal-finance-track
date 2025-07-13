import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const GoalPlanner = ({ transactions }) => {
  const [goal, setGoal] = useState({
    targetAmount: 5000,
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currentSavings: 1000
  });

  const calculateProjection = () => {
    const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    const dailyRequired = (goal.targetAmount - goal.currentSavings) / Math.max(daysLeft, 1);
    
    return Array.from({ length: daysLeft }, (_, i) => ({
      day: i + 1,
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      projected: goal.currentSavings + dailyRequired * (i + 1),
      minimum: goal.currentSavings + (goal.targetAmount - goal.currentSavings) * 0.7 * (i + 1) / daysLeft
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-3">
          <span className="text-emerald-600 dark:text-emerald-300 text-xl">🎯</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Savings Goal Planner</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Amount ($)</label>
          <input
            type="number"
            value={goal.targetAmount}
            onChange={(e) => setGoal({...goal, targetAmount: +e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Date</label>
          <input
            type="date"
            value={goal.targetDate}
            onChange={(e) => setGoal({...goal, targetDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={calculateProjection()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" dark:stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              stroke="#6b7280" 
              dark:stroke="#9ca3af"
            />
            <YAxis 
              tickFormatter={(value) => `$${value}`} 
              tick={{ fontSize: 12 }} 
              stroke="#6b7280" 
              dark:stroke="#9ca3af"
            />
            <Tooltip 
              formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#ffffff',
                dark: {
                  backgroundColor: '#1f2937',
                  color: '#f3f4f6'
                }
              }}
            />
            <Area 
              type="monotone" 
              dataKey="projected" 
              stroke="#10b981" 
              fill="#d1fae5" 
              strokeWidth={2}
              name="Projected" 
            />
            <Area 
              type="monotone" 
              dataKey="minimum" 
              stroke="#f59e0b" 
              fill="#fef3c7" 
              strokeWidth={2}
              name="Minimum Target" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800">
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">Daily Target</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">
            ${((goal.targetAmount - goal.currentSavings) / Math.max(Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)), 1)).toFixed(2)}
          </p>
          <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">needed per day</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-800 dark:text-blue-200 uppercase tracking-wider">Progress</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-300 mt-1">
            {((goal.currentSavings / goal.targetAmount) * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">toward goal</p>
        </div>
      </div>
    </div>
  );
};

export default GoalPlanner;