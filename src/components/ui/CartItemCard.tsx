import styles from './CartItemCard.module.css';
import { formatCurrency } from '../../utils/format';
import { CartItem } from '../../types';

interface StatProps {
	cartItem: CartItem;
	onRemove: () => void;
}

export function CartItemCard({ cartItem: product, onRemove }: StatProps) {
	return (
		<div className={styles.card}>
			<div>
				<span className={styles.statLabel}>
					{product.brand_name} · {product.serial_number}
				</span>
			</div>
			<div className={styles.statLabel}>Qty: {product.quantity}</div>
			<div className={`${styles.statLabel} mono`}>
				{formatCurrency(product.final_price * product.quantity)}
			</div>
			<button
				type='button'
				className={styles.cartRemove}
				onClick={onRemove}
				aria-label={`Hapus ${product.brand_name} dari keranjang`}
			>
				Hapus
			</button>
		</div>
	);
}
