/**
 * SqlView.tsx
 * 
 * Component for displaying SQL queries with copy functionality.
 */

import React from 'react';

interface SqlViewProps {
  data: any;
}

export const SqlView: React.FC<SqlViewProps> = ({ data }) => {
  if (!data || !data.sql_query) {
    return <p>No SQL query available</p>;
  }

  const handleCopyClick = () => {
    navigator.clipboard.writeText(data.sql_query).then(() => {
      console.log('SQL query copied to clipboard');
      // You could add a toast notification here
    }).catch(err => {
      console.error('Failed to copy SQL query:', err);
    });
  };

  return (
    <sdx-card background="grey">
      <sdx-icon 
        icon-name="icon-copy" 
        size={3} 
        style={{float: 'right', cursor: 'pointer'}}
        onClick={handleCopyClick}
        title="Copy SQL Query">
      </sdx-icon>
      <p style={{ whiteSpace: 'pre-line', fontFamily: 'monospace', margin: 0 }}>
        {data.sql_query}
      </p>
    </sdx-card>
  );
};