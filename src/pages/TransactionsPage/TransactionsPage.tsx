import { useGetTransactionsQuery } from '../../features/transactions/transactionsApi';
import {
	formatCurrency,
	formatDateTime,
	calculateProfit,
} from '../../utils/format';
import page from '../../styles/page.module.css';
import styles from './TransactionsPage.module.css';

export function TransactionsPage() {
	const { data: transactions = [], isLoading } = useGetTransactionsQuery();

	return (
		<div>
			<div className={page.pageHead}>
				<h1 className={page.pageTitle}>Riwayat Transaksi</h1>
			</div>

			{isLoading ? (
				<p>Memuat...</p>
			) : transactions.length === 0 ? (
				<div className={page.empty}>
					<p className={page.emptyTitle}>Belum ada transaksi</p>
					<p>Transaksi yang tercatat akan muncul di sini.</p>
				</div>
			) : (
				<ul className={styles.list}>
					{transactions.map((transaction) => {
						const profit = calculateProfit(
							transaction.final_price,
							transaction.base_price ?? 0,
							transaction.quantity,
						);
						return (
							<li key={transaction.transaction_id} className={styles.item}>
								<div className={styles.head}>
									<span className={styles.name}>
										{transaction.brand_name} · {transaction.serial_number}
									</span>
									<span className={`${styles.price} mono`}>
										{formatCurrency(
											transaction.final_price * transaction.quantity,
										)}
									</span>
								</div>
								<div className={styles.meta}>
									<span>{formatDateTime(transaction.transaction_time)}</span>
									<span>Qty: {transaction.quantity}</span>
									<span className={profit < 0 ? styles.neg : styles.pos}>
										Profit {formatCurrency(profit)}
									</span>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
