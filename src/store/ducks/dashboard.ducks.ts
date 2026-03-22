import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { call, put, takeLatest } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";

import { fetchDashboardStats } from "../../services/dashboard/dashboard";

// ================================
// TYPES
// ================================

export interface DashboardStats {
  total_vehicles_in_stock: number;
  total_vehicles_sold: number;
  total_customers: number;
  total_sales_revenue: number;
  total_pending_payments: number;
  total_pending_loans: number;
  recent_sales: any[];
  monthly_revenue: any[];
  sales_by_model: any[];
}

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

interface SagaAction {
  type: string;
  companyCode: string;
}

// ================================
// INITIAL STATE
// ================================

const initialState: DashboardState = {
  stats: null,
  loading: false,
  error: null,
};

// ================================
// SLICE
// ================================

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setStats: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload;
    },
  },
});

export const { setLoading, setError, setStats } = dashboardSlice.actions;

export default dashboardSlice.reducer;

// ================================
// ACTIONS (SAGAS)
// ================================

export const GET_DASHBOARD_STATS = "dashboard/GET_DASHBOARD_STATS";

export const getDashboardStatsAction = (companyCode: string) => ({
  type: GET_DASHBOARD_STATS,
  companyCode,
});

// ================================
// SAGAS
// ================================

function* getDashboardStatsSaga(action: SagaAction): SagaIterator {
  try {
    yield put(setLoading(true));
    const data = yield call(fetchDashboardStats, action.companyCode);
    yield put(setStats(data.data || data)); // depending on API response format
    yield put(setError(null));
  } catch (error: any) {
    yield put(setError(error?.message || "Failed to fetch dashboard stats"));
  } finally {
    yield put(setLoading(false));
  }
}

// ================================
// WATCHERS
// ================================

export function* watchGetDashboardStats() {
  yield takeLatest(GET_DASHBOARD_STATS, getDashboardStatsSaga);
}
