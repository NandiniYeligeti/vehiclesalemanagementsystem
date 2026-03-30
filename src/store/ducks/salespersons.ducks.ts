import { put, takeLatest, all, call, fork } from 'redux-saga/effects';
import { SagaIterator } from 'redux-saga';
import * as salespersonService from '@/services/salespersons/salespersons';

// Action Types
export const GET_SALESPERSONS = 'salespersons/GET_SALESPERSONS';
export const SET_SALESPERSONS = 'salespersons/SET_SALESPERSONS';
export const ADD_SALESPERSON = 'salespersons/ADD_SALESPERSON';
export const UPDATE_SALESPERSON = 'salespersons/UPDATE_SALESPERSON';
export const DELETE_SALESPERSON = 'salespersons/DELETE_SALESPERSON';
export const SET_LOADING = 'salespersons/SET_LOADING';
export const SET_SAVING = 'salespersons/SET_SAVING';
export const SET_ERROR = 'salespersons/SET_ERROR';

export interface Salesperson {
  id?: string;
  _id?: string;
  entity_id?: string;
  salesperson_code?: string;
  full_name: string;
  name?: string; // fallback
  mobile_number: string;
  mobile?: string; // fallback
  email: string;
  branch_id: string;
  branch?: string; // fallback
  status?: string;
  totalSales?: number;
  created_at?: string;
}

interface SalespersonsState {
  data: Salesperson[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: SalespersonsState = {
  data: [],
  loading: false,
  saving: false,
  error: null,
};

// Reducer
export default function salespersonsReducer(state = initialState, action: any): SalespersonsState {
  switch (action.type) {
    case SET_SALESPERSONS:
      return { ...state, data: action.payload, loading: false };
    case SET_LOADING:
      return { ...state, loading: action.payload };
    case SET_SAVING:
      return { ...state, saving: action.payload };
    case SET_ERROR:
      return { ...state, error: action.payload, loading: false, saving: false };
    default:
      return state;
  }
}

// Actions
export const getSalespersonsAction = (companyCode: string) => ({
  type: GET_SALESPERSONS,
  payload: companyCode,
});

export const addSalespersonAction = (data: any, companyCode: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: ADD_SALESPERSON,
  payload: data,
  companyCode,
  onSuccess,
  onError,
});

export const updateSalespersonAction = (id: string, data: any, companyCode: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: UPDATE_SALESPERSON,
  payload: { id, data },
  companyCode,
  onSuccess,
  onError,
});

export const deleteSalespersonAction = (id: string, companyCode: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: DELETE_SALESPERSON,
  payload: id,
  companyCode,
  onSuccess,
  onError,
});

// Sagas
function* getSalespersonsSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_LOADING, payload: true });
    const response = yield call(salespersonService.fetchSalespersons, action.payload);
    yield put({ type: SET_SALESPERSONS, payload: response.data });
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  } finally {
    yield put({ type: SET_LOADING, payload: false });
  }
}

function* addSalespersonSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_SAVING, payload: true });
    const companyCode = action.companyCode || 'DEFAULT_COMPANY';
    yield call(salespersonService.addSalesperson, companyCode, action.payload);
    yield put(getSalespersonsAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put({ type: SET_SAVING, payload: false });
  }
}

function* updateSalespersonSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_SAVING, payload: true });
    const companyCode = action.companyCode || 'DEFAULT_COMPANY';
    yield call(salespersonService.updateSalesperson, companyCode, action.payload.id, action.payload.data);
    yield put(getSalespersonsAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put({ type: SET_SAVING, payload: false });
  }
}

function* deleteSalespersonSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_SAVING, payload: true });
    const companyCode = action.companyCode || 'DEFAULT_COMPANY';
    yield call(salespersonService.deleteSalesperson, companyCode, action.payload);
    yield put(getSalespersonsAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put({ type: SET_SAVING, payload: false });
  }
}

// Watchers
export function* watchGetSalespersons() {
  yield takeLatest(GET_SALESPERSONS, getSalespersonsSaga);
}

export function* watchAddSalesperson() {
  yield takeLatest(ADD_SALESPERSON, addSalespersonSaga);
}

export function* watchUpdateSalesperson() {
  yield takeLatest(UPDATE_SALESPERSON, updateSalespersonSaga);
}

export function* watchDeleteSalesperson() {
  yield takeLatest(DELETE_SALESPERSON, deleteSalespersonSaga);
}
