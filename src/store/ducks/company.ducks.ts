import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '@/services/api';

// ================================
// CONSTANTS
// ================================

export const GET_COMPANY_SETTINGS = 'company/GET_COMPANY_SETTINGS';
export const SET_COMPANY_SETTINGS = 'company/SET_COMPANY_SETTINGS';
export const UPDATE_COMPANY_SETTINGS = 'company/UPDATE_COMPANY_SETTINGS';
export const SET_COMPANY_ERROR = 'company/SET_COMPANY_ERROR';

export interface CompanySettings {
  id?: string;
  company_id: string;
  company_name: string;
  logo_url: string;
  gst_number: string;
  address: string;
  phone: string;
  email: string;
  invoice_prefix: string;
  currency: string;
  timezone: string;
}

export interface CompanyState {
  settings: CompanySettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: CompanyState = {
  settings: null,
  loading: false,
  saving: false,
  error: null,
};

// ================================
// REDUCER
// ================================

export default function companyReducer(state = initialState, action: any): CompanyState {
  switch (action.type) {
    case GET_COMPANY_SETTINGS:
      return { ...state, loading: true, error: null };
    case SET_COMPANY_SETTINGS:
      return { ...state, settings: action.payload, loading: false, saving: false };
    case UPDATE_COMPANY_SETTINGS:
      return { ...state, saving: true, error: null };
    case SET_COMPANY_ERROR:
      return { ...state, error: action.payload, loading: false, saving: false };
    default:
      return state;
  }
}

// ================================
// ACTIONS
// ================================

export const getCompanySettingsAction = (companyCode: string) => ({
  type: GET_COMPANY_SETTINGS,
  companyCode,
});

export const updateCompanySettingsAction = (companyCode: string, payload: any, onSuccess?: () => void) => ({
  type: UPDATE_COMPANY_SETTINGS,
  companyCode,
  payload,
  onSuccess,
});

// ================================
// SAGAS
// ================================

function* getSettingsSaga(action: any): any {
  try {
    const response = yield call(api.get, `/settings/${action.companyCode}`);
    yield put({ type: SET_COMPANY_SETTINGS, payload: response.data });
  } catch (error: any) {
    console.error('Error fetching company settings:', error);
    yield put({ type: SET_COMPANY_ERROR, payload: error.message || 'Failed to fetch settings' });
  }
}

function* updateSettingsSaga(action: any): any {
  try {
    yield call(api.put, `/settings/${action.companyCode}`, action.payload);
    yield put(getCompanySettingsAction(action.companyCode));
    if (action.onSuccess) action.onSuccess();
  } catch (error: any) {
    console.error('Error updating company settings:', error);
    yield put({ type: SET_COMPANY_ERROR, payload: error.message || 'Failed to update settings' });
  }
}

export function* watchCompanySettings() {
  yield takeLatest(GET_COMPANY_SETTINGS, getSettingsSaga);
  yield takeLatest(UPDATE_COMPANY_SETTINGS, updateSettingsSaga);
}
