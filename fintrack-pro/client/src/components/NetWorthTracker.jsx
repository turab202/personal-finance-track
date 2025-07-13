import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const NetWorthTracker = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState('3m');
  const [netWorthData, setNetWorthData] = useState([]);

  useEffect(() => {
    // Generate mock net worth data based on time range
    const generateData = () => {
      const data = [];
      const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
      const currentDate = new Date();
      
      for (let i = months; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        
        // Mock calculation - replace with real net worth calculation
        const income = transactions
          .filter(t => t.amount > 0 && new Date(t.date) <= date)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = Math.abs(transactions
          .filter(t => t.amount < 0 && new Date(t.date) <= date)
          .reduce((sum, t) => sum + t.amount, 0));
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short' }),
          value: income - expenses + (Math.random() * 2000) // Add some random assets
        });
      }
      
      return data;
    };
    
    setNetWorthData(generateData());
  }, [transactions, timeRange]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
            <span className="text-indigo-600 dark:text-indigo-300 text-xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Net Worth Tracker</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('3m')}
            className={`px-3 py-1 text-xs rounded-full ${
              timeRange === '3m' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            3M
          </button>
          <button
            onClick={() => setTimeRange('6m')}
            className={`px-3 py-1 text-xs rounded-full ${
              timeRange === '6m' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            6M
          </button>
          <button
            onClick={() => setTimeRange('12m')}
            className={`px-3 py-1 text-xs rounded-full ${
              timeRange === '12m' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            12M
          </button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={netWorthData}>
            <XAxis 
              dataKey="date" 
              stroke="#6b7280" 
              dark:stroke="#9ca3af"
            />
            <YAxis 
              tickFormatter={(value) => `$${value / 1000}k`} 
              stroke="#6b7280" 
              dark:stroke="#9ca3af"
            />
            <Tooltip 
              formatter={(value) => [`$${value.toLocaleString()}`, 'Net Worth']}
              labelFormatter={(label) => `Month: ${label}`}
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
          <p className="text-lg font-semibold text-gray-800 dark:text-white">
            ${netWorthData.length > 0 ? netWorthData[netWorthData.length - 1].value.toLocaleString() : '0'}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <p className="text-xs text-green-500 dark:text-green-400">Change</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-300">
            {netWorthData.length > 1 ? 
              `${(((netWorthData[netWorthData.length - 1].value - netWorthData[0].value) / netWorthData[0].value * 100).toFixed(1))}%` : '0%'}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-xs text-blue-500 dark:text-blue-400">Assets</p>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-300">
            ${netWorthData.length > 0 ? (netWorthData[netWorthData.length - 1].value * 1.3).toLocaleString() : '0'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NetWorthTracker;