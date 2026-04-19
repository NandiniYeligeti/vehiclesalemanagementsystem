import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { call, put, takeLatest } from "redux-saga/effects";
import { toast } from "sonner";
import { loginApi } from "../../services/auth/auth";
import { SagaIterator } from "redux-saga";

// ================================
// STATE & TYPES
// ================================

export interface MenuPermission {
  menu_id: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  CompanyCode: string;
  company_name: string;
  menus: string[];
  permissions: MenuPermission[];
  branches: string[];
  showrooms: string[];
  areas: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  impersonating: boolean;
}

// Hydrate from persisted state if available
let persisted: Partial<AuthState> | null = null;
if (typeof window !== 'undefined') {
  try {
    const raw = sessionStorage.getItem('auth');
    if (raw) persisted = JSON.parse(raw);
  } catch {}
}

const initialState: AuthState = {
  user: persisted?.user || null,
  isAuthenticated: !!persisted?.user,
  loading: false,
  error: null,
  impersonating: persisted?.impersonating || false,
};

// ================================
// SLICE
// ================================

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      // align the go backend keys with the frontend expectation
      const incomingUser = action.payload.user as any;
      state.user = {
        id: incomingUser.id || incomingUser._id,
        username: incomingUser.username || '',
        email: incomingUser.email,
        role: incomingUser.role,
        CompanyCode: incomingUser.company_code, // DashboardPage mapping dependency backwards compatibility
        company_name: incomingUser.company_name,
        menus: incomingUser.menus || [],
        permissions: incomingUser.permissions || [],
        branches: incomingUser.branches || [],
        showrooms: incomingUser.showrooms || [],
        areas: incomingUser.areas || [],
      };
      state.isAuthenticated = true;
      sessionStorage.setItem("accessToken", action.payload.token);
      sessionStorage.setItem("companyCode", incomingUser.company_code);
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.impersonating = false;
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("companyCode");
      sessionStorage.removeItem("auth");
    },

    impersonateCompany: (state, action: PayloadAction<{ company: any }>) => {
      // Set auth state as if logged in as this company admin
      const company = action.payload.company;
      state.user = {
        id: company.admin_id || company.id || '',
        username: company.username || '',
        email: company.email,
        role: 'admin',
        CompanyCode: company.company_code,
        company_name: company.company_name,
        menus: company.menus || [],
        permissions: company.permissions || [],
        branches: company.branches || [],
        showrooms: company.showrooms || [],
        areas: company.areas || [],
      };
      state.isAuthenticated = true;
      state.impersonating = true;
      sessionStorage.setItem("companyCode", company.company_code);
      // Save impersonation flag in persisted state
      const persistedRaw = sessionStorage.getItem('auth');
      const obj: Partial<AuthState> = persistedRaw ? JSON.parse(persistedRaw) : {};
      obj.user = state.user;
      obj.isAuthenticated = true;
      obj.impersonating = true;
      sessionStorage.setItem('auth', JSON.stringify(obj));
    },
  },
});

export const { setLoading, setError, setAuth, logout, impersonateCompany } = authSlice.actions;
export default authSlice.reducer;

// ================================
// ACTIONS
// ================================

export const LOGIN_REQUEST = "auth/LOGIN_REQUEST";

export const loginAction = (payload: any, onSuccess?: (user: any) => void, onError?: () => void) => ({
  type: LOGIN_REQUEST,
  payload,
  onSuccess,
  onError,
});

// ================================
// SAGAS
// ================================

function* loginSaga(action: any): SagaIterator {
  try {
    yield put(setLoading(true));
    const response = yield call(loginApi, action.payload);
    yield put(setAuth({ user: response.user, token: response.token }));
    
    // Check if super admin
    if (response.user?.role === "super_admin") {
       toast.success("Welcome back, Super Admin!");
    } else {
       toast.success("Logged in successfully!");
    }
    
    if (action.onSuccess) action.onSuccess(response.user);
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || "Login failed";
    toast.error(errorMsg);
    yield put(setError(errorMsg));
    if (action.onError) action.onError();
  } finally {
    yield put(setLoading(false));
  }
}

// ================================
// WATCHER
// ================================

export function* watchAuth() {
  yield takeLatest(LOGIN_REQUEST, loginSaga);
}
