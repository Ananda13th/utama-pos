import { api } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import type { Transaction } from '../../types';

interface RawTransaction {
  transaction_id: string;
  user_id: string;
  product_id: string;
  transaction_time: string;
  final_price: number;
  quantity: number;
  products: {
    serial_number: string;
    base_price: number;
    brands: { brand_name: string } | { brand_name: string }[] | null;
  } | null;
}

function mapTransaction(row: RawTransaction): Transaction {
  const p = row.products;
  const brandRel = p?.brands;
  const brand_name = Array.isArray(brandRel)
    ? brandRel[0]?.brand_name
    : brandRel?.brand_name;
  return {
    transaction_id: row.transaction_id,
    user_id: row.user_id,
    product_id: row.product_id,
    transaction_time: row.transaction_time,
    final_price: Number(row.final_price),
    quantity: row.quantity,
    serial_number: p?.serial_number,
    base_price: p ? Number(p.base_price) : undefined,
    brand_name,
  };
}

const SELECT =
  '*, products(serial_number, base_price, brands(brand_name))';

export const transactionsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Catat transaksi via RPC atomic (insert + kurangi stok)
    recordTransaction: build.mutation<
      string,
      { product_id: string; final_price: number; quantity: number }
    >({
      async queryFn({ product_id, final_price, quantity }) {
        const { data, error } = await supabase.rpc('record_transaction', {
          p_product_id: product_id,
          p_final_price: final_price,
          p_quantity: quantity,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as string };
      },
      invalidatesTags: ['Transaction', 'Product'],
    }),

    // Riwayat transaksi dengan filter rentang tanggal (ISO string)
    getTransactions: build.query<
      Transaction[],
      { from?: string; to?: string } | void
    >({
      async queryFn(arg) {
        let query = supabase
          .from('transactions')
          .select(SELECT)
          .order('transaction_time', { ascending: false });

        if (arg && arg.from) query = query.gte('transaction_time', arg.from);
        if (arg && arg.to) query = query.lte('transaction_time', arg.to);

        const { data, error } = await query;
        if (error) return { error: { message: error.message } };
        return { data: (data as RawTransaction[]).map(mapTransaction) };
      },
      providesTags: ['Transaction'],
    }),
  }),
});

export const { useRecordTransactionMutation, useGetTransactionsQuery } =
  transactionsApi;
