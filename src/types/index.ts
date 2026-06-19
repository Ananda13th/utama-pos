export type RoleName = 'owner' | 'cashier';

export interface AppUser {
  user_id: string;
  role_id: string;
  email: string;
  role: RoleName;
  created_at: string;
}

export interface Brand {
  brand_id: string;
  brand_name: string;
  created_at?: string;
}

export interface Product {
  product_id: string;
  brand_id: string;
  brand_name: string;
  serial_number: string;
  barcode: string;
  base_price: number;
  available_stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  brand_id: string;
  serial_number: string;
  barcode: string;
  base_price: number;
  available_stock: number;
}

export interface Order {
  order_id: string;
  user_id: string;
  order_time: string;
  total_amount: number;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  product_id: string;
  transaction_time: string;
  final_price: number;
  quantity: number;
  serial_number?: string;
  brand_name?: string;
  base_price?: number;
}

export interface StockOpnameSession {
  session_id: string;
  user_id: string;
  session_date: string;
  status: 'ongoing' | 'completed';
  notes?: string | null;
  created_at: string;
}

export interface ScannedItem {
  item_id: string;
  session_id: string;
  product_id: string;
  scanned_quantity: number;
}

export interface ReconciliationRow {
  product_id: string;
  brand_name: string;
  serial_number: string;
  expected_qty: number;
  scanned_qty: number;
  difference: number;
}

export interface RevenueSummary {
  total_omzet: number;
  total_hpp: number;
  total_profit: number;
  transaction_quantity: number;
}

export interface CartItem {
  cart_item_id: string;
  product_id: string;
  brand_name: string;
  serial_number: string;
  base_price: number,
	final_price: number,
	quantity: number,
}
