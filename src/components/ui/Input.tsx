import type { InputHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = '', ...rest }: Props) {
  const inputId = id || rest.name;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={[styles.control, error ? styles.invalid : '', className].join(' ')}
        aria-invalid={!!error}
        {...rest}
      />
      {hint && !error ? <span className={styles.hint}>{hint}</span> : null}
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
