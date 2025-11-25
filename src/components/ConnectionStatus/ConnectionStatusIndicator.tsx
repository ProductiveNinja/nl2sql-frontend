import React from 'react';
import { ConnectionStatus } from '../../hooks/useWebSocket';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
}

const getStatusConfig = (status: ConnectionStatus) => {
  switch (status) {
    case 'connected':
      return {
        text: 'Connected',
        className: 'int-green',
        iconName: 'icon-check-circle'
      };
    case 'connecting':
      return {
        text: 'Connecting',
        className: 'int-orange',
        iconName: 'icon-loading'
      };
    case 'disconnected':
      return {
        text: 'Disconnected',
        className: 'int-red',
        iconName: 'icon-error-circle'
      };
    default:
      return {
        text: 'Unknown',
        className: 'int-red',
        iconName: 'icon-error-circle'
      };
  }
};

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ status }) => {
  const config = getStatusConfig(status);

  return (
    <div className={`connection-status ${config.className}`} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      fontWeight: '500'
    }}>
      <div 
        className="connection-status-dot" 
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          flexShrink: 0
        }}
      />
      <span>{config.text}</span>
    </div>
  );
};