import { useNavigate } from 'react-router-dom';
import {
	useGetOngoingSessionQuery,
	useStartSessionMutation,
	useCompleteSessionMutation,
	useScanItemMutation,
	useGetScannedItemsQuery,
} from '../../features/stockOpname/stockOpnameApi';
import { useGetProductsQuery } from '../../features/products/productsApi';
import { useAppSelector } from '../../lib/hooks';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { BarcodeScanner } from '../../components/BarcodeScanner/BarcodeScanner';
import page from '../../styles/page.module.css';
import styles from './StockOpnamePage.module.css';

export function StockOpnamePage() {
	const user = useAppSelector((s) => s.auth.user);
	const toast = useToast();
	const navigate = useNavigate();

	const { data: session } = useGetOngoingSessionQuery();
	const { data: products = [] } = useGetProductsQuery();
	const { data: scanned = [] } = useGetScannedItemsQuery(
		session?.session_id ?? '',
		{
			skip: !session,
		},
	);
	const [startSession, { isLoading: starting }] = useStartSessionMutation();
	const [completeSession, { isLoading: completing }] =
		useCompleteSessionMutation();
	const [scanItem] = useScanItemMutation();

	const scanMap = new Map(
		scanned.map((s) => [s.product_id, s.scanned_quantity]),
	);

	async function handleStart() {
		if (!user) return;
		const result = await startSession({ user_id: user.user_id });
		if ('error' in result) {
			toast((result.error as { message: string }).message, 'error');
		}
	}

	async function handleScan(barcode: string) {
		if (!session) return;
		const result = await scanItem({ session_id: session.session_id, barcode });
		if ('error' in result) {
			toast((result.error as { message: string }).message, 'error');
		} else {
			toast('Tercatat.', 'success');
		}
	}

	async function handleComplete() {
		if (!session) return;
		if (scanned.length === 0) {
			toast('Belum ada produk yang dipindai.', 'warning');
			return;
		}
		const result = await completeSession(session.session_id);
		if ('error' in result) {
			toast((result.error as { message: string }).message, 'error');
			return;
		}
		navigate(`/stock-opname/${session.session_id}/result`);
	}

	if (!session) {
		return (
			<div>
				<div className={page.pageHead}>
					<h1 className={page.pageTitle}>Stock Opname</h1>
				</div>
				<div className={styles.startCard}>
					<p className={styles.startText}>
						Mulai sesi stock opname untuk memindai stok fisik dan
						membandingkannya dengan data sistem.
					</p>
					<Button onClick={handleStart} loading={starting}>
						Mulai Stock Opname
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className={page.pageHead}>
				<h1 className={page.pageTitle}>Memindai Stok</h1>
				<Button variant='primary' onClick={handleComplete} loading={completing}>
					Selesai &amp; Lihat Laporan
				</Button>
			</div>

			<div className={styles.scannerWrap}>
				<BarcodeScanner onDetected={handleScan} />
			</div>

			<h2 className={styles.countTitle}>Hasil pindai</h2>
			<ul className={styles.countList}>
				{products.map((p) => {
					const sc = scanMap.get(p.product_id) ?? 0;
					let state: 'match' | 'short' | 'none' | 'over' = 'none';
					if (sc === 0) state = 'none';
					else if (sc === p.available_stock) state = 'match';
					else if (sc < p.available_stock) state = 'short';
					else state = 'over';
					return (
						<li key={p.product_id} className={styles.countItem}>
							<div>
								<span className={styles.cName}>{p.brand_name}</span>
								<span className={styles.cSerial}>{p.serial_number}</span>
							</div>
							<div className={styles.countRight}>
								<span className='mono'>
									{sc} / {p.available_stock}
								</span>
								<span className={[styles.badge, styles[state]].join(' ')}>
									{state === 'match'
										? 'Sesuai'
										: state === 'short'
											? 'Kurang'
											: state === 'over'
												? 'Lebih'
												: 'Belum'}
								</span>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
