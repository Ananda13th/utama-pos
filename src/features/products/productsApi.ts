import { api } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import type { Product, ProductInput } from '../../types';

interface RawProduct {
  product_id: string;
  brand_id: string;
  serial_number: string;
  barcode: string;
  base_price: number;
  available_stock: number;
  created_at: string;
  updated_at: string;
  brands: { brand_name: string } | { brand_name: string }[] | null;
}

function mapProduct(row: RawProduct): Product {
  const brandRel = row.brands;
  const brand_name = Array.isArray(brandRel)
    ? brandRel[0]?.brand_name ?? ''
    : brandRel?.brand_name ?? '';
  return {
    product_id: row.product_id,
    brand_id: row.brand_id,
    brand_name,
    serial_number: row.serial_number,
    barcode: row.barcode,
    base_price: Number(row.base_price),
    available_stock: row.available_stock,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const SELECT = '*, brands(brand_name)';

export const productsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<Product[], void>({
      async queryFn() {
        const { data, error } = await supabase
          .from('products')
          .select(SELECT)
          .order('created_at', { ascending: false });
        if (error) return { error: { message: error.message } };
        return { data: (data as RawProduct[]).map(mapProduct) };
      },
      providesTags: ['Product'],
    }),

    getProductById: build.query<Product, string>({
      async queryFn(id) {
        const { data, error } = await supabase
          .from('products')
          .select(SELECT)
          .eq('product_id', id)
          .single();
        if (error) return { error: { message: error.message } };
        return { data: mapProduct(data as RawProduct) };
      },
      providesTags: (_response, _error, id) => [{ type: 'Product', id }],
    }),

    getProductByBarcode: build.query<Product | null, string>({
      async queryFn(barcode) {
        const { data, error } = await supabase
          .from('products')
          .select(SELECT)
          .eq('barcode', barcode)
          .maybeSingle();
        if (error) return { error: { message: error.message } };
        return { data: data ? mapProduct(data as RawProduct) : null };
      },
    }),

    addProduct: build.mutation<Product, ProductInput>({
      async queryFn(input) {
        const { data, error } = await supabase
          .from('products')
          .insert(input)
          .select(SELECT)
          .single();
        if (error) return { error: { message: friendlyError(error.message) } };
        return { data: mapProduct(data as RawProduct) };
      },
      invalidatesTags: ['Product'],
    }),

    updateProduct: build.mutation<Product, { id: string; input: ProductInput }>({
      async queryFn({ id, input }) {
        const { data, error } = await supabase
          .from('products')
          .update(input)
          .eq('product_id', id)
          .select(SELECT)
          .single();
        if (error) return { error: { message: friendlyError(error.message) } };
        return { data: mapProduct(data as RawProduct) };
      },
      invalidatesTags: (_r, _e, { id }) => ['Product', { type: 'Product', id }],
    }),

    deleteProduct: build.mutation<string, string>({
      async queryFn(id) {
        const { error } = await supabase.from('products').delete().eq('product_id', id);
        if (error) {
          const msg = error.message.includes('foreign key')
            ? 'Produk tidak bisa dihapus karena sudah ada transaksi terkait.'
            : error.message;
          return { error: { message: msg } };
        }
        return { data: id };
      },
      invalidatesTags: ['Product'],
    }),
  }),
});

function friendlyError(message: string): string {
  if (message.includes('products_barcode_key')) return 'Barcode sudah terdaftar.';
  if (message.includes('products_serial_number_key')) return 'Serial number sudah terdaftar.';
  return message;
}

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useLazyGetProductByBarcodeQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
