import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from '../ui/Button';
import styles from './BarcodeScanner.module.css';

interface Props {
	onDetected: (barcode: string) => void;
	debounceMs?: number;
}

export function BarcodeScanner({ onDetected, debounceMs = 1200 }: Props) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [active, setActive] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });

	useEffect(() => {
		if (!active) return;
		const reader = new BrowserMultiFormatReader();
		let stopFn: (() => void) | undefined;

		reader
			.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
				if (!result) return;
				const code = result.getText();
				const now = Date.now();
				if (
					code === lastScanRef.current.code &&
					now - lastScanRef.current.at < debounceMs
				) {
					return;
				}
				lastScanRef.current = { code, at: now };
				onDetected(code);
			})
			.then((controls) => {
				stopFn = () => controls.stop();
			})
			.catch((err) => {
				setError(
					err?.name === 'NotAllowedError'
						? 'Akses kamera ditolak. Izinkan kamera untuk memindai barcode.'
						: 'Tidak bisa mengakses kamera.',
				);
				setActive(false);
			});

		return () => stopFn?.();
	}, [active, onDetected, debounceMs]);

	return (
		<div className={styles.wrap}>
			{active ? (
				<div className={styles.viewport}>
					<video ref={videoRef} className={styles.video} muted playsInline />
					<div className={styles.reticle} aria-hidden='true' />
					<Button
						variant='secondary'
						onClick={() => setActive(false)}
						className={styles.stopBtn}
					>
						Hentikan kamera
					</Button>
				</div>
			) : (
				<Button variant='secondary' fullWidth onClick={() => setActive(true)}>
					Pindai barcode
				</Button>
			)}
			{error ? <p className={styles.error}>{error}</p> : null}
		</div>
	);
}
