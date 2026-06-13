import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../features/auth/authApi';
import { useAppDispatch } from '../../lib/hooks';
import { setUser } from '../../features/auth/authSlice';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import styles from './LoginPage.module.css';

export function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [formError, setFormError] = useState<string | null>(null);
	const [login, { isLoading }] = useLoginMutation();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setFormError(null);
		const result = await login({ email, password });
		if ('error' in result) {
			setFormError('Email atau password salah.');
			return;
		}
		dispatch(setUser(result.data));
		navigate('/dashboard', { replace: true });
	}

	return (
		<div className={styles.screen}>
			<div className={styles.card}>
				<div className={styles.brand}>
					<span className={styles.mark} aria-hidden='true' />
					<h1 className={styles.title}>Utama POS</h1>
					<p className={styles.subtitle}>Toko Jam Utama Arloji</p>
				</div>

				<form className={styles.form} onSubmit={handleSubmit} noValidate>
					<Input
						label='Email'
						name='email'
						type='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder='nama@utamaarloji.com'
						autoComplete='email'
						required
					/>
					<Input
						label='Password'
						name='password'
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder='Masukkan password'
						autoComplete='current-password'
						required
					/>
					{formError ? <p className={styles.error}>{formError}</p> : null}
					<Button type='submit' fullWidth loading={isLoading}>
						Masuk
					</Button>
				</form>
			</div>
		</div>
	);
}
