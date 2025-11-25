/**
 * ConnectionStatus.tsx
 * 
 * Displays WebSocket connection status indicator.
 * - Shows green checkmark with "Connected" when WebSocket is active
 * - Shows red error icon with "Connection Failed" when disconnected
 * - Updates in real-time based on connection state passed as prop
 * - Uses SDX components for consistent styling
 * - Positioned at the top of the application
 */

import React from 'react';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  className?: string;
  style?: React.CSSProperties;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connectionState, className, style }) => {
  const getNotificationProps = () => {
    switch (connectionState) {
      case 'connected':
        return {
          'notification-type': 'confirm',
          label: 'Connected'
        };
      case 'connecting':
        return {
          'notification-type': 'info',
          label: 'Connecting...'
        };
      case 'error':
        return {
          'notification-type': 'error',
          label: 'Connection Error'
        };
      case 'disconnected':
      default:
        return {
          'notification-type': 'warning',
          label: 'Disconnected'
        };
    }
  };

  const notificationProps = getNotificationProps();

  return (
    <div className={className} style={style}>
      <sdx-card
        layout="inline-notification"
        notification-type={notificationProps['notification-type']}
        label={notificationProps.label}>
      </sdx-card>
    </div>
  );
};