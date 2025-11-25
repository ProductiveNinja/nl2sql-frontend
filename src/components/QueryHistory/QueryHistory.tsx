import React from 'react';
import { InputCard } from '../InputCard/InputCard';

interface QueryHistoryProps {
  submittedQueries: string[];
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({ submittedQueries }) => {
  return (
    <div style={{ 
      width: '100%',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {submittedQueries.map((query, index) => (
        <InputCard 
          key={index} 
          query={query} 
          style={{ marginBottom: '16px' }}
        />
      ))}
    </div>
  );
};