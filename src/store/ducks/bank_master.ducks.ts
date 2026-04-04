import { put, takeLatest, all, call } from 'redux-saga/effects';
import { SagaIterator } from 'redux-saga';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Action Types
export const GET_BANKS = 'bankMaster/GET_BANKS';
export const SET_BANKS = 'bankMaster/SET_BANKS';
export const ADD_BANK = 'bankMaster/ADD_BANK';
export const UPDATE_BANK = 'bankMaster/UPDATE_BANK';
export const DELETE_BANK = 'bankMaster/DELETE_BANK';
export const SET_ERROR = 'bankMaster/SET_ERROR';

export interface BankMaster {
  id?: string;
  _id?: string;
  entity_id?: string;
  bank_name: string;
  branch_name: string;
  contact_person: string;
  contact_number: string;
}

interface BankMasterState {
  data: BankMaster[];
  loading: boolean;
  error: string | null;
}

// Actions
export const getBanksAction = (companyCode: string) => ({ type: GET_BANKS, payload: companyCode });
export const setBanksAction = (banks: BankMaster[]) => ({ type: SET_BANKS, payload: banks });
export const addBankAction = (bank: BankMaster, companyCode: string, callback?: () => void) => ({ type: ADD_BANK, payload: { bank, companyCode }, callback });
export const updateBankAction = (id: string, bank: Partial<BankMaster>, companyCode: string, callback?: () => void) => ({ type: UPDATE_BANK, payload: { id, bank, companyCode }, callback });
export const deleteBankAction = (id: string, companyCode: string, callback?: () => void) => ({ type: DELETE_BANK, payload: { id, companyCode }, callback });

// Reducer
const initialState: BankMasterState = {
  data: [],
  loading: false,
  error: null,
};

export default function reducer(state = initialState, action: any): BankMasterState {
  switch (action.type) {
    case GET_BANKS: return { ...state, loading: true };
    case SET_BANKS: return { ...state, data: action.payload || [], loading: false };
    case SET_ERROR: return { ...state, error: action.payload, loading: false };
    default: return state;
  }
}

// Sagas
function* getBanksSaga(action: any): SagaIterator {
  try {
    const response = yield call(axios.get, `${BASE_URL}/bank-master/${action.payload}`);
    yield put(setBanksAction(response.data));
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  }
}

function* addBankSaga(action: any): SagaIterator {
  try {
    yield call(axios.post, `${BASE_URL}/bank-master/${action.payload.companyCode}`, action.payload.bank);
    yield put(getBanksAction(action.payload.companyCode));
    if (action.callback) action.callback();
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  }
}

function* updateBankSaga(action: any): SagaIterator {
  try {
    yield call(axios.put, `${BASE_URL}/bank-master/${action.payload.companyCode}/${action.payload.id}`, action.payload.bank);
    yield put(getBanksAction(action.payload.companyCode));
    if (action.callback) action.callback();
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  }
}

function* deleteBankSaga(action: any): SagaIterator {
  try {
    yield call(axios.delete, `${BASE_URL}/bank-master/${action.payload.companyCode}/${action.payload.id}`);
    yield put(getBanksAction(action.payload.companyCode));
    if (action.callback) action.callback();
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  }
}

export function* watchBankMaster(): SagaIterator {
  yield all([
    takeLatest(GET_BANKS, getBanksSaga),
    takeLatest(ADD_BANK, addBankSaga),
    takeLatest(UPDATE_BANK, updateBankSaga),
    takeLatest(DELETE_BANK, deleteBankSaga),
  ]);
}
