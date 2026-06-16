import { Link } from 'react-router-dom';
import { useGetProductsQuery } from '../../features/products/productsApi';
import { useGetTransactionsQuery } from '../../features/transactions/transactionsApi';
import { useAppSelector } from '../../lib/hooks';
import { StatCard } from '../../components/ui/Card';
import { formatRupiah, formatNumber, dayRange } from '../../utils/format';
import page from '../../styles/page.module.css';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
	const user = useAppSelector((s) => s.auth.user);
	const today = new Date().toISOString().slice(0, 10);
	const { from, to } = dayRange(today);

	const { data: products = [] } = useGetProductsQuery();
	const { data: todayTx = [] } = useGetTransactionsQuery({ from, to });

	const realizedTransaction = todayTx.reduce(
		(sum, transaction) => sum + transaction.final_price * transaction.quantity,
		0,
	);

	return (
		<div>
			<div className={page.pageHead}>
				<h1 className={page.pageTitle}>Beranda</h1>
			</div>

			<div className={page.grid4} style={{ marginBottom: 20 }}>
				<StatCard
					label='Transaksi hari ini'
					value={formatNumber(todayTx.length)}
				/>
				{user?.role === 'owner' && (
					<StatCard
						label='Omzet hari ini'
						value={formatRupiah(realizedTransaction)}
						tone='brass'
					/>
				)}
				<StatCard label='Total produk' value={formatNumber(products.length)} />
			</div>

			<div className={styles.quickRow}>
				<Link to='/transactions/new' className={styles.quickCard}>
					<span className={styles.quickTitle}>Catat Penjualan</span>
					<span className={styles.quickDesc}>
						Scan barcode atau cari produk
					</span>
				</Link>
				{user?.role === 'owner' && (
					<Link to='/stock-opname' className={styles.quickCard}>
						<span className={styles.quickTitle}>Stock Opname</span>
						<span className={styles.quickDesc}>Cek kesesuaian stok fisik</span>
					</Link>
				)}
			</div>
		</div>
	);
}
