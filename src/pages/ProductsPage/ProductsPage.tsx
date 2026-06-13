import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
	useGetProductsQuery,
	useDeleteProductMutation,
} from '../../features/products/productsApi';
import { useAppSelector } from '../../lib/hooks';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatRupiah } from '../../utils/format';
import page from '../../styles/page.module.css';
import styles from './ProductsPage.module.css';

export function ProductsPage() {
	const { data: products = [], isLoading } = useGetProductsQuery();
	const [deleteProduct] = useDeleteProductMutation();
	const isOwner = useAppSelector((s) => s.auth.user?.role === 'owner');
	const toast = useToast();
	const navigate = useNavigate();
	const [search, setSearch] = useState('');

	const filtered = products.filter((product) => {
		const q = search.toLowerCase();
		return (
			product.brand_name.toLowerCase().includes(q) ||
			product.serial_number.toLowerCase().includes(q) ||
			product.barcode.includes(q)
		);
	});

	async function handleDelete(id: string, name: string) {
		if (!confirm(`Hapus produk ${name}? Tindakan ini tidak bisa dibatalkan.`))
			return;
		const result = await deleteProduct(id);
		if ('error' in result) {
			toast((result.error as { message: string }).message, 'error');
		} else {
			toast('Produk dihapus.', 'success');
		}
	}

	return (
		<div>
			<div className={page.pageHead}>
				<h1 className={page.pageTitle}>Produk</h1>
				{isOwner && (
					<Button onClick={() => navigate('/products/new')}>
						Tambah Produk
					</Button>
				)}
			</div>

			<div className={styles.searchBar}>
				<Input
					label=''
					name='search'
					placeholder='Cari merk, serial, atau barcode'
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			{isLoading ? (
				<div className={styles.skeleton}>
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className={styles.skelRow} />
					))}
				</div>
			) : filtered.length === 0 ? (
				<div className={page.empty}>
					<p className={page.emptyTitle}>
						{products.length === 0 ? 'Belum ada produk' : 'Tidak ada hasil'}
					</p>
					<p>
						{products.length === 0
							? 'Mulai dengan menambahkan produk pertama.'
							: 'Coba kata kunci lain.'}
					</p>
				</div>
			) : (
				<ul className={styles.list}>
					{filtered.map((p) => (
						<li key={p.product_id} className={styles.item}>
							<div className={styles.itemMain}>
								<span className={styles.brand}>{p.brand_name}</span>
								<span className={styles.serial}>{p.serial_number}</span>
								<span className={styles.barcode}>{p.barcode}</span>
							</div>
							<div className={styles.itemMeta}>
								<span className={`${styles.price} mono`}>
									{formatRupiah(p.base_price)}
								</span>
								<span
									className={[
										styles.stock,
										'mono',
										p.available_stock <= 1 ? styles.stockLow : '',
									].join(' ')}
								>
									{p.available_stock} unit
								</span>
							</div>
							{isOwner && (
								<div className={styles.itemActions}>
									<Link
										to={`/products/${p.product_id}/edit`}
										className={styles.editLink}
									>
										Edit
									</Link>
									<button
										className={styles.deleteBtn}
										onClick={() =>
											handleDelete(
												p.product_id,
												`${p.brand_name} ${p.serial_number}`,
											)
										}
									>
										Hapus
									</button>
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
