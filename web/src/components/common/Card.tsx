import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--card)',
        borderRadius: 'var(--r-lg)',
        border: `1px solid var(--border)`,
        boxShadow: 'var(--shadow-1)',
        padding: '16px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
