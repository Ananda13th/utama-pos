import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	useGetProductsQuery,
	useLazyGetProductByBarcodeQuery,
} from '../../features/products/productsApi';
import { useRecordOrderMutation } from '../../features/transactions/transactionsApi';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import {
	addTransaction,
	removeTransaction,
	clearTransaction,
} from '../../features/transactions/transactionsSlice';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { BarcodeScanner } from '../../components/BarcodeScanner/BarcodeScanner';
import { formatCurrency, calculateProfit } from '../../utils/format';
import type { Product } from '../../types';
import page from '../../styles/page.module.css';
import styles from './TransactionFormPage.module.css';
import { CartItemCard } from '../../components/ui/CartItemCard';

export function TransactionFormPage() {
	const navigate = useNavigate();
	const toast = useToast();
	const dispatch = useAppDispatch();
	const cart = useAppSelector((s) => s.transactions.items);

	const { data: products = [] } = useGetProductsQuery();
	const [lookupBarcode] = useLazyGetProductByBarcodeQuery();
	const [recordOrder] = useRecordOrderMutation();

	const [selected, setSelected] = useState<Product | null>(null);
	const [search, setSearch] = useState('');
	const [showScanner, setShowScanner] = useState(false);
	const [finalPrice, setFinalPrice] = useState<number>(0);
	const [quantity, setQuantity] = useState<number>(1);
	const [checkingOut, setCheckingOut] = useState(false);

	const searchResults =
		search.length >= 2 && !selected
			? products
					.filter((p) => {
						const q = search.toLowerCase();
						return (
							p.brand_name.toLowerCase().includes(q) ||
							p.serial_number.toLowerCase().includes(q)
						);
					})
					.slice(0, 6)
			: [];

	function resetForm() {
		setSelected(null);
		setFinalPrice(0);
		setQuantity(1);
		setSearch('');
		setShowScanner(false);
	}

	function selectProduct(p: Product) {
		setSelected(p);
		setFinalPrice(p.base_price);
		setQuantity(1);
		setSearch('');
		setShowScanner(false);
	}

	async function handleScan(barcode: string) {
		const result = await lookupBarcode(barcode);
		if ('data' in result && result.data) {
			selectProduct(result.data);
			toast('Produk ditemukan.', 'success');
		} else {
			toast('Barcode tidak terdaftar.', 'error');
		}
	}

	const reservedInCart = selected
		? cart
				.filter((i) => i.product_id === selected.product_id)
				.reduce((sum, i) => sum + i.quantity, 0)
		: 0;
	const availableForForm = selected
		? selected.available_stock - reservedInCart
		: 0;

	const belowCost = selected ? finalPrice < selected.base_price : false;
	const stockShort = selected ? quantity > availableForForm : false;
	const profit = selected
		? calculateProfit(finalPrice, selected.base_price, quantity)
		: 0;

	function handleTambahBarang(e: FormEvent) {
		e.preventDefault();
		if (!selected) return;
		if (stockShort) {
			toast('Stok tidak mencukupi.', 'error');
			return;
		}
		dispatch(
			addTransaction({
				product_id: selected.product_id,
				brand_name: selected.brand_name,
				serial_number: selected.serial_number,
				base_price: selected.base_price,
				final_price: finalPrice,
				quantity,
			}),
		);
		toast('Barang ditambahkan ke keranjang.', 'success');
		resetForm();
	}

	async function handleSelesaikanPesanan() {
		if (cart.length === 0) {
			toast('Keranjang masih kosong.', 'warning');
			return;
		}

		setCheckingOut(true);
		const result = await recordOrder(
			cart.map((item) => ({
				product_id: item.product_id,
				final_price: item.final_price,
				quantity: item.quantity,
			})),
		);
		setCheckingOut(false);

		if ('error' in result) {
			toast(
				`Pesanan gagal disimpan: ${(result.error as { message: string }).message}`,
				'error',
			);
			return;
		}

		dispatch(clearTransaction());
		toast('Pesanan berhasil disimpan.', 'success');
		navigate('/dashboard');
	}

	const cartTotal = cart.reduce(
		(sum, i) => sum + i.final_price * i.quantity,
		0,
	);

	return (
		<div>
			<div className={page.pageHead}>
				<h1 className={page.pageTitle}>Catat Penjualan</h1>
			</div>

			{!selected ? (
				<div className={styles.picker}>
					<Button
						variant='secondary'
						fullWidth
						onClick={() => setShowScanner((s) => !s)}
					>
						{showScanner ? 'Tutup pemindai' : 'Pindai barcode produk'}
					</Button>
					{showScanner && <BarcodeScanner onDetected={handleScan} />}

					<div className={styles.divider}>
						<span>atau cari manual</span>
					</div>

					<Input
						label=''
						name='search'
						placeholder='Ketik merk atau serial number'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					{searchResults.length > 0 && (
						<ul className={styles.results}>
							{searchResults.map((p) => (
								<li key={p.product_id}>
									<button
										className={styles.resultItem}
										onClick={() => selectProduct(p)}
									>
										<div>
											<span className={styles.resName}>
												{p.brand_name} · {p.serial_number}
											</span>
											<span className={styles.resStock}>
												Stok: {p.available_stock}
											</span>
										</div>
										<span className={`${styles.resPrice} mono`}>
											{formatCurrency(p.base_price)}
										</span>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			) : (
				<form
					className={page.formStack}
					onSubmit={handleTambahBarang}
					noValidate
				>
					<div className={styles.selectedCard}>
						<div>
							<span className={styles.selName}>{selected.brand_name}</span>
							<span className={styles.selSerial}>{selected.serial_number}</span>
						</div>
						<button
							type='button'
							className={styles.changeBtn}
							onClick={resetForm}
						>
							Ganti
						</button>
					</div>

					<div className={styles.infoRow}>
						<span>Harga pokok</span>
						<span className='mono'>{formatCurrency(selected.base_price)}</span>
					</div>
					<div className={styles.infoRow}>
						<span>
							Stok tersedia
							{reservedInCart > 0 ? ' (sudah dikurangi keranjang)' : ''}
						</span>
						<span className='mono'>{availableForForm} unit</span>
					</div>

					<Input
						label='Harga Jual'
						name='final_price'
						type='number'
						inputMode='numeric'
						value={finalPrice || ''}
						onChange={(e) => setFinalPrice(Number(e.target.value))}
					/>
					{belowCost && (
						<p className={styles.warning}>
							Harga jual di bawah harga pokok. Transaksi tetap bisa disimpan,
							tapi akan merugi.
						</p>
					)}

					<Input
						label='Jumlah'
						name='quantity'
						type='text'
						inputMode='numeric'
						value={quantity || ''}
						onChange={(e) => {
							const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
							setQuantity(Number(digitsOnly));
						}}
						error={stockShort ? 'Melebihi stok tersedia' : undefined}
					/>

					<div className={styles.summary}>
						<div className={styles.sumRow}>
							<span>Subtotal</span>
							<span className='mono'>
								{formatCurrency(finalPrice * quantity)}
							</span>
						</div>
						<div className={styles.sumRow}>
							<span>Estimasi profit</span>
							<span
								className={`mono ${profit < 0 ? styles.negative : styles.positive}`}
							>
								{formatCurrency(profit)}
							</span>
						</div>
					</div>

					<Button type='submit' disabled={stockShort}>
						Tambah Barang
					</Button>
				</form>
			)}

			{cart.length > 0 && (
				<div className={styles.cartBox}>
					<h2 className={styles.cartTitle}>Keranjang ({cart.length} item)</h2>
					<ul className={styles.cartList}>
						{cart.map((item) => (
							<CartItemCard
								key={item.cart_item_id}
								cartItem={item}
								onRemove={() => dispatch(removeTransaction(item.cart_item_id))}
							/>
						))}
					</ul>

					<div className={styles.cartTotalRow}>
						<span className='mono'>Total Pesanan : </span>
						<span className='mono'>{formatCurrency(cartTotal)}</span>
					</div>

					<div className={page.actions}>
						<Button
							variant='ghost'
							type='button'
							onClick={() => {
								if (confirm('Kosongkan keranjang?'))
									dispatch(clearTransaction());
							}}
						>
							Kosongkan
						</Button>
						<Button
							type='button'
							loading={checkingOut}
							onClick={handleSelesaikanPesanan}
						>
							Selesaikan Pesanan
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
