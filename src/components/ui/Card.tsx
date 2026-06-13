import type { ReactNode } from 'react';
import styles from './Card.module.css';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={[styles.card, className].join(' ')}>{children}</div>;
}

interface StatProps {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'danger' | 'brass';
}

export function StatCard({ label, value, tone = 'default' }: StatProps) {
  return (
    <div className={[styles.stat, styles[tone]].join(' ')}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} mono`}>{value}</span>
    </div>
  );
}
