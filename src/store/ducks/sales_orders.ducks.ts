import { call, put, takeLatest } from 'redux-saga/effects';
import * as api from '../../services/sales_orders/sales_orders';

// ================================
// CONSTANTS
// ================================

export const GET_SALES_ORDERS = 'sales_orders/GET_SALES_ORDERS';
export const SET_SALES_ORDERS = 'sales_orders/SET_SALES_ORDERS';
export const ADD_SALES_ORDER = 'sales_orders/ADD_SALES_ORDER';
export const UPDATE_SALES_ORDER = 'sales_orders/UPDATE_SALES_ORDER';
export const DELETE_SALES_ORDER = 'sales_orders/DELETE_SALES_ORDER';
export const RESEND_ORDER_EMAIL = 'sales_orders/RESEND_ORDER_EMAIL';
export const PREVIEW_ORDER_EMAIL = 'sales_orders/PREVIEW_ORDER_EMAIL';

export interface SalesOrderState {
  data: any[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: SalesOrderState = {
  data: [],
  loading: false,
  saving: false,
  error: null,
};

// ================================
// REDUCER
// ================================

export default function salesOrdersReducer(state = initialState, action: any): SalesOrderState {
  switch (action.type) {
    case GET_SALES_ORDERS:
      return { ...state, loading: true, error: null };
    case SET_SALES_ORDERS:
      return { ...state, data: action.payload, loading: false };
    case ADD_SALES_ORDER:
    case UPDATE_SALES_ORDER:
    case DELETE_SALES_ORDER:
      return { ...state, saving: true, error: null };
    default:
      return state;
  }
}

// ================================
// ACTIONS
// ================================

export const getSalesOrdersAction = (companyCode: string) => ({
  type: GET_SALES_ORDERS,
  companyCode,
});

export const setSalesOrdersAction = (payload: any[]) => ({
  type: SET_SALES_ORDERS,
  payload,
});

export const addSalesOrderAction = (payload: any, companyCode: string, onSuccess?: () => void, onError?: () => void) => ({
  type: ADD_SALES_ORDER,
  payload,
  companyCode,
  onSuccess,
  onError,
});

export const updateSalesOrderAction = (id: string, payload: any, onSuccess?: () => void, onError?: () => void) => ({
  type: UPDATE_SALES_ORDER,
  id,
  payload,
  onSuccess,
  onError,
});

export const deleteSalesOrderAction = (id: string) => ({
  type: DELETE_SALES_ORDER,
  id,
});

export const resendOrderEmailAction = (companyCode: string, id: string, onSuccess?: () => void) => ({
  type: RESEND_ORDER_EMAIL,
  companyCode,
  id,
  onSuccess,
});

export const previewOrderEmailAction = (companyCode: string, id: string, onSuccess?: (preview: any) => void) => ({
  type: PREVIEW_ORDER_EMAIL,
  companyCode,
  id,
  onSuccess,
});

// ================================
// SAGAS
// ================================

function* getSalesOrdersSaga(action: any): any {
  try {
    const response = yield call(api.fetchSalesOrders, action.companyCode);
    yield put(setSalesOrdersAction(response.data));
  } catch (error: any) {
    console.error('Error fetching sales orders:', error);
  }
}

function* addSalesOrderSaga(action: any): any {
  try {
    const companyCode = action.companyCode || action.payload.company_id || 'DEFAULT_COMPANY';
    yield call(api.createSalesOrder, companyCode, action.payload);
    yield put(getSalesOrdersAction(companyCode));
    if (action.onSuccess) action.onSuccess();
  } catch (error: any) {
    console.error('Error adding sales order:', error);
    if (action.onError) action.onError();
  }
}

function* updateSalesOrderSaga(action: any): any {
  try {
    const companyCode = action.payload.company_id || 'DEFAULT_COMPANY';
    yield call(api.updateSalesOrder, companyCode, action.id, action.payload);
    yield put(getSalesOrdersAction(companyCode));
    if (action.onSuccess) action.onSuccess();
  } catch (error: any) {
    console.error('Error updating sales order:', error);
    if (action.onError) action.onError();
  }
}

function* deleteSalesOrderSaga(action: any): any {
  try {
    const companyCode = 'DEFAULT_COMPANY';
    yield call(api.deleteSalesOrder, companyCode, action.id);
    yield put(getSalesOrdersAction(companyCode));
  } catch (error: any) {
    console.error('Error deleting sales order:', error);
  }
}

function* resendOrderEmailSaga(action: any): any {
  try {
    yield call(api.resendSalesOrderEmail, action.companyCode, action.id);
    if (action.onSuccess) action.onSuccess();
  } catch (error: any) {
    console.error('Error resending order email:', error);
  }
}

function* previewOrderEmailSaga(action: any): any {
  try {
    const response = yield call(api.previewSalesOrderEmail, action.companyCode, action.id);
    if (action.onSuccess) action.onSuccess(response.data);
  } catch (error: any) {
    console.error('Error previewing order email:', error);
  }
}

export function* watchSalesOrders() {
  yield takeLatest(GET_SALES_ORDERS, getSalesOrdersSaga);
  yield takeLatest(ADD_SALES_ORDER, addSalesOrderSaga);
  yield takeLatest(UPDATE_SALES_ORDER, updateSalesOrderSaga);
  yield takeLatest(DELETE_SALES_ORDER, deleteSalesOrderSaga);
  yield takeLatest(RESEND_ORDER_EMAIL, resendOrderEmailSaga);
  yield takeLatest(PREVIEW_ORDER_EMAIL, previewOrderEmailSaga);
}
