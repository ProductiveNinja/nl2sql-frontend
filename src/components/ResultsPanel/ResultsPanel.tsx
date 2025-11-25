import React from 'react';
import { ResultDisplay } from '../result/ResultDisplay';
import { Spinner } from '../Spinner/Spinner';

interface ResultsPanelProps {
  responses: Array<{query: string, data: any}>;
  isLoading: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ responses, isLoading }) => {
  return (
    <div style={{
      width: '100%',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Loading spinner */}
      {isLoading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <Spinner />
        </div>
      )}
      
      {/* Results display */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {responses.map((response, index) => (
          <ResultDisplay
            key={index}
            data={response.data}
            query={response.query}
          />
        ))}
      </div>
    </div>
  );
};