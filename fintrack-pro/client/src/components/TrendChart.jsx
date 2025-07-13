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
        <div className="custom-tooltip" style={{
          background: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.formattedDate}</p>
          <p style={{ margin: '5px 0', color: data.type === 'income' ? '#00C49F' : '#FF6B6B' }}>
            {data.type === 'income' ? '+' : '-'}${Math.abs(data.amount).toFixed(2)}
          </p>
          <p style={{ margin: 0 }}>Balance: ${data.balance.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      width: '100%',
      height: 300,
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        textAlign: 'center',
        marginBottom: '16px',
        color: '#333',
        fontSize: '1.2rem'
      }}>
        📈 Balance Trend
        <span style={{
          display: 'block',
          fontSize: '0.9rem',
          color: currentBalance >= 0 ? '#00C49F' : '#FF6B6B',
          marginTop: '4px'
        }}>
          Current Balance: ${currentBalance.toFixed(2)}
        </span>
      </h3>
      
      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
            tickFormatter={(value) => `$${value}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine y={0} stroke="#888" strokeDasharray="5 5" />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#0088FE"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5, stroke: '#0088FE', strokeWidth: 2 }}
            name="Balance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}