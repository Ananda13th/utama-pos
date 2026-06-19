import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../lib/hooks';
import type { RoleName } from '../../types';

interface Props {
	children: ReactNode;
	allow?: RoleName[];
}

export function ProtectedRoute({ children, allow }: Props) {
	const { user, initializing } = useAppSelector((s) => s.auth);

	if (initializing) return null;

	if (!user) return <Navigate to='/login' replace />;

	if (allow && !allow.includes(user.role)) {
		return <Navigate to='/unauthorized' replace />;
	}

	return <>{children}</>;
}
