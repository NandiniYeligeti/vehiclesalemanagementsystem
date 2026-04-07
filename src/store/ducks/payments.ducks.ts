import { call, put, takeLatest } from 'redux-saga/effects';
import * as api from '../../services/payments/payments';

// ================================
// CONSTANTS
// ================================

export const GET_PAYMENTS = 'payments/GET_PAYMENTS';
export const SET_PAYMENTS = 'payments/SET_PAYMENTS';
export const ADD_PAYMENT = 'payments/ADD_PAYMENT';
export const UPDATE_PAYMENT = 'payments/UPDATE_PAYMENT';
export const DELETE_PAYMENT = 'payments/DELETE_PAYMENT';
export const SET_ERROR = 'payments/SET_ERROR';
export const RESEND_PAYMENT_EMAIL = 'payments/RESEND_PAYMENT_EMAIL';
export const PREVIEW_PAYMENT_EMAIL = 'payments/PREVIEW_PAYMENT_EMAIL';

export interface PaymentState {
  data: any[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  data: [],
  loading: false,
  saving: false,
  error: null,
};

// ================================
// REDUCER
// ================================

export default function paymentsReducer(state = initialState, action: any): PaymentState {
  switch (action.type) {
    case GET_PAYMENTS:
      return { ...state, loading: true, error: null };
    case SET_PAYMENTS:
      return { ...state, data: action.payload, loading: false };
    case ADD_PAYMENT:
    case UPDATE_PAYMENT:
    case DELETE_PAYMENT:
      return { ...state, saving: true, error: null };
    case SET_ERROR:
      return { ...state, error: action.payload, loading: false, saving: false };
    default:
      return state;
  }
}

// ================================
// ACTIONS
// ================================

export const getPaymentsAction = (companyCode: string) => ({
  type: GET_PAYMENTS,
  companyCode,
});

export const setPaymentsAction = (payload: any[]) => ({
  type: SET_PAYMENTS,
  payload,
});

export const addPaymentAction = (payload: any, companyCode: string, onSuccess?: () => void, onError?: () => void) => ({
  type: ADD_PAYMENT,
  payload,
  companyCode,
  onSuccess,
  onError,
});

export const updatePaymentAction = (id: string, payload: any, onSuccess?: () => void, onError?: () => void) => ({
  type: UPDATE_PAYMENT,
  id,
  payload,
  onSuccess,
  onError,
});

export const deletePaymentAction = (id: string) => ({
  type: DELETE_PAYMENT,
  id,
});

export const resendPaymentEmailAction = (companyCode: string, id: string, onSuccess?: () => void) => ({
  type: RESEND_PAYMENT_EMAIL,
  companyCode,
  id,
  onSuccess,
});

export const previewPaymentEmailAction = (companyCode: string, id: string, onSuccess?: (preview: any) => void) => ({
  type: PREVIEW_PAYMENT_EMAIL,
  companyCode,
  id,
  onSuccess,
});

// ================================
// SAGAS
// ================================

function* getPaymentsSaga(action: any): any {
  try {
    const response = yield call(api.fetchPayments, action.companyCode);
    yield put(setPaymentsAction(response.data));
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    yield put({ type: SET_ERROR, payload: error.message });
  }
}

function* addPaymentSaga(action: any): any {
  try {
    const companyCode = action.companyCode || action.payload.company_id || 'DEFAULT_COMPANY';
    yield call(api.createPayment, companyCode, action.payload);
    yield put(getPaymentsAction(companyCode));
    if (action.onSuccess) action.onSuccess();
  } catch (error: any) {
    console.error('Error adding payment:', error);
    if (action.onError) action.onError();
  }
}

function* updatePaymentSaga(action: any): any {
  try {
    const companyCode = action.payload.company_id || 'DEFAULT_COMPANY';
    yield call(api.updatePayment, companyCode, action.id, action.payload);
    yield put(getPaymentsAction(companyCode));
    if (action.onSuccess) action.onSuccess();
  } catch (error: any) {
    console.error('Error updating payment:', error);
    if (action.onError) action.onError();
  }
}

function* deletePaymentSaga(action: any): any {
  try {
    const companyCode = 'DEFAULT_COMPANY';
    yield call(api.deletePayment, companyCode, action.id);
    yield put(getPaymentsAction(companyCode));
  } catch (error: any) {
    console.error('Error deleting payment:', error);
  }
}

function* resendPaymentEmailSaga(action: any): any {
  try {
    yield call(api.resendPaymentEmail, action.companyCode, action.id);
    if (action.onSuccess) action.onSuccess();
  } catch (error: any) {
    console.error('Error resending payment email:', error);
  }
}

function* previewPaymentEmailSaga(action: any): any {
  try {
    const response = yield call(api.previewPaymentEmail, action.companyCode, action.id);
    if (action.onSuccess) action.onSuccess(response.data);
  } catch (error: any) {
    console.error('Error previewing payment email:', error);
  }
}

export function* watchPayments() {
  yield takeLatest(GET_PAYMENTS, getPaymentsSaga);
  yield takeLatest(ADD_PAYMENT, addPaymentSaga);
  yield takeLatest(UPDATE_PAYMENT, updatePaymentSaga);
  yield takeLatest(DELETE_PAYMENT, deletePaymentSaga);
  yield takeLatest(RESEND_PAYMENT_EMAIL, resendPaymentEmailSaga);
  yield takeLatest(PREVIEW_PAYMENT_EMAIL, previewPaymentEmailSaga);
}
