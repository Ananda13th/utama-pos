import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout/AppLayout';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage/LoginPage';
import { DashboardPage } from '../pages/DashboardPage/DashboardPage';
import { ProductsPage } from '../pages/ProductsPage/ProductsPage';
import { ProductFormPage } from '../pages/ProductFormPage/ProductFormPage';
import { TransactionFormPage } from '../pages/TransactionFormPage/TransactionFormPage';
import { TransactionsPage } from '../pages/TransactionsPage/TransactionsPage';
import { ReportsPage } from '../pages/ReportsPage/ReportsPage';
import { StockOpnamePage } from '../pages/StockOpnamePage/StockOpnamePage';
import { StockOpnameResultPage } from '../pages/StockOpnameResultPage/StockOpnameResultPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage/UnauthorizedPage';

// Bungkus elemen dengan layout + proteksi role
const owner = (el: React.ReactNode) => (
  <ProtectedRoute allow={['owner']}>{el}</ProtectedRoute>
);
const auth = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  {
    path: '/',
    element: auth(<AppLayout />),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/new', element: owner(<ProductFormPage />) },
      { path: 'products/:id/edit', element: owner(<ProductFormPage />) },
      { path: 'transactions/new', element: <TransactionFormPage /> },
      { path: 'transactions', element: owner(<TransactionsPage />) },
      { path: 'reports', element: owner(<ReportsPage />) },
      { path: 'stock-opname', element: owner(<StockOpnamePage />) },
      { path: 'stock-opname/:id/result', element: owner(<StockOpnameResultPage />) },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
