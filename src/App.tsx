import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ToastHost } from './components/Toast/ToastHost';
import { useAppDispatch } from './lib/hooks';
import { setUser, setInitializing } from './features/auth/authSlice';
import { useGetCurrentUserQuery } from './features/auth/authApi';

function AuthBootstrap() {
  const dispatch = useAppDispatch();
  // Pulihkan session saat aplikasi pertama dibuka
  const { data, isLoading, isSuccess, isError } = useGetCurrentUserQuery();

  useEffect(() => {
    if (isSuccess) {
      dispatch(setUser(data ?? null));
      dispatch(setInitializing(false));
    }
    if (isError) {
      dispatch(setUser(null));
      dispatch(setInitializing(false));
    }
  }, [isSuccess, isError, data, dispatch]);

  if (isLoading) return null;
  return null;
}

export function App() {
  return (
    <>
      <AuthBootstrap />
      <RouterProvider router={router} />
      <ToastHost />
    </>
  );
}
