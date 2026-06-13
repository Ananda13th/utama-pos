import { api } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import type { StockOpnameSession, ScannedItem, ReconciliationRow } from '../../types';

export const stockOpnameApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Sesi 'ongoing' yang aktif (jika ada)
    getOngoingSession: build.query<StockOpnameSession | null, void>({
      async queryFn() {
        const { data, error } = await supabase
          .from('stock_opname_sessions')
          .select('*')
          .eq('status', 'ongoing')
          .maybeSingle();
        if (error) return { error: { message: error.message } };
        return { data: (data as StockOpnameSession) ?? null };
      },
      providesTags: ['OpnameSession'],
    }),

    startSession: build.mutation<StockOpnameSession, { user_id: string; notes?: string }>({
      async queryFn({ user_id, notes }) {
        const { data, error } = await supabase
          .from('stock_opname_sessions')
          .insert({ user_id, notes: notes ?? null })
          .select()
          .single();
        if (error) {
          const msg = error.message.includes('idx_one_ongoing_session')
            ? 'Masih ada sesi stock opname yang berjalan. Selesaikan dulu sebelum memulai yang baru.'
            : error.message;
          return { error: { message: msg } };
        }
        return { data: data as StockOpnameSession };
      },
      invalidatesTags: ['OpnameSession'],
    }),

    completeSession: build.mutation<StockOpnameSession, string>({
      async queryFn(session_id) {
        const { data, error } = await supabase
          .from('stock_opname_sessions')
          .update({ status: 'completed' })
          .eq('session_id', session_id)
          .select()
          .single();
        if (error) return { error: { message: error.message } };
        return { data: data as StockOpnameSession };
      },
      invalidatesTags: ['OpnameSession'],
    }),

    // Scan satu barcode → upsert via RPC (increment scanned_quantity)
    scanItem: build.mutation<ScannedItem, { session_id: string; barcode: string }>({
      async queryFn({ session_id, barcode }) {
        const { data, error } = await supabase.rpc('scan_opname_item', {
          p_session_id: session_id,
          p_barcode: barcode,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as ScannedItem };
      },
      invalidatesTags: ['ScannedItem'],
    }),

    // Hasil scan saat ini untuk satu sesi (untuk running count di UI)
    getScannedItems: build.query<ScannedItem[], string>({
      async queryFn(session_id) {
        const { data, error } = await supabase
          .from('stock_opname_scanned_items')
          .select('*')
          .eq('session_id', session_id);
        if (error) return { error: { message: error.message } };
        return { data: data as ScannedItem[] };
      },
      providesTags: ['ScannedItem'],
    }),

    // Laporan rekonsiliasi: gabungkan semua produk dengan hasil scan sesi
    getReconciliation: build.query<ReconciliationRow[], string>({
      async queryFn(session_id) {
        // Ambil semua produk + merk
        const { data: products, error: pErr } = await supabase
          .from('products')
          .select('product_id, serial_number, available_stock, brands(brand_name)');
        if (pErr) return { error: { message: pErr.message } };

        // Ambil hasil scan untuk sesi ini
        const { data: scanned, error: sErr } = await supabase
          .from('stock_opname_scanned_items')
          .select('product_id, scanned_quantity')
          .eq('session_id', session_id);
        if (sErr) return { error: { message: sErr.message } };

        const scanMap = new Map<string, number>(
          (scanned as { product_id: string; scanned_quantity: number }[]).map((s) => [
            s.product_id,
            s.scanned_quantity,
          ])
        );

        const rows: ReconciliationRow[] = (
          products as {
            product_id: string;
            serial_number: string;
            available_stock: number;
            brands: { brand_name: string } | { brand_name: string }[] | null;
          }[]
        ).map((p) => {
          const brandRel = p.brands;
          const brand_name = Array.isArray(brandRel)
            ? brandRel[0]?.brand_name ?? ''
            : brandRel?.brand_name ?? '';
          const scanned_qty = scanMap.get(p.product_id) ?? 0;
          return {
            product_id: p.product_id,
            brand_name,
            serial_number: p.serial_number,
            expected_qty: p.available_stock,
            scanned_qty,
            selisih: scanned_qty - p.available_stock,
          };
        });

        // Urutkan: selisih terbesar (paling bermasalah) di atas
        rows.sort((a, b) => a.selisih - b.selisih);
        return { data: rows };
      },
      providesTags: ['ScannedItem'],
    }),
  }),
});

export const {
  useGetOngoingSessionQuery,
  useStartSessionMutation,
  useCompleteSessionMutation,
  useScanItemMutation,
  useGetScannedItemsQuery,
  useGetReconciliationQuery,
} = stockOpnameApi;
