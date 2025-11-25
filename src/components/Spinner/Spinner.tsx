/**
 * Spinner.tsx
 * 
 * Loading spinner component using SDX design system.
 * - Shows loading state while waiting for backend responses
 * - Uses SDX loading-spinner component
 * - Can be positioned and styled as needed
 */

import React from 'react';

interface SpinnerProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Spinner: React.FC<SpinnerProps> = ({ className, style }) => {
  return (
    <div className={className} style={style}>
      <sdx-loading-spinner></sdx-loading-spinner>
    </div>
  );
};