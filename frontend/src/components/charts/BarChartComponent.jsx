import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BarChartComponent = ({ data, xKey, yKey }) => {
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm text-center py-10">No data available for charting.</div>;

  const chartData = data.map(row => ({
    ...row,
    [yKey]: Number(row[yKey]) || 0
  }));

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey={xKey} 
            stroke="#64748b" 
            tick={{fill: '#64748b', fontSize: 12}} 
            tickMargin={10} 
            axisLine={{ stroke: '#e2e8f0' }} 
          />
          <YAxis 
            stroke="#64748b" 
            tick={{fill: '#64748b', fontSize: 12}} 
            tickMargin={10} 
            axisLine={{ stroke: '#e2e8f0' }} 
            tickLine={false} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              borderColor: '#e2e8f0', 
              borderRadius: '8px', 
              color: '#1e293b', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' 
            }}
            itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
            cursor={{fill: 'rgba(79, 70, 229, 0.05)'}}
          />
          <Bar dataKey={yKey} fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;
