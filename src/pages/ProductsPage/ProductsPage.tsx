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
	const isOwner = useAppSelector(
		(stateSelector) => stateSelector.auth.user?.role === 'owner',
	);
	const toast = useToast();
	const navigate = useNavigate();
	const [search, setSearch] = useState('');

	const filteredProducts = products.filter((product) => {
		const query = search.toLowerCase();
		return (
			product.brand_name.toLowerCase().includes(query) ||
			product.serial_number.toLowerCase().includes(query) ||
			product.barcode.includes(query)
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
					onChange={(event) => setSearch(event.target.value)}
				/>
			</div>

			{isLoading ? (
				<div className={styles.skeleton}>
					{Array.from({ length: 4 }).map((_, index) => (
						<div key={index} className={styles.skelRow} />
					))}
				</div>
			) : filteredProducts.length === 0 ? (
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
					{filteredProducts.map((filteredProduct) => (
						<li key={filteredProduct.product_id} className={styles.item}>
							<div className={styles.itemMain}>
								<span className={styles.brand}>
									{filteredProduct.brand_name}
								</span>
								<span className={styles.serial}>
									{filteredProduct.serial_number}
								</span>
								<span className={styles.barcode}>
									{filteredProduct.barcode}
								</span>
							</div>
							<div className={styles.itemMeta}>
								<span className={`${styles.price} mono`}>
									{formatRupiah(filteredProduct.base_price)}
								</span>
								<span
									className={[
										styles.stock,
										'mono',
										filteredProduct.available_stock <= 1 ? styles.stockLow : '',
									].join(' ')}
								>
									{filteredProduct.available_stock} unit
								</span>
							</div>
							{isOwner && (
								<div className={styles.itemActions}>
									<Link
										to={`/products/${filteredProduct.product_id}/edit`}
										className={styles.editLink}
									>
										Edit
									</Link>
									<button
										className={styles.deleteBtn}
										onClick={() =>
											handleDelete(
												filteredProduct.product_id,
												`${filteredProduct.brand_name} ${filteredProduct.serial_number}`,
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
