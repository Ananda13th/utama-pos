import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetProductsQuery,
  useLazyGetProductByBarcodeQuery,
} from '../../features/products/productsApi';
import { useRecordTransactionMutation } from '../../features/transactions/transactionsApi';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { BarcodeScanner } from '../../components/BarcodeScanner/BarcodeScanner';
import { formatRupiah, calculateProfit } from '../../utils/format';
import type { Product } from '../../types';
import page from '../../styles/page.module.css';
import styles from './TransactionFormPage.module.css';

export function TransactionFormPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: products = [] } = useGetProductsQuery();
  const [lookupBarcode] = useLazyGetProductByBarcodeQuery();
  const [recordTransaction, { isLoading }] = useRecordTransactionMutation();

  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  const searchResults =
    search.length >= 2 && !selected
      ? products.filter((p) => {
          const q = search.toLowerCase();
          return (
            p.brand_name.toLowerCase().includes(q) ||
            p.serial_number.toLowerCase().includes(q)
          );
        }).slice(0, 6)
      : [];

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

  const belowCost = selected ? finalPrice < selected.base_price : false;
  const stockShort = selected ? quantity > selected.available_stock : false;
  const profit = selected ? calculateProfit(finalPrice, selected.base_price, quantity) : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (stockShort) {
      toast('Stok tidak mencukupi.', 'error');
      return;
    }
    const result = await recordTransaction({
      product_id: selected.product_id,
      final_price: finalPrice,
      quantity,
    });
    if ('error' in result) {
      toast((result.error as { message: string }).message, 'error');
      return;
    }
    toast('Transaksi berhasil disimpan.', 'success');
    navigate('/dashboard');
  }

  return (
    <div>
      <div className={page.pageHead}>
        <h1 className={page.pageTitle}>Catat Penjualan</h1>
      </div>

      {!selected ? (
        <div className={styles.picker}>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowScanner((s) => !s)}
          >
            {showScanner ? 'Tutup pemindai' : 'Pindai barcode produk'}
          </Button>
          {showScanner && <BarcodeScanner onDetected={handleScan} />}

          <div className={styles.divider}><span>atau cari manual</span></div>

          <Input
            label=""
            name="search"
            placeholder="Ketik merk atau serial number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <ul className={styles.results}>
              {searchResults.map((p) => (
                <li key={p.product_id}>
                  <button className={styles.resultItem} onClick={() => selectProduct(p)}>
                    <div>
                      <span className={styles.resName}>{p.brand_name} · {p.serial_number}</span>
                      <span className={styles.resStock}>Stok: {p.available_stock}</span>
                    </div>
                    <span className={`${styles.resPrice} mono`}>{formatRupiah(p.base_price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <form className={page.formStack} onSubmit={handleSubmit} noValidate>
          <div className={styles.selectedCard}>
            <div>
              <span className={styles.selName}>{selected.brand_name}</span>
              <span className={styles.selSerial}>{selected.serial_number}</span>
            </div>
            <button type="button" className={styles.changeBtn} onClick={() => setSelected(null)}>
              Ganti
            </button>
          </div>

          <div className={styles.infoRow}>
            <span>Harga pokok</span>
            <span className="mono">{formatRupiah(selected.base_price)}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Stok tersedia</span>
            <span className="mono">{selected.available_stock} unit</span>
          </div>

          <Input
            label="Harga Jual"
            name="final_price"
            type="number"
            inputMode="numeric"
            value={finalPrice || ''}
            onChange={(e) => setFinalPrice(Number(e.target.value))}
          />
          {belowCost && (
            <p className={styles.warning}>
              Harga jual di bawah harga pokok. Transaksi tetap bisa disimpan, tapi akan merugi.
            </p>
          )}

          <Input
            label="Jumlah"
            name="quantity"
            type="number"
            inputMode="numeric"
            value={quantity || ''}
            onChange={(e) => setQuantity(Number(e.target.value))}
            error={stockShort ? 'Melebihi stok tersedia' : undefined}
          />

          <div className={styles.summary}>
            <div className={styles.sumRow}>
              <span>Total</span>
              <span className="mono">{formatRupiah(finalPrice * quantity)}</span>
            </div>
            <div className={styles.sumRow}>
              <span>Estimasi profit</span>
              <span className={`mono ${profit < 0 ? styles.negative : styles.positive}`}>
                {formatRupiah(profit)}
              </span>
            </div>
          </div>

          <Button type="submit" loading={isLoading} disabled={stockShort}>
            Simpan Transaksi
          </Button>
        </form>
      )}
    </div>
  );
}
