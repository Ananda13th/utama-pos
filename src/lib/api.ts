import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Product', 'Brand', 'Transaction', 'OpnameSession', 'ScannedItem'],
  endpoints: () => ({}),
});
