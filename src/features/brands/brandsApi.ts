import { api } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import type { Brand } from '../../types';

export const brandsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBrands: build.query<Brand[], void>({
      async queryFn() {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .order('brand_name');
        if (error) return { error: { message: error.message } };
        return { data: data as Brand[] };
      },
      providesTags: ['Brand'],
    }),

    addBrand: build.mutation<Brand, string>({
      async queryFn(brand_name) {
        const { data, error } = await supabase
          .from('brands')
          .insert({ brand_name })
          .select()
          .single();
        if (error) return { error: { message: error.message } };
        return { data: data as Brand };
      },
      invalidatesTags: ['Brand'],
    }),

    deleteBrand: build.mutation<string, string>({
      async queryFn(brand_id) {
        const {error} = await supabase
        .from('brands')
        .delete()
        .eq('brand_id', brand_id);
        
      if (error) return { error: { message: error.message } };
      return {data: brand_id}
      },
      invalidatesTags: ['Product']
    })
  }),
});

export const { useGetBrandsQuery, useAddBrandMutation } = brandsApi;
