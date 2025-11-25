import { useState, useCallback } from 'react';

export const useQueryManager = (sendQuery: Function, settings: any, isConnected: boolean) => {
  const [submittedQueries, setSubmittedQueries] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responses, setResponses] = useState<Array<{query: string, data: any}>>([]);

  const handleSubmitQuery = useCallback(() => {
    console.log('handleSubmitQuery called with:', {
      currentQuery,
      isConnected,
      isLoading,
      hasDatabase: !!settings.database,
      hasLlm: !!settings.llm
    });
    
    if (!currentQuery.trim() || !isConnected || isLoading) {
      console.log('Query submission blocked:', {
        emptyQuery: !currentQuery.trim(),
        notConnected: !isConnected,
        alreadyLoading: isLoading
      });
      return;
    }
    
    // Check if settings are configured
    if (!settings.database || !settings.llm) {
      console.warn('Please configure database and model in settings before submitting queries');
      return;
    }
    
    console.log('Sending query:', currentQuery);
    console.log('With config:', {
      DATABASE: settings.database,
      LLM_BACKEND: settings.llm
    });
    
    // Store the query before clearing it
    const queryToSubmit = currentQuery;
    
    // Clear input immediately
    setCurrentQuery('');
    
    // Set loading state
    setIsLoading(true);
    
    // Add query to the list
    setSubmittedQueries(prev => {
      console.log('Adding query to submitted queries:', queryToSubmit);
      return [...prev, queryToSubmit];
    });
    
    // Send query via WebSocket
    try {
      sendQuery(queryToSubmit, {
        DATABASE: settings.database,
        LLM_BACKEND: settings.llm
      });
      console.log('Query sent successfully via WebSocket');
    } catch (error) {
      console.error('Error sending query:', error);
      setIsLoading(false);
    }
  }, [currentQuery, isConnected, isLoading, settings, sendQuery]);

  const handleInputChange = useCallback((event: any) => {
    setCurrentQuery(event.target.value);
  }, []);
  
  const handleKeyPress = useCallback((event: any) => {
    if (event.key === 'Enter') {
      handleSubmitQuery();
    }
  }, [handleSubmitQuery]);

  const addResponse = useCallback((responseData: any) => {
    const lastQuery = submittedQueries[submittedQueries.length - 1];
    if (lastQuery) {
      setResponses(prev => [...prev, { query: lastQuery, data: responseData }]);
    }
    setIsLoading(false);
  }, [submittedQueries]);

  return {
    submittedQueries,
    currentQuery,
    setCurrentQuery,
    isLoading,
    setIsLoading,
    responses,
    setResponses,
    handleSubmitQuery,
    handleInputChange,
    handleKeyPress,
    addResponse
  };
};