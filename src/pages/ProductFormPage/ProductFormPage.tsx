import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	useAddProductMutation,
	useUpdateProductMutation,
	useGetProductByIdQuery,
} from '../../features/products/productsApi';
import {
	useGetBrandsQuery,
	useAddBrandMutation,
} from '../../features/brands/brandsApi';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { BarcodeScanner } from '../../components/BarcodeScanner/BarcodeScanner';
import type { ProductInput } from '../../types';
import page from '../../styles/page.module.css';

const ADD_BRAND = '__add_brand__';

interface Errors {
	brand_id?: string;
	serial_number?: string;
	barcode?: string;
	base_price?: string;
	available_stock?: string;
}

export function ProductFormPage() {
	const { id } = useParams();
	const isEdit = Boolean(id);
	const navigate = useNavigate();
	const toast = useToast();

	const { data: brands = [] } = useGetBrandsQuery();
	const { data: existing } = useGetProductByIdQuery(id!, { skip: !isEdit });
	const [addProduct, { isLoading: adding }] = useAddProductMutation();
	const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
	const [addBrand] = useAddBrandMutation();

	const [form, setForm] = useState<ProductInput>({
		brand_id: '',
		serial_number: '',
		barcode: '',
		base_price: 0,
		available_stock: 0,
	});
	const [errors, setErrors] = useState<Errors>({});
	const [showScanner, setShowScanner] = useState(false);

	// Isi form saat data edit tersedia
	useEffect(() => {
		if (existing) {
			setForm({
				brand_id: existing.brand_id,
				serial_number: existing.serial_number,
				barcode: existing.barcode,
				base_price: existing.base_price,
				available_stock: existing.available_stock,
			});
		}
	}, [existing]);

	function validate(): boolean {
		const e: Errors = {};
		if (!form.brand_id) e.brand_id = 'Pilih merk';
		if (form.serial_number.trim().length < 2)
			e.serial_number = 'Serial number minimal 2 karakter';
		if (!form.barcode.trim()) e.barcode = 'Barcode wajib diisi';
		if (form.base_price <= 0) e.base_price = 'Harga pokok harus lebih dari 0';
		if (form.available_stock < 0)
			e.available_stock = 'Stok tidak boleh negatif';
		setErrors(e);
		return Object.keys(e).length === 0;
	}

	async function handleBrandChange(value: string) {
		if (value === ADD_BRAND) {
			const name = prompt('Nama merk baru:');
			if (name && name.trim()) {
				const result = await addBrand(name.trim());
				if ('data' in result && result.data) {
					setForm((formValue) => ({
						...formValue,
						brand_id: result.data.brand_id,
					}));
					toast('Merk ditambahkan.', 'success');
				} else {
					toast((result.error as { message: string }).message, 'error');
				}
			}
			return;
		}
		setForm((formValue) => ({ ...formValue, brand_id: value }));
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		if (!validate()) return;

		const result = isEdit
			? await updateProduct({ id: id!, input: form })
			: await addProduct(form);

		if ('error' in result) {
			const msg = (result.error as { message: string }).message;

			if (msg.includes('Barcode'))
				setErrors((event) => ({ ...event, barcode: msg }));
			else if (msg.includes('Serial'))
				setErrors((event) => ({ ...event, serial_number: msg }));
			else toast(msg, 'error');
			return;
		}

		toast(isEdit ? 'Produk diperbarui.' : 'Produk ditambahkan.', 'success');
		navigate('/products');
	}

	return (
		<div>
			<div className={page.pageHead}>
				<h1 className={page.pageTitle}>
					{isEdit ? 'Edit Produk' : 'Tambah Produk'}
				</h1>
			</div>

			<form className={page.formStack} onSubmit={handleSubmit} noValidate>
				<Select
					label='Merk'
					name='brand_id'
					value={form.brand_id}
					onChange={(event) => handleBrandChange(event.target.value)}
					error={errors.brand_id}
				>
					<option value=''>Pilih merk</option>
					{brands.map((brand) => (
						<option key={brand.brand_id} value={brand.brand_id}>
							{brand.brand_name}
						</option>
					))}
					<option value={ADD_BRAND}>+ Tambah merk baru</option>
				</Select>

				<Input
					label='Serial Number'
					name='serial_number'
					value={form.serial_number}
					onChange={(event) =>
						setForm((formValue) => ({
							...formValue,
							serial_number: event.target.value,
						}))
					}
					placeholder='mis. GA-2200-1A'
					error={errors.serial_number}
				/>

				<Input
					label='Barcode'
					name='barcode'
					value={form.barcode}
					onChange={(event) =>
						setForm((formValue) => ({
							...formValue,
							barcode: event.target.value,
						}))
					}
					placeholder='Ketik manual atau pindai'
					error={errors.barcode}
				/>
				<Button
					type='button'
					variant='ghost'
					onClick={() => setShowScanner((show) => !show)}
				>
					{showScanner ? 'Tutup pemindai' : 'Pindai barcode'}
				</Button>
				{showScanner && (
					<BarcodeScanner
						onDetected={(code) => {
							setForm((formValue) => ({ ...formValue, barcode: code }));
							setShowScanner(false);
							toast('Barcode terbaca.', 'success');
						}}
					/>
				)}

				<div className={page.formRow}>
					<Input
						label='Harga Pokok'
						name='base_price'
						type='number'
						inputMode='numeric'
						value={form.base_price || ''}
						onChange={(event) =>
							setForm((formValue) => ({
								...formValue,
								base_price: Number(event.target.value),
							}))
						}
						placeholder='0'
						error={errors.base_price}
					/>
					<Input
						label='Stok Awal'
						name='available_stock'
						type='number'
						inputMode='numeric'
						value={form.available_stock || ''}
						onChange={(event) =>
							setForm((formValue) => ({
								...formValue,
								available_stock: Number(event.target.value),
							}))
						}
						placeholder='0'
						error={errors.available_stock}
					/>
				</div>

				<div className={page.actions}>
					<Button type='submit' loading={adding || updating}>
						{isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
					</Button>
					<Button
						type='button'
						variant='secondary'
						onClick={() => navigate('/products')}
					>
						Batal
					</Button>
				</div>
			</form>
		</div>
	);
}
