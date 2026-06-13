import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import styles from './UnauthorizedPage.module.css';

export function UnauthorizedPage() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Akses ditolak</h1>
      <p className={styles.text}>Halaman ini hanya bisa diakses oleh owner.</p>
      <Link to="/dashboard"><Button>Kembali ke Beranda</Button></Link>
    </div>
  );
}
