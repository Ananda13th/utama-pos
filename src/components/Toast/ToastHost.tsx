import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { removeToast } from '../../features/ui/uiSlice';
import styles from './Toast.module.css';

export function ToastHost() {
	const toasts = useAppSelector((s) => s.ui.toasts);
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (toasts.length === 0) return;
		const timers = toasts.map((t) =>
			setTimeout(() => dispatch(removeToast(t.id)), 3500),
		);
		return () => timers.forEach(clearTimeout);
	}, [toasts, dispatch]);

	if (toasts.length === 0) return null;

	return (
		<div className={styles.host} role='status' aria-live='polite'>
			{toasts.map((t) => (
				<div key={t.id} className={[styles.toast, styles[t.variant]].join(' ')}>
					<span>{t.message}</span>
					<button
						className={styles.close}
						onClick={() => dispatch(removeToast(t.id))}
						aria-label='Tutup notifikasi'
					>
						×
					</button>
				</div>
			))}
		</div>
	);
}
