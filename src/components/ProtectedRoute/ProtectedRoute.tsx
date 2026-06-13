import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../lib/hooks';
import type { RoleName } from '../../types';

interface Props {
  children: ReactNode;
  // jika diisi, hanya role tertentu yang boleh akses
  allow?: RoleName[];
}

// Membungkus halaman yang memerlukan autentikasi (dan opsional role tertentu)
export function ProtectedRoute({ children, allow }: Props) {
  const { user, initializing } = useAppSelector((s) => s.auth);

  if (initializing) return null; // splash sederhana; bisa diganti loader

  if (!user) return <Navigate to="/login" replace />;

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
