import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import { ConnectionStatus } from './components/ConnectionStatus/ConnectionStatus';
import { Header } from './components/Header/Header';
import { InputField } from './components/InputField/InputField';
import { InterleavedResults } from './components/InterleavedResults/InterleavedResults';
import { useWebSocket } from './hooks/useWebSocket';
import { useSettings } from './hooks/useSettings';
import { useQueryManager } from './hooks/useQueryManager';

function App() {
  const headerRef = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const buttonRef = useRef<any>(null);
  const { connectionState, sendQuery, lastMessage } = useWebSocket(process.env.REACT_APP_WEBSOCKET_BASE_URL || 'ws://localhost:8000/agent');
  const { settings, tempSettings, updateTempDatabase, updateTempLlm, saveSettings, cancelSettings } = useSettings();
  const [errors, setErrors] = useState<Array<{message: string, type: string, timestamp: number}>>([]);
  
  // Only enable input and button when connected
  const isConnected = connectionState === 'connected';
  
  // Use the query manager hook
  const {
    submittedQueries,
    currentQuery,
    setCurrentQuery,
    isLoading,
    responses,
    setResponses,
    setIsLoading,
    handleSubmitQuery,
    handleInputChange,
    handleKeyPress,
    addResponse
  } = useQueryManager(sendQuery, settings, isConnected);

  const handleSaveSettings = () => {
    saveSettings();
    console.log('Settings saved:', {
      DATABASE: tempSettings.database,
      LLM_BACKEND: tempSettings.llm
    });
    // Close the settings panel
    if (headerRef.current) {
      headerRef.current.closeSlot('settings');
    }
  };

  const handleCancelSettings = () => {
    cancelSettings();
    // Close the settings panel
    if (headerRef.current) {
      headerRef.current.closeSlot('settings');
    }
  };
  
  // Set up event listeners for SDX components
  useEffect(() => {
    const input = inputRef.current;
    const button = buttonRef.current;
    
    const handleInputEvent = (event: any) => {
      const value = event.target.value || event.detail?.value || event.detail;
      if (value !== undefined) {
        setCurrentQuery(value);
      }
    };
    
    const handleButtonClick = () => {
      handleSubmitQuery();
    };
    
    const handleInputKeyPress = (event: any) => {
      if (event.key === 'Enter' || event.keyCode === 13) {
        handleSubmitQuery();
      }
    };
    
    if (input) {
      input.addEventListener('input', handleInputEvent);
      input.addEventListener('change', handleInputEvent);
      input.addEventListener('keypress', handleInputKeyPress);
      input.addEventListener('keydown', handleInputKeyPress);
    }
    
    if (button) {
      button.addEventListener('click', handleButtonClick);
    }
    
    return () => {
      if (input) {
        input.removeEventListener('input', handleInputEvent);
        input.removeEventListener('change', handleInputEvent);
        input.removeEventListener('keypress', handleInputKeyPress);
        input.removeEventListener('keydown', handleInputKeyPress);
      }
      if (button) {
        button.removeEventListener('click', handleButtonClick);
      }
    };
  }, [handleSubmitQuery, setCurrentQuery]);
  
  // Log WebSocket responses
  useEffect(() => {
    if (lastMessage) {
      console.log('WebSocket response received:', lastMessage);
      
      // Process "db_result" events
      if (lastMessage.event === 'db_result' && isLoading && submittedQueries.length > 0) {
        // Find the query that doesn't have a response yet
        const queryWithoutResponse = submittedQueries.find(query => 
          !responses.some(r => r.query === query)
        );
        
        if (queryWithoutResponse) {
          console.log('Adding db_result response for query:', queryWithoutResponse);
          // Extract the actual data from the WebSocket response
          const responseData = lastMessage.data || lastMessage;
          
          setResponses(prev => {
            // Double-check we're not adding a duplicate
            const exists = prev.some(r => r.query === queryWithoutResponse);
            if (!exists) {
              return [...prev, { query: queryWithoutResponse, data: responseData }];
            }
            return prev;
          });
          
          // Clear loading state when response is received
          setIsLoading(false);
        }
      } 
      // Handle error events
      else if (lastMessage.event === 'error') {
        console.log('Error event received:', lastMessage);
        const errorMessage = lastMessage.data?.message || 'An error occurred';
        const errorType = lastMessage.data?.type || 'error';
        
        // Add error to the errors array
        setErrors(prev => [...prev, {
          message: errorMessage,
          type: errorType,
          timestamp: Date.now()
        }]);
        
        // Clear loading state if there's an error
        setIsLoading(false);
      }
      else if (lastMessage.event !== 'db_result') {
        console.log('Ignoring non-db_result event:', lastMessage.event);
      }
    }
  }, [lastMessage?.event, lastMessage?.data, isLoading, submittedQueries, responses, setResponses, setIsLoading]);

  return (
    <div className="App">
      <Header 
        headerRef={headerRef}
        tempSettings={tempSettings}
        updateTempDatabase={updateTempDatabase}
        updateTempLlm={updateTempLlm}
        onSaveSettings={handleSaveSettings}
        onCancelSettings={handleCancelSettings}
      />
      
      <ConnectionStatus 
        connectionState={connectionState}
        style={{ display: 'flex', justifyContent: 'flex-end', margin: '20px' }}
      />
      
      <div className="main-content">
        <InterleavedResults 
          submittedQueries={submittedQueries}
          responses={responses}
          isLoading={isLoading}
          errors={errors}
        />
      </div>
      
      <InputField
        inputRef={inputRef}
        buttonRef={buttonRef}
        currentQuery={currentQuery}
        isConnected={isConnected}
      />
    </div>
  );
}

export default App;
