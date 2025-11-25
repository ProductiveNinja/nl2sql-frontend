/**
 * PieChartView.tsx
 * 
 * Component for displaying query results as a pie chart.
 */

import React from 'react';

interface PieChartViewProps {
  data: any;
}

export const PieChartView: React.FC<PieChartViewProps> = ({ data }) => {
  if (!data) {
    return <p>No data available for pie chart</p>;
  }

  // Handle WebSocket response format
  let tableData = data;
  if (data.data && data.data.rows && Array.isArray(data.data.rows)) {
    tableData = data.data.rows;
  } else if (data.rows && Array.isArray(data.rows)) {
    tableData = data.rows;
  } else if (!Array.isArray(data)) {
    return <p>No data available for pie chart</p>;
  }

  if (tableData.length === 0) {
    return <p>No data available for pie chart</p>;
  }

  const headers = Object.keys(tableData[0]);
  const labelColumn = headers[0];
  
  // Find first numeric column
  const valueColumn = headers.find(h => {
    return tableData.some((row: any) => {
      const value = row[h];
      return typeof value === 'number' || 
             (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(parseFloat(value)));
    });
  }) || headers[1];
  
  const colors = ['turquoise', 'iris', 'azure', 'orchid', 'mint'];
  
  // Calculate total with proper numeric conversion
  const total = tableData.reduce((sum: number, row: any) => {
    const value = row[valueColumn];
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return sum + numericValue;
  }, 0);
  
  const chartData = tableData.map((row: any, index: number) => {
    const value = row[valueColumn];
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    const percentage = total > 0 ? (numericValue / total * 100).toFixed(2) : '0';
    
    return {
      value: parseFloat(percentage),
      color: colors[index % colors.length],
      label: `${row[labelColumn]} (${percentage}%)`,
      srHint: `${row[labelColumn]} represents ${percentage}% of the total`
    };
  });

  const mainValue = chartData[0];

  return (
    <sdx-pie-chart
      value={`${mainValue?.value || 0}%`}
      description={`${labelColumn} Distribution`}
      data={JSON.stringify(chartData)}
    ></sdx-pie-chart>
  );
};