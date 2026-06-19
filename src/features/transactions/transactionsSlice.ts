import { CartItem } from '@/types';
import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit';



interface TransactionState {
  items: CartItem[]
}

const initialState: TransactionState = {
  items: []
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: {
      reducer: (state, action: PayloadAction<CartItem>) => {
        state.items.push(action.payload);
      },
      prepare: (item: Omit<CartItem, 'cart_item_id'>) => ({
        payload: { ...item, cart_item_id: nanoid() },
      }),
  },
    removeTransaction: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((t) => t.cart_item_id !== action.payload);
    },
    clearTransaction: (state) => {
      state.items = initialState.items
    } 
  },
});

export const { addTransaction, removeTransaction, clearTransaction } = transactionsSlice.actions;
export default transactionsSlice.reducer;
