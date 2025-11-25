/**
 * InputCard.tsx
 * 
 * Component for displaying user queries in blue cards.
 * - Shows the user's submitted query text
 * - Uses SDX card component with blue background
 * - Simple, clean display of query content
 */

import React from 'react';

interface InputCardProps {
  query: string;
  className?: string;
  style?: React.CSSProperties;
}

export const InputCard: React.FC<InputCardProps> = ({ query, className, style }) => {
  return (
    <div className={className} style={style}>
      <sdx-card background="blue">
        <p>{query}</p>
      </sdx-card>
    </div>
  );
};