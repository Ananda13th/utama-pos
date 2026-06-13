import type { SelectHTMLAttributes, ReactNode } from 'react';
import styles from './Field.module.css';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, id, children, className = '', ...rest }: Props) {
  const selectId = id || rest.name;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={selectId}>{label}</label>
      <select
        id={selectId}
        className={[styles.control, error ? styles.invalid : '', className].join(' ')}
        aria-invalid={!!error}
        {...rest}
      >
        {children}
      </select>
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
