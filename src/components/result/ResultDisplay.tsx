/**
 * ResultDisplay.tsx
 * 
 * Component for displaying query results in different formats.
 * - Shows data as table by default
 * - Provides dropdown to switch between table, pie chart, and SQL query
 * - Validates data to determine which visualization options are available
 * - Uses SDX components for consistent styling
 */

import React, { useState, useEffect, useRef } from 'react';
import { TableView } from './TableView';
import { SqlView } from './SqlView';
import { PieChartView } from './PieChartView';

interface ResultDisplayProps {
  data: any;
  query: string;
  style?: React.CSSProperties;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, query, style }) => {
  const [displayType, setDisplayType] = useState<string>('table');
  const [availableTypes, setAvailableTypes] = useState<string[]>(['table']);
  const selectRef = useRef<any>(null);

  // Validate data and determine available display types
  useEffect(() => {
    if (!data) return;

    const types = ['table'];
    
    // Add SQL Query option if sql_query is available
    if (data.sql_query) {
      types.push('sql');
    }
    
    // Check if data can be displayed as pie chart
    if (canDisplayAsChart(data)) {
      types.push('pie');
    }
    
    setAvailableTypes(types);
    
    // Reset to table if current type is not available
    if (!types.includes(displayType)) {
      setDisplayType('table');
    }
  }, [data, displayType]);

  // Set up event listener for select component
  useEffect(() => {
    const select = selectRef.current;
    
    const handleSelectChange = (event: any) => {
      let value = event.target.value || event.detail?.value || event.detail;
      if (Array.isArray(value)) {
        value = value[0];
      }
      if (value) {
        setDisplayType(value);
      }
    };

    if (select) {
      select.addEventListener('change', handleSelectChange);
      select.addEventListener('selectionChange', handleSelectChange);
      select.addEventListener('input', handleSelectChange);
    }

    return () => {
      if (select) {
        select.removeEventListener('change', handleSelectChange);
        select.removeEventListener('selectionChange', handleSelectChange);
        select.removeEventListener('input', handleSelectChange);
      }
    };
  }, []);

  const canDisplayAsChart = (data: any): boolean => {
    if (!data) return false;
    
    // Handle WebSocket response format
    let tableData = data;
    if (data.data && data.data.rows && Array.isArray(data.data.rows)) {
      tableData = data.data.rows;
    } else if (data.rows && Array.isArray(data.rows)) {
      tableData = data.rows;
    } else if (!Array.isArray(data)) {
      return false;
    }
    
    // Check if data has at least one numeric column
    if (tableData.length === 0) return false;
    
    const firstRow = tableData[0];
    if (!firstRow || typeof firstRow !== 'object') return false;
    
    // Check if there's at least one numeric value
    return Object.values(firstRow).some(value => 
      typeof value === 'number' || 
      (typeof value === 'string' && !isNaN(parseFloat(value as string)) && isFinite(parseFloat(value as string)))
    );
  };

  const renderContent = () => {
    switch (displayType) {
      case 'pie':
        return <PieChartView data={data} />;
      case 'sql':
        return <SqlView data={data} />;
      default:
        return <TableView data={data} />;
    }
  };

  if (!data) {
    return null;
  }

  return (
    <div style={style}>
      <sdx-select
        ref={selectRef}
        label="How do you want to display your results?"
        placeholder="Choose your option…"
      >
        <sdx-select-option value="table" selected={displayType === 'table'}>
          Table
        </sdx-select-option>
        {availableTypes.includes('sql') && (
          <sdx-select-option value="sql" selected={displayType === 'sql'}>
            SQL Query
          </sdx-select-option>
        )}
        {availableTypes.includes('pie') && (
          <sdx-select-option value="pie" selected={displayType === 'pie'}>
            Pie Chart
          </sdx-select-option>
        )}
      </sdx-select>
      
      <div style={{ marginTop: '20px' }}>
        {renderContent()}
      </div>
    </div>
  );
};