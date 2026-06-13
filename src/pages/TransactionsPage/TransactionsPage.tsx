import { useGetTransactionsQuery } from '../../features/transactions/transactionsApi';
import { formatRupiah, formatDateTime, calculateProfit } from '../../utils/format';
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
          {transactions.map((t) => {
            const profit = calculateProfit(t.final_price, t.base_price ?? 0, t.quantity);
            return (
              <li key={t.transaction_id} className={styles.item}>
                <div className={styles.head}>
                  <span className={styles.name}>
                    {t.brand_name} · {t.serial_number}
                  </span>
                  <span className={`${styles.price} mono`}>{formatRupiah(t.final_price * t.quantity)}</span>
                </div>
                <div className={styles.meta}>
                  <span>{formatDateTime(t.transaction_time)}</span>
                  <span>Qty: {t.quantity}</span>
                  <span className={profit < 0 ? styles.neg : styles.pos}>
                    Profit {formatRupiah(profit)}
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
