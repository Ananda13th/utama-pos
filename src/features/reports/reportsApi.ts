import { api } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import type { Transaction, RevenueSummary } from '../../types';

interface RawRow {
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

function mapRow(row: RawRow): Transaction {
  const p = row.products;
  const brandRel = p?.brands;
  const brand_name = Array.isArray(brandRel) ? brandRel[0]?.brand_name : brandRel?.brand_name;
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

export interface RevenueReport {
  summary: RevenueSummary;
  rows: Transaction[];
}

export const reportsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getRevenueReport: build.query<RevenueReport, { from: string; to: string }>({
      async queryFn({ from, to }) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, products(serial_number, base_price, brands(brand_name))')
          .gte('transaction_time', from)
          .lte('transaction_time', to)
          .order('transaction_time', { ascending: false });

        if (error) return { error: { message: error.message } };

        const rows = (data as RawRow[]).map(mapRow);
        const summary = rows.reduce<RevenueSummary>(
          (acc, t) => {
            const omzet = t.final_price * t.quantity;
            const hpp = (t.base_price ?? 0) * t.quantity;
            acc.total_omzet += omzet;
            acc.total_hpp += hpp;
            acc.total_profit += omzet - hpp;
            acc.transaction_quantity += 1;
            return acc;
          },
          { total_omzet: 0, total_hpp: 0, total_profit: 0, transaction_quantity: 0 }
        );

        return { data: { summary, rows } };
      },
      providesTags: ['Transaction'],
    }),
  }),
});

export const { useGetRevenueReportQuery } = reportsApi;
