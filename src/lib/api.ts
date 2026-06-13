import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

// Base API tunggal. Setiap fitur meng-inject endpoint-nya sendiri
// (lihat features/*/*.ts) agar code-splitting per fitur tetap rapi.
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Product', 'Brand', 'Transaction', 'OpnameSession', 'ScannedItem'],
  endpoints: () => ({}),
});
