import { useState } from 'react';
import { useGetRevenueReportQuery } from '../../features/reports/reportsApi';
import { StatCard } from '../../components/ui/Card';
import {
	formatRupiah,
	formatNumber,
	formatDateTime,
	calculateProfit,
	dayRange,
	monthRange,
} from '../../utils/format';
import page from '../../styles/page.module.css';
import styles from './ReportsPage.module.css';

type Mode = 'daily' | 'monthly';

export function ReportsPage() {
	const [mode, setMode] = useState<Mode>('daily');
	const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
	const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

	const range = mode === 'daily' ? dayRange(day) : monthRange(month);
	const { data, isLoading } = useGetRevenueReportQuery(range);

	return (
		<div>
			<div className={page.pageHead}>
				<h1 className={page.pageTitle}>Laporan Pendapatan</h1>
			</div>

			<div className={styles.controls}>
				<div className={styles.tabs}>
					<button
						className={[
							styles.tab,
							mode === 'daily' ? styles.tabActive : '',
						].join(' ')}
						onClick={() => setMode('daily')}
					>
						Harian
					</button>
					<button
						className={[
							styles.tab,
							mode === 'monthly' ? styles.tabActive : '',
						].join(' ')}
						onClick={() => setMode('monthly')}
					>
						Bulanan
					</button>
				</div>
				{mode === 'daily' ? (
					<input
						className={styles.dateInput}
						type='date'
						value={day}
						onChange={(event) => setDay(event.target.value)}
					/>
				) : (
					<input
						className={styles.dateInput}
						type='month'
						value={month}
						onChange={(event) => setMonth(event.target.value)}
					/>
				)}
			</div>

			{isLoading ? (
				<p>Memuat...</p>
			) : (
				<>
					<div className={page.grid4} style={{ marginBottom: 20 }}>
						<StatCard
							label='Total Omzet'
							value={formatRupiah(data?.summary.total_omzet ?? 0)}
							tone='brass'
						/>
						<StatCard
							label='Total HPP'
							value={formatRupiah(data?.summary.total_hpp ?? 0)}
						/>
						<StatCard
							label='Total Profit'
							value={formatRupiah(data?.summary.total_profit ?? 0)}
							tone={
								(data?.summary.total_profit ?? 0) < 0 ? 'danger' : 'success'
							}
						/>
						<StatCard
							label='Jumlah Transaksi'
							value={formatNumber(data?.summary.jumlah_transaksi ?? 0)}
						/>
					</div>

					{data && data.rows.length > 0 ? (
						<ul className={styles.list}>
							{data.rows.map((transaction) => {
								const profit = calculateProfit(
									transaction.final_price,
									transaction.base_price ?? 0,
									transaction.quantity,
								);
								return (
									<li key={transaction.transaction_id} className={styles.row}>
										<div className={styles.rowMain}>
											<span className={styles.rowName}>
												{transaction.brand_name} · {transaction.serial_number}
											</span>
											<span className={styles.rowDate}>
												{formatDateTime(transaction.transaction_time)}
											</span>
										</div>
										<div className={styles.rowFigs}>
											<span className='mono'>
												{formatRupiah(
													transaction.final_price * transaction.quantity,
												)}
											</span>
											<span
												className={`mono ${profit < 0 ? styles.neg : styles.pos}`}
											>
												{formatRupiah(profit)}
											</span>
										</div>
									</li>
								);
							})}
						</ul>
					) : (
						<div className={page.empty}>
							<p className={page.emptyTitle}>Tidak ada data</p>
							<p>Belum ada transaksi pada periode ini.</p>
						</div>
					)}
				</>
			)}
		</div>
	);
}
