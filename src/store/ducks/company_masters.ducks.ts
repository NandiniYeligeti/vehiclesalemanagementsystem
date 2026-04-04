import { put, takeLatest, call, all } from 'redux-saga/effects';
import { SagaIterator } from 'redux-saga';
import { api } from '@/services/api';

// Action Types
export const GET_MASTERS = 'company_masters/GET_MASTERS';
export const SET_MASTERS = 'company_masters/SET_MASTERS';
export const ADD_MASTER = 'company_masters/ADD_MASTER';
export const DELETE_MASTER = 'company_masters/DELETE_MASTER';
export const SET_LOADING = 'company_masters/SET_LOADING';

export interface CompanyMasterItem {
  id?: string;
  _id?: string;
  entity_id?: string;
  type: 'Showroom' | 'Branch' | 'Area';
  name: string;
}

interface CompanyMastersState {
  data: CompanyMasterItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CompanyMastersState = {
  data: [],
  loading: false,
  error: null,
};

// Reducer
export default function companyMastersReducer(state = initialState, action: any): CompanyMastersState {
  switch (action.type) {
    case SET_MASTERS:
      return { ...state, data: action.payload || [], loading: false };
    case SET_LOADING:
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// Action Creators
export const getMastersAction = (companyCode: string) => ({ type: GET_MASTERS, payload: companyCode });
export const addMasterAction = (companyCode: string, data: any, onSuccess?: () => void, onError?: (err: any) => void) => ({ type: ADD_MASTER, companyCode, payload: data, onSuccess, onError });
export const deleteMasterAction = (companyCode: string, id: string, onSuccess?: () => void, onError?: (err: any) => void) => ({ type: DELETE_MASTER, companyCode, payload: id, onSuccess, onError });

// Sagas
function* getMastersSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_LOADING, payload: true });
    const response = yield call([api, api.get], `/company-master/${action.payload}`);
    yield put({ type: SET_MASTERS, payload: response.data || [] });
  } catch (error: any) {
    console.error(error);
  } finally {
    yield put({ type: SET_LOADING, payload: false });
  }
}

function* addMasterSaga(action: any): SagaIterator {
  try {
    yield call([api, api.post], `/company-master/${action.companyCode}`, action.payload);
    yield put(getMastersAction(action.companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    if (action.onError) yield call(action.onError, error);
  }
}

function* deleteMasterSaga(action: any): SagaIterator {
  try {
    yield call([api, api.delete], `/company-master/${action.companyCode}/${action.payload}`);
    yield put(getMastersAction(action.companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    if (action.onError) yield call(action.onError, error);
  }
}

// Watchers
export function* watchCompanyMasters() {
  yield all([
    takeLatest(GET_MASTERS, getMastersSaga),
    takeLatest(ADD_MASTER, addMasterSaga),
    takeLatest(DELETE_MASTER, deleteMasterSaga),
  ]);
}
