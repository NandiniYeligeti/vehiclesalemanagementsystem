import { put, takeLatest, all, call } from 'redux-saga/effects';
import { SagaIterator } from 'redux-saga';
import { api } from '@/services/api';

// Action Types
export const GET_COMPANY_BANKS = 'companyBankMaster/GET_COMPANY_BANKS';
export const SET_COMPANY_BANKS = 'companyBankMaster/SET_COMPANY_BANKS';
export const ADD_COMPANY_BANK = 'companyBankMaster/ADD_COMPANY_BANK';
export const UPDATE_COMPANY_BANK = 'companyBankMaster/UPDATE_COMPANY_BANK';
export const DELETE_COMPANY_BANK = 'companyBankMaster/DELETE_COMPANY_BANK';
export const SET_ERROR = 'companyBankMaster/SET_ERROR';

export interface CompanyBankMaster {
  id?: string;
  _id?: string;
  entity_id?: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  is_default?: boolean;
}

interface CompanyBankMasterState {
  data: CompanyBankMaster[];
  loading: boolean;
  error: string | null;
}

// Actions
export const getCompanyBanksAction = (companyCode: string) => ({ type: GET_COMPANY_BANKS, payload: companyCode });
export const setCompanyBanksAction = (banks: CompanyBankMaster[]) => ({ type: SET_COMPANY_BANKS, payload: banks });
export const addCompanyBankAction = (bank: CompanyBankMaster, companyCode: string, callback?: () => void) => ({ type: ADD_COMPANY_BANK, payload: { bank, companyCode }, callback });
export const updateCompanyBankAction = (id: string, bank: Partial<CompanyBankMaster>, companyCode: string, callback?: () => void) => ({ type: UPDATE_COMPANY_BANK, payload: { id, bank, companyCode }, callback });
export const deleteCompanyBankAction = (id: string, companyCode: string, callback?: () => void) => ({ type: DELETE_COMPANY_BANK, payload: { id, companyCode }, callback });

// Reducer
const initialState: CompanyBankMasterState = {
  data: [],
  loading: false,
  error: null,
};

export default function reducer(state = initialState, action: any): CompanyBankMasterState {
  switch (action.type) {
    case GET_COMPANY_BANKS: return { ...state, loading: true };
    case SET_COMPANY_BANKS: return { ...state, data: action.payload || [], loading: false };
    case SET_ERROR: return { ...state, error: action.payload, loading: false };
    default: return state;
  }
}

// Sagas
function* getCompanyBanksSaga(action: any): SagaIterator {
  try {
    const response = yield call([api, api.get], `/company-bank-master/${action.payload}`);
    yield put(setCompanyBanksAction(response.data));
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  }
}

function* addCompanyBankSaga(action: any): SagaIterator {
  try {
    yield call([api, api.post], `/company-bank-master/${action.payload.companyCode}`, action.payload.bank);
    yield put(getCompanyBanksAction(action.payload.companyCode));
    if (action.callback) action.callback();
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  }
}

function* updateCompanyBankSaga(action: any): SagaIterator {
  try {
    yield call([api, api.put], `/company-bank-master/${action.payload.companyCode}/${action.payload.id}`, action.payload.bank);
    yield put(getCompanyBanksAction(action.payload.companyCode));
    if (action.callback) action.callback();
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  }
}

function* deleteCompanyBankSaga(action: any): SagaIterator {
  try {
    yield call([api, api.delete], `/company-bank-master/${action.payload.companyCode}/${action.payload.id}`);
    yield put(getCompanyBanksAction(action.payload.companyCode));
    if (action.callback) action.callback();
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  }
}

export function* watchCompanyBankMaster(): SagaIterator {
  yield all([
    takeLatest(GET_COMPANY_BANKS, getCompanyBanksSaga),
    takeLatest(ADD_COMPANY_BANK, addCompanyBankSaga),
    takeLatest(UPDATE_COMPANY_BANK, updateCompanyBankSaga),
    takeLatest(DELETE_COMPANY_BANK, deleteCompanyBankSaga),
  ]);
}
