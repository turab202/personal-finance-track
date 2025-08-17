import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';

export default function TrendChart({ transactions }) {
  // Process data to show balance trend and daily changes
  const { chartData, currentBalance } = React.useMemo(() => {
    let runningBalance = 0;
    const sortedTransactions = [...transactions]
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const processedData = sortedTransactions.map(tx => {
      runningBalance += tx.amount;
      return {
        date: tx.date,
        formattedDate: format(parseISO(tx.date), 'MMM dd'),
        balance: runningBalance,
        amount: tx.amount,
        type: tx.amount >= 0 ? 'income' : 'expense'
      };
    });

    return {
      chartData: processedData,
      currentBalance: runningBalance
    };
  }, [transactions]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800">{data.formattedDate}</p>
          <p className={`mt-1 ${data.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
            {data.type === 'income' ? '+' : '-'}${Math.abs(data.amount).toFixed(2)}
          </p>
          <p className="text-gray-700">Balance: ${data.balance.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          📈 Balance Trend
        </h3>
        <p className={`text-sm mt-1 ${
          currentBalance >= 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          Current Balance: ${currentBalance.toFixed(2)}
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 12 }}
            tickMargin={10}
            stroke="#888"
          />
          <YAxis 
            tickFormatter={(value) => `$${value}`}
            tick={{ fontSize: 12 }}
            stroke="#888"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px'
            }}
          />
          <ReferenceLine y={0} stroke="#888" strokeDasharray="5 5" />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6" // Tailwind blue-500
            strokeWidth={2}
            dot={{ r: 3, fill: '#3b82f6' }}
            activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
            name="Balance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}