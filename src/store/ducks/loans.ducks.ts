import { put, takeLatest, all, call } from 'redux-saga/effects';
import { SagaIterator } from 'redux-saga';
import * as loanService from '@/services/loans/loans';

// Action Types
export const GET_LOANS = 'loans/GET_LOANS';
export const SET_LOANS = 'loans/SET_LOANS';
export const ADD_LOAN = 'loans/ADD_LOAN';
export const UPDATE_LOAN = 'loans/UPDATE_LOAN';
export const DELETE_LOAN = 'loans/DELETE_LOAN';
export const SET_ERROR = 'loans/SET_ERROR';

export interface Loan {
  id?: string;
  _id?: string;
  entity_id?: string;
  loan_code?: string;
  company_id: string;
  customer_id: string;
  customer_name?: string;
  sales_order_id: string;
  sales_order_code?: string;
  bank_name: string;
  loan_amount: number;
  interest_rate: number;
  duration_months: number;
  emi_amount: number;
  status: string;
  account_number?: string;
  bank_person?: string;
  mobile?: string;
  disbursement_date?: string;
  created_at?: string;
}

interface LoansState {
  data: Loan[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: LoansState = {
  data: [],
  loading: false,
  saving: false,
  error: null,
};

// Reducer
export default function loansReducer(state = initialState, action: any): LoansState {
  switch (action.type) {
    case GET_LOANS:
      return { ...state, loading: true, error: null };
    case SET_LOANS:
      return { ...state, data: action.payload, loading: false };
    case ADD_LOAN:
    case UPDATE_LOAN:
    case DELETE_LOAN:
      return { ...state, saving: true, error: null };
    case SET_ERROR:
      return { ...state, error: action.payload, loading: false, saving: false };
    default:
      return state;
  }
}

// Actions
export const getLoansAction = (companyCode: string) => ({
  type: GET_LOANS,
  companyCode,
});

export const addLoanAction = (data: any, companyCode: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: ADD_LOAN,
  payload: data,
  companyCode,
  onSuccess,
  onError,
});

export const updateLoanAction = (id: string, data: any, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: UPDATE_LOAN,
  payload: { id, data },
  onSuccess,
  onError,
});

export const deleteLoanAction = (id: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: DELETE_LOAN,
  payload: id,
  onSuccess,
  onError,
});

// Sagas
function* getLoansSaga(action: any): SagaIterator {
  try {
    const response = yield call(loanService.fetchLoans, action.companyCode);
    yield put({ type: SET_LOANS, payload: response.data });
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  }
}

function* addLoanSaga(action: any): SagaIterator {
  try {
    const companyCode = action.companyCode || 'DEFAULT_COMPANY';
    yield call(loanService.addLoan, companyCode, action.payload);
    yield put(getLoansAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  }
}

function* updateLoanSaga(action: any): SagaIterator {
  try {
    const companyCode = 'DEFAULT_COMPANY';
    yield call(loanService.updateLoan, companyCode, action.payload.id, action.payload.data);
    yield put(getLoansAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  }
}

function* deleteLoanSaga(action: any): SagaIterator {
  try {
    const companyCode = 'DEFAULT_COMPANY';
    yield call(loanService.deleteLoan, companyCode, action.payload);
    yield put(getLoansAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  }
}

// Watchers
export function* watchLoans() {
  yield all([
    takeLatest(GET_LOANS, getLoansSaga),
    takeLatest(ADD_LOAN, addLoanSaga),
    takeLatest(UPDATE_LOAN, updateLoanSaga),
    takeLatest(DELETE_LOAN, deleteLoanSaga),
  ]);
}
