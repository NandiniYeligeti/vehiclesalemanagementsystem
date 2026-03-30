import { put, takeLatest, all, call } from 'redux-saga/effects';
import { SagaIterator } from 'redux-saga';
import * as vehicleService from '@/services/vehicle_models/vehicle_models';

// Action Types
export const GET_VEHICLE_MODELS = 'vehicle_models/GET_VEHICLE_MODELS';
export const SET_VEHICLE_MODELS = 'vehicle_models/SET_VEHICLE_MODELS';
export const ADD_VEHICLE_MODEL = 'vehicle_models/ADD_VEHICLE_MODEL';
export const UPDATE_VEHICLE_MODEL = 'vehicle_models/UPDATE_VEHICLE_MODEL';
export const DELETE_VEHICLE_MODEL = 'vehicle_models/DELETE_VEHICLE_MODEL';
export const SET_LOADING = 'vehicle_models/SET_LOADING';
export const SET_SAVING = 'vehicle_models/SET_SAVING';
export const SET_ERROR = 'vehicle_models/SET_ERROR';

export interface VehicleModel {
  id?: string;
  _id?: string;
  entity_id?: string;
  vehicle_model_code?: string;
  brand: string;
  model: string;
  variant: string;
  fuel_type: string[];
  base_price: number;
  type_id: string;
  category_id: string;
  colors: string[];
  incentive_type: string;
  incentive_value: number;
  color_count: number;
  company_id: string;
  branch_id: string;
  created_at?: string;
}

interface VehicleModelsState {
  data: VehicleModel[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: VehicleModelsState = {
  data: [],
  loading: false,
  saving: false,
  error: null,
};

// Reducer
export default function vehicleModelsReducer(state = initialState, action: any): VehicleModelsState {
  switch (action.type) {
    case SET_VEHICLE_MODELS:
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
export const getVehicleModelsAction = (companyCode: string) => ({
  type: GET_VEHICLE_MODELS,
  payload: companyCode,
});

export const addVehicleModelAction = (data: any, companyCode: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: ADD_VEHICLE_MODEL,
  payload: data,
  companyCode,
  onSuccess,
  onError,
});

export const updateVehicleModelAction = (id: string, data: any, companyCode: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: UPDATE_VEHICLE_MODEL,
  payload: { id, data },
  companyCode,
  onSuccess,
  onError,
});

export const deleteVehicleModelAction = (id: string, companyCode: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: DELETE_VEHICLE_MODEL,
  payload: id,
  companyCode,
  onSuccess,
  onError,
});

// Sagas
function* getVehicleModelsSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_LOADING, payload: true });
    const response = yield call(vehicleService.fetchVehicleModels, action.payload);
    yield put({ type: SET_VEHICLE_MODELS, payload: response.data });
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  } finally {
    yield put({ type: SET_LOADING, payload: false });
  }
}

function* addVehicleModelSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_SAVING, payload: true });
    const companyCode = action.companyCode || 'DEFAULT_COMPANY';
    yield call(vehicleService.addVehicleModel, companyCode, action.payload);
    yield put(getVehicleModelsAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put({ type: SET_SAVING, payload: false });
  }
}

function* updateVehicleModelSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_SAVING, payload: true });
    const companyCode = action.companyCode || 'DEFAULT_COMPANY';
    yield call(vehicleService.updateVehicleModel, companyCode, action.payload.id, action.payload.data);
    yield put(getVehicleModelsAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put({ type: SET_SAVING, payload: false });
  }
}

function* deleteVehicleModelSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_SAVING, payload: true });
    const companyCode = action.companyCode || 'DEFAULT_COMPANY';
    yield call(vehicleService.deleteVehicleModel, companyCode, action.payload);
    yield put(getVehicleModelsAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put({ type: SET_SAVING, payload: false });
  }
}

// Watchers
export function* watchGetVehicleModels() {
  yield takeLatest(GET_VEHICLE_MODELS, getVehicleModelsSaga);
}

export function* watchAddVehicleModel() {
  yield takeLatest(ADD_VEHICLE_MODEL, addVehicleModelSaga);
}

export function* watchUpdateVehicleModel() {
  yield takeLatest(UPDATE_VEHICLE_MODEL, updateVehicleModelSaga);
}

export function* watchDeleteVehicleModel() {
  yield takeLatest(DELETE_VEHICLE_MODEL, deleteVehicleModelSaga);
}
