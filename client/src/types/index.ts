// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  flat_no: string;
  role: 'manager' | 'admin' | 'resident' | 'watchman';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface ApiError {
  success: boolean;
  message: string;
}

// Login/Register form types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  flat_no: string;
  phone: string;
}

export type ManagerSetupData = RegisterData;

export interface PaymentLog {
  _id: string;
  user_id: string;
  flat_no: string;
  amount: number;
  payment_date: string;
  transaction_id: string;
  month: number;
  year: number;
  created_at: string;
}

// Emergency Types
export interface LiftEmergency {
  _id: string;
  triggered_by: User | string;
  flat_no: string;
  triggered_at: string;
  status: 'active' | 'resolved';
  resolved_by?: User | string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// Complaint Types
export interface Complaint {
  _id: string;
  user_id: User | string;
  flat_no: string;
  description: string;
  image_url?: string;
  status: 'open' | 'in-progress' | 'resolved';
  admin_notes?: string;
  resolved_by?: User | string;
  created_at: string;
  updated_at: string;
}

// Gate Log Types
export interface GateLog {
  _id: string;
  visitor_name: string;
  flat_no_visiting: string;
  purpose: string;
  in_time: string;
  out_time?: string;
  logged_by: User | string;
  created_at: string;
  updated_at: string;
}

// Asset Types
export interface ServiceLog {
  _id?: string;
  date: string;
  description: string;
  done_by: string;
}

export interface Asset {
  _id: string;
  type: 'lift' | 'water_pump' | 'generator';
  name: string;
  status: 'working' | 'under_maintenance' | 'not_working';
  location?: string | null;
  last_service_date?: string | null;
  services: ServiceLog[];
  createdAt: string;
  updatedAt: string;
}
// === THÊM VÀO CUỐI FILE ===
export interface ServiceFeeItem {
  type: 'dien' | 'nuoc' | 'xe_o_to' | 'xe_may' | 'xe_dap' | 'xe_dap_dien' | 'quan_ly_van_hanh' | 'phat_qua_han' | 'other';
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface ServiceFee {
  _id: string;
  user_id: string;
  flat_no: string;
  month: number;
  year: number;
  bill_date: string;
  due_date: string;
  items: ServiceFeeItem[];
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue';
  note?: string;
  paid_date?: string;
  createdAt: string;
}

export interface Expense {
  _id: string;
  title: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  vendor?: string;
  receiptRef?: string;
  status: 'pending' | 'paid' | 'cancelled';
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseStats {
  totalExpense: number;
  paidExpense: number;
  pendingExpense: number;
  overdueExpense: number;
  categoryBreakdown: { category: string; total: number }[];
  monthlyIncome: number;
  monthlyExpense: number;
  profitLoss: number;
  totalDebt: number;
}
