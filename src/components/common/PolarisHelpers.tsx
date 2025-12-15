import { ReactNode } from 'react';

interface PolarisBoxProps {
  children: ReactNode;
  className?: string;
}

export function PolarisBox({ children, className = '' }: PolarisBoxProps) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}

export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
