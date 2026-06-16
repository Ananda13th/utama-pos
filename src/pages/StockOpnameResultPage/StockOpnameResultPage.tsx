import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetReconciliationQuery } from '../../features/stockOpname/stockOpnameApi';
import { StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatNumber } from '../../utils/format';
import type { ReconciliationRow } from '../../types';
import page from '../../styles/page.module.css';
import styles from './StockOpnameResultPage.module.css';

type Filter = 'all' | 'diff' | 'match';

export function StockOpnameResultPage() {
	const { id } = useParams();
	const { data: rows = [], isLoading } = useGetReconciliationQuery(id!);
	const [filter, setFilter] = useState<Filter>('diff');

	const total = rows.length;
	const match = rows.filter((recon) => recon.selisih === 0).length;
	const diff = rows.filter((recon) => recon.selisih !== 0).length;

	const shown = rows.filter((recon) => {
		if (filter === 'diff') return recon.selisih !== 0;
		if (filter === 'match') return recon.selisih === 0;
		return true;
	});

	function rowClass(recon: ReconciliationRow): string {
		if (recon.selisih < 0 && recon.scanned_qty === 0) return styles.missing;
		if (recon.selisih < 0) return styles.short;
		if (recon.selisih > 0) return styles.over;
		return '';
	}

	return (
		<div>
			<div className={page.pageHead}>
				<h1 className={page.pageTitle}>Laporan Rekonsiliasi</h1>
				<Link to='/stock-opname'>
					<Button variant='secondary'>Selesai</Button>
				</Link>
			</div>

			{isLoading ? (
				<p>Memuat...</p>
			) : (
				<>
					<div className={page.grid4} style={{ marginBottom: 20 }}>
						<StatCard label='Total produk' value={formatNumber(total)} />
						<StatCard
							label='Sesuai'
							value={formatNumber(match)}
							tone='success'
						/>
						<StatCard
							label='Selisih'
							value={formatNumber(diff)}
							tone={diff > 0 ? 'danger' : 'default'}
						/>
					</div>

					<div className={styles.tabs}>
						{(['diff', 'all', 'match'] as Filter[]).map((filter) => (
							<button
								key={filter}
								className={[
									styles.tab,
									filter === filter ? styles.tabActive : '',
								].join(' ')}
								onClick={() => setFilter(filter)}
							>
								{filter === 'diff'
									? 'Hanya selisih'
									: filter === 'all'
										? 'Semua'
										: 'Sesuai'}
							</button>
						))}
					</div>

					{shown.length === 0 ? (
						<div className={page.empty}>
							<p className={page.emptyTitle}>
								{filter === 'diff' ? 'Semua stok sesuai!' : 'Tidak ada data'}
							</p>
						</div>
					) : (
						<div className={styles.tableWrap}>
							<table className={styles.table}>
								<thead>
									<tr>
										<th>Merk / Serial</th>
										<th className={styles.num}>Sistem</th>
										<th className={styles.num}>Fisik</th>
										<th className={styles.num}>Selisih</th>
									</tr>
								</thead>
								<tbody>
									{shown.map((recon) => (
										<tr key={recon.product_id} className={rowClass(recon)}>
											<td>
												<span className={styles.tName}>{recon.brand_name}</span>
												<span className={styles.tSerial}>
													{recon.serial_number}
												</span>
											</td>
											<td className={`${styles.num} mono`}>
												{recon.expected_qty}
											</td>
											<td className={`${styles.num} mono`}>
												{recon.scanned_qty}
											</td>
											<td className={`${styles.num} mono ${styles.selisih}`}>
												{recon.selisih > 0
													? `+${recon.selisih}`
													: recon.selisih}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}
		</div>
	);
}
