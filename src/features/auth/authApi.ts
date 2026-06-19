import { api } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import type { AppUser } from '../../types';

async function fetchProfile(userId: string, email: string): Promise<AppUser> {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, role_id, email, created_at, roles(role_name)')
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  const roleRel = data.roles as unknown as { role_name: 'owner' | 'cashier' } | { role_name: 'owner' | 'cashier' }[];
  const role_name = Array.isArray(roleRel) ? roleRel[0]?.role_name : roleRel?.role_name;

  return {
    user_id: data.user_id,
    role_id: data.role_id,
    email: data.email ?? email,
    role: role_name,
    created_at: data.created_at,
  };
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AppUser, { email: string; password: string }>({
      async queryFn({ email, password }) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const profile = await fetchProfile(data.user.id, data.user.email ?? email);
          return { data: profile };
        } catch (err) {
          return { error: { message: (err as Error).message } };
        }
      },
    }),

    logout: build.mutation<null, void>({
      async queryFn() {
        const { error } = await supabase.auth.signOut();
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
    }),

    getCurrentUser: build.query<AppUser | null, void>({
      async queryFn() {
        try {
          const { data } = await supabase.auth.getSession();
          if (!data.session) return { data: null };
          const profile = await fetchProfile(
            data.session.user.id,
            data.session.user.email ?? ''
          );
          return { data: profile };
        } catch (err) {
          return { error: { message: (err as Error).message } };
        }
      },
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetCurrentUserQuery } = authApi;
