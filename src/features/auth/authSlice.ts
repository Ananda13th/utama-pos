import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppUser } from '../../types';

interface AuthState {
  user: AppUser | null;
  initializing: boolean;
}

const initialState: AuthState = {
  user: null,
  initializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AppUser | null>) => {
      state.user = action.payload;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.initializing = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, setInitializing, clearAuth } = authSlice.actions;
export default authSlice.reducer;
