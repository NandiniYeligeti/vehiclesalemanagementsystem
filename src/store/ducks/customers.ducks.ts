import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { call, put, takeLatest, select } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";

import {
  fetchCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  fetchCustomerLedger,
} from "../../services/customers/customers";

// ================================
// TYPES
// ================================

export interface Customer {
  id?: string;
  _id?: string;
  entity_id?: string;
  name: string;
  mobile: string;
  customer_name?: string;
  mobile_number?: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  aadhaar_card_no: string;
  pan_card_no: string;
  photo_url?: string;
  photo?: string;
  createdDate?: string;
  created_at?: string;
}

interface CustomersState {
  data: Customer[];
  ledger: any[];
  ledgerLoading: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

interface SagaAction<T = any> {
  type: string;
  companyCode?: string;
  customerId?: string;
  payload?: T;
  onSuccess?: (data?: any) => void;
  onError?: (error?: any) => void;
}

// ================================
// INITIAL STATE
// ================================

const initialState: CustomersState = {
  data: [],
  ledger: [],
  ledgerLoading: false,
  loading: false,
  saving: false,
  error: null,
};

// ================================
// SLICE
// ================================

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.saving = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCustomers: (state, action: PayloadAction<Customer[]>) => {
      state.data = action.payload;
    },
    customerAdded: (state, action: PayloadAction<Customer>) => {
      state.data.unshift(action.payload);
    },
    customerUpdated: (state, action: PayloadAction<Customer>) => {
      const index = state.data.findIndex((c) => c._id === action.payload._id || c.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = action.payload;
      }
    },
    customerDeleted: (state, action: PayloadAction<string>) => {
      state.data = state.data.filter((c) => c._id !== action.payload && c.id !== action.payload);
    },
    setLedgerLoading: (state, action: PayloadAction<boolean>) => {
      state.ledgerLoading = action.payload;
    },
    setLedger: (state, action: PayloadAction<any[]>) => {
      state.ledger = action.payload;
    },
  },
});

export const {
  setLoading,
  setSaving,
  setError,
  setCustomers,
  customerAdded,
  customerUpdated,
  customerDeleted,
  setLedgerLoading,
  setLedger,
} = customersSlice.actions;

export default customersSlice.reducer;

// ================================
// ACTIONS (SAGAS)
// ================================

export const GET_CUSTOMERS = "customers/GET_CUSTOMERS";
export const ADD_CUSTOMER = "customers/ADD_CUSTOMER";
export const UPDATE_CUSTOMER = "customers/UPDATE_CUSTOMER";
export const DELETE_CUSTOMER = "customers/DELETE_CUSTOMER";

export const getCustomersAction = (companyCode: string) => ({
  type: GET_CUSTOMERS,
  companyCode,
});

export const addCustomerAction = (payload: any, companyCode: string, onSuccess?: (data: any) => void, onError?: (err: any) => void) => ({
  type: ADD_CUSTOMER,
  payload,
  companyCode,
  onSuccess,
  onError,
});

export const updateCustomerAction = (customerId: string, payload: any, companyCode: string, onSuccess?: (data: any) => void, onError?: (err: any) => void) => ({
  type: UPDATE_CUSTOMER,
  customerId,
  payload,
  companyCode,
  onSuccess,
  onError,
});

export const deleteCustomerAction = (customerId: string, companyCode: string, onSuccess?: (data: any) => void, onError?: (err: any) => void) => ({
  type: DELETE_CUSTOMER,
  customerId,
  companyCode,
  onSuccess,
  onError,
});

export const GET_CUSTOMER_LEDGER = "customers/GET_CUSTOMER_LEDGER";

export const getCustomerLedgerAction = (customerId: string) => ({
  type: GET_CUSTOMER_LEDGER,
  customerId,
});

// ================================
// SAGAS
// ================================

function* getCustomersSaga(action: SagaAction): SagaIterator {
  try {
    yield put(setLoading(true));
    const data = yield call(fetchCustomers, action.companyCode || "");
    yield put(setCustomers(data.data || data)); // depending on API response format
    yield put(setError(null));
  } catch (error: any) {
    yield put(setError(error?.message || "Failed to fetch customers"));
  } finally {
    yield put(setLoading(false));
  }
}

function* addCustomerSaga(action: SagaAction): SagaIterator {
  try {
    yield put(setSaving(true));
    const data = yield call(addCustomer, action.companyCode || "DEFAULT_COMPANY", action.payload);
    yield put(customerAdded(data.data || data));
    if (action.onSuccess) yield call(action.onSuccess, data);
  } catch (error: any) {
    yield put(setError(error?.message || "Failed to add customer"));
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put(setSaving(false));
  }
}

function* updateCustomerSaga(action: SagaAction): SagaIterator {
  try {
    yield put(setSaving(true));
    const data = yield call(updateCustomer, action.companyCode || "DEFAULT_COMPANY", action.customerId!, action.payload);
    yield put(customerUpdated(data.data || data));
    if (action.onSuccess) yield call(action.onSuccess, data);
  } catch (error: any) {
    yield put(setError(error?.message || "Failed to update customer"));
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put(setSaving(false));
  }
}

function* deleteCustomerSaga(action: SagaAction): SagaIterator {
  try {
    yield put(setSaving(true));
    yield call(deleteCustomer, action.companyCode || "DEFAULT_COMPANY", action.customerId!);
    yield put(customerDeleted(action.customerId!));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put(setError(error?.message || "Failed to delete customer"));
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put(setSaving(false));
  }
}

function* getCustomerLedgerSaga(action: SagaAction): SagaIterator {
  try {
    yield put(setLedgerLoading(true));
    // Get company code from auth state
    const companyCode = yield select((state: any) => state.auth.user?.CompanyCode || "DEFAULT_COMPANY");
    const data = yield call(fetchCustomerLedger, companyCode, action.customerId!);
    let ledgerArr = [];
    if (data && Array.isArray(data)) {
      ledgerArr = data;
    } else if (data && Array.isArray(data.data)) {
      ledgerArr = data.data;
    }
    yield put(setLedger(ledgerArr));
  } catch (error: any) {
    console.error("Failed to fetch customer ledger:", error);
  } finally {
    yield put(setLedgerLoading(false));
  }
}

// ================================
// WATCHERS
// ================================

export function* watchGetCustomers() {
  yield takeLatest(GET_CUSTOMERS, getCustomersSaga);
}

export function* watchAddCustomer() {
  yield takeLatest(ADD_CUSTOMER, addCustomerSaga);
}

export function* watchUpdateCustomer() {
  yield takeLatest(UPDATE_CUSTOMER, updateCustomerSaga);
}

export function* watchDeleteCustomer() {
  yield takeLatest(DELETE_CUSTOMER, deleteCustomerSaga);
}

export function* watchGetCustomerLedger() {
  yield takeLatest(GET_CUSTOMER_LEDGER, getCustomerLedgerSaga);
}
