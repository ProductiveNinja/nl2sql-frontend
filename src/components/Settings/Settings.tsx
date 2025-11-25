/**
 * Settings.tsx
 * 
 * Component for managing application settings.
 * - Handles database and LLM model selection
 * - Manages temporary settings state until save/cancel
 * - Uses SDX components for consistent styling
 */

import React, { useRef, useEffect } from 'react';

interface SettingsProps {
  tempSettings: { database: string; llm: string };
  updateTempDatabase: (database: string) => void;
  updateTempLlm: (llm: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  tempSettings, 
  updateTempDatabase, 
  updateTempLlm, 
  onSave, 
  onCancel 
}) => {
  const databaseSelectRef = useRef<any>(null);
  const modelSelectRef = useRef<any>(null);

  // Set up event listeners for SDX select components
  useEffect(() => {
    const handleDatabaseChange = (event: any) => {
      // SDX select returns arrays, so we need to get the first item
      let value = event.target.value || event.detail?.value || event.detail;
      if (Array.isArray(value)) {
        value = value[0];
      }
      if (value) {
        updateTempDatabase(value);
      }
    };

    const handleModelChange = (event: any) => {
      // SDX select returns arrays, so we need to get the first item
      let value = event.target.value || event.detail?.value || event.detail;
      if (Array.isArray(value)) {
        value = value[0];
      }
      if (value) {
        updateTempLlm(value);
      }
    };

    const databaseSelect = databaseSelectRef.current;
    const modelSelect = modelSelectRef.current;

    if (databaseSelect) {
      databaseSelect.addEventListener('change', handleDatabaseChange);
      databaseSelect.addEventListener('selectionChange', handleDatabaseChange);
      databaseSelect.addEventListener('input', handleDatabaseChange);
    }
    if (modelSelect) {
      modelSelect.addEventListener('change', handleModelChange);
      modelSelect.addEventListener('selectionChange', handleModelChange);
      modelSelect.addEventListener('input', handleModelChange);
    }

    return () => {
      if (databaseSelect) {
        databaseSelect.removeEventListener('change', handleDatabaseChange);
        databaseSelect.removeEventListener('selectionChange', handleDatabaseChange);
        databaseSelect.removeEventListener('input', handleDatabaseChange);
      }
      if (modelSelect) {
        modelSelect.removeEventListener('change', handleModelChange);
        modelSelect.removeEventListener('selectionChange', handleModelChange);
        modelSelect.removeEventListener('input', handleModelChange);
      }
    };
  }, [updateTempDatabase, updateTempLlm]);

  const handleSave = () => {
    onSave();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="padding-2 padding-top-0 padding-bottom-3">
      <p>Select your Database and Model.</p>
      
      <sdx-select
        ref={modelSelectRef}
        label="What model do you want to use?"
        placeholder="Choose your model…">
          <sdx-select-option value="gpt_oss" selected={tempSettings.llm === 'gpt_oss'}>
            Openai gpt-oss-120b
          </sdx-select-option>
          <sdx-select-option value="aws" selected={tempSettings.llm === 'aws'}>
            Anthropic Claude Sonnet 3.5
          </sdx-select-option>
      </sdx-select>
      
      <br />
      
      <sdx-select
        ref={databaseSelectRef}
        label="What database do you want to use?"
        placeholder="Choose your database…">
          <sdx-select-option value="inventory_vega" selected={tempSettings.database === 'inventory_vega'}>
            Inventory Vega
          </sdx-select-option>
          <sdx-select-option value="sakila" selected={tempSettings.database === 'sakila'}>
            Sakila
          </sdx-select-option>
      </sdx-select>
      
      <br />
      
      <sdx-button-group>
        <sdx-button label="Save" onClick={handleSave}></sdx-button>
        <sdx-button label="Cancel" theme="secondary" onClick={handleCancel}></sdx-button>
      </sdx-button-group>
    </div>
  );
};