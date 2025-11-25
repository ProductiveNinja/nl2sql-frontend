/**
 * ErrorCard.tsx
 * 
 * Component for displaying error messages in red cards.
 * - Shows WebSocket error messages or other error content
 * - Uses SDX card component with red background
 * - Displays error type and message clearly
 */

import React from 'react';

interface ErrorCardProps {
  message: string;
  type?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ 
  message, 
  type = 'error', 
  className, 
  style 
}) => {
  return (
    <div className={className} style={style}>
      <sdx-card style={{ backgroundColor: '#DD1122' }}>
        <p style={{ margin: 0, color: 'black' }}>{message}</p>
      </sdx-card>
    </div>
  );
};