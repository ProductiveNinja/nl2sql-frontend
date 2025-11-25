import React from 'react';

interface InputFieldProps {
  inputRef: React.RefObject<any>;
  buttonRef: React.RefObject<any>;
  currentQuery: string;
  isConnected: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  inputRef, 
  buttonRef, 
  currentQuery, 
  isConnected 
}) => {
  return (
    <div className="nl2sql-container">
      <div className="nl2sql-bar">
        <sdx-input
          ref={inputRef}
          placeholder="What do you want to find out?"
          sr-hint-search-button="Run query"
          clearable
          disabled={!isConnected}
          value={currentQuery}>
        </sdx-input>

        <sdx-button
          ref={buttonRef}
          icon-name="icon-search"
          icon-size="2"
          title="Send"
          disabled={!isConnected}>
        </sdx-button>
      </div>
    </div>
  );
};