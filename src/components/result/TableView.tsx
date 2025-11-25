/**
 * TableView.tsx
 * 
 * Component for displaying query results as a table.
 */

import React from 'react';

interface TableViewProps {
  data: any;
}

export const TableView: React.FC<TableViewProps> = ({ data }) => {
  if (!data) {
    return <p>No data to display</p>;
  }

  // Handle WebSocket response format: data.rows contains the actual data
  let tableData = data;
  if (data.data && data.data.rows && Array.isArray(data.data.rows)) {
    tableData = data.data.rows;
  } else if (data.rows && Array.isArray(data.rows)) {
    tableData = data.rows;
  } else if (!Array.isArray(data)) {
    return <p>No data to display</p>;
  }

  if (tableData.length === 0) {
    return <p>No data to display</p>;
  }

  const headers = Object.keys(tableData[0]);

  const isNumericColumn = (header: string): boolean => {
    return tableData.some((row: any) => {
      const value = row[header];
      return typeof value === 'number' || 
             (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(parseFloat(value)));
    });
  };
  
  return (
    <div className="table table--responsive table--no-border" style={{ width: '100%' }}>
      <h3 className="table__title h3">Query Results</h3>
      <div className="table__wrapper" style={{ width: '100%' }}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} data-type={isNumericColumn(header) ? "number" : "text"} style={{ padding: '12px' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row: any, rowIndex: number) => (
              <tr key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <td key={colIndex} style={{ padding: '12px' }}>{row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};