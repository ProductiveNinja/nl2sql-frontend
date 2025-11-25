import React from 'react';
import { Settings } from '../Settings/Settings';

interface HeaderProps {
  headerRef: React.RefObject<any>;
  tempSettings: { database: string; llm: string };
  updateTempDatabase: (database: string) => void;
  updateTempLlm: (llm: string) => void;
  onSaveSettings: () => void;
  onCancelSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  headerRef, 
  tempSettings, 
  updateTempDatabase, 
  updateTempLlm, 
  onSaveSettings, 
  onCancelSettings 
}) => {
  const headerData = {
    index: {
      label: "Home",
      href: "./"
    },
    login: {
      login: {
        href: "./"
      }
    },
    slots: [
      {
        label: "Settings",
        iconName: "icon-settings",
        slot: "settings"
      }
    ],
    navigation: {
      main: {
        label: "Navigation", 
        children: [
          {
            label: "NL2SQL",
            href: "/"
          }
        ]
      }
    }
  };

  return (
    <sdx-header
      ref={headerRef}
      index={JSON.stringify(headerData.index)}
      login={JSON.stringify(headerData.login)}
      slots={JSON.stringify(headerData.slots)}
      navigation={JSON.stringify(headerData.navigation)}
    >
      <div slot="settings">
        <Settings 
          tempSettings={tempSettings}
          updateTempDatabase={updateTempDatabase}
          updateTempLlm={updateTempLlm}
          onSave={onSaveSettings} 
          onCancel={onCancelSettings} 
        />
      </div>

      <div slot="search">
        <div className="padding-2 padding-top-0 padding-bottom-3">
          <sdx-input type="search" placeholder="Search…"></sdx-input>
        </div>
      </div>

      <div slot="cart" className="padding-2 padding-top-0 padding-bottom-3">
        <sdx-select label="Please select order priority">
          <sdx-select-option>A</sdx-select-option>
          <sdx-select-option>B</sdx-select-option>
        </sdx-select>
      </div>

      <div slot="order" className="padding-2 padding-top-0 padding-bottom-3">
        Order
      </div>
    </sdx-header>
  );
};