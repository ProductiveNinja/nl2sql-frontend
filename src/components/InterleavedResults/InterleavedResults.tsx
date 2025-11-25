import React from 'react';
import { InputCard } from '../InputCard/InputCard';
import { ResultDisplay } from '../result/ResultDisplay';
import { Spinner } from '../Spinner/Spinner';
import { ErrorCard } from '../ErrorCard/ErrorCard';

interface InterleavedResultsProps {
  submittedQueries: string[];
  responses: Array<{query: string, data: any}>;
  isLoading: boolean;
  errors?: Array<{message: string, type: string, timestamp: number}>;
}

export const InterleavedResults: React.FC<InterleavedResultsProps> = ({ 
  submittedQueries, 
  responses, 
  isLoading,
  errors = []
}) => {
  return (
    <div style={{
      width: '100%',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {submittedQueries.map((query, index) => {
        const response = responses.find(r => r.query === query);
        const isLastQuery = index === submittedQueries.length - 1;
        const hasResponse = !!response;
        const showSpinner = isLastQuery && isLoading && !hasResponse;
        
        return (
          <div key={`${query}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Show InputCard first, positioned on the right */}
            <div style={{ alignSelf: 'flex-end', maxWidth: '400px' }}>
              <InputCard 
                query={query}
              />
            </div>
            
            {/* Show spinner on the left side if this is the last query and we're loading */}
            {showSpinner && (
              <div style={{
                alignSelf: 'flex-start',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                width: '60%'
              }}>
                <Spinner />
              </div>
            )}
            
            {/* Show result on the left side if it exists */}
            {hasResponse && (
              <div style={{ alignSelf: 'flex-start', width: '70%' }}>
                <ResultDisplay
                  data={response.data}
                  query={response.query}
                />
              </div>
            )}
          </div>
        );
      })}
      
      {/* Display error messages */}
      {errors.map((error, index) => (
        <div key={`error-${error.timestamp}-${index}`} style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
          <ErrorCard 
            message={error.message}
            type={error.type}
          />
        </div>
      ))}
    </div>
  );
};