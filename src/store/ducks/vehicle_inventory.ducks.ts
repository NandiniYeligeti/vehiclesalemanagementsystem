import { put, takeLatest, all, call, fork } from 'redux-saga/effects';
import { SagaIterator } from 'redux-saga';
import * as vehicleService from '@/services/vehicle_inventory/vehicle_inventory';

// Action Types
export const GET_VEHICLE_INVENTORY = 'vehicle_inventory/GET_VEHICLE_INVENTORY';
export const SET_VEHICLE_INVENTORY = 'vehicle_inventory/SET_VEHICLE_INVENTORY';
export const ADD_VEHICLE_INVENTORY = 'vehicle_inventory/ADD_VEHICLE_INVENTORY';
export const UPDATE_VEHICLE_INVENTORY = 'vehicle_inventory/UPDATE_VEHICLE_INVENTORY';
export const DELETE_VEHICLE_INVENTORY = 'vehicle_inventory/DELETE_VEHICLE_INVENTORY';
export const SET_LOADING = 'vehicle_inventory/SET_LOADING';
export const SET_SAVING = 'vehicle_inventory/SET_SAVING';
export const SET_ERROR = 'vehicle_inventory/SET_ERROR';

export interface VehicleInventory {
  id?: string;
  _id?: string;
  entity_id?: string;
  inventory_code?: string;
  vehicle_model_id: string;
  color: string;
  chassis_number: string;
  engine_number: string;
  purchase_date: string;
  status?: string;
  brand?: string;
  model?: string;
  variant?: string;
  fuel_type?: string;
  base_price?: number;
  created_at?: string;
}

interface VehicleInventoryState {
  data: VehicleInventory[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: VehicleInventoryState = {
  data: [],
  loading: false,
  saving: false,
  error: null,
};

// Reducer
export default function vehicleInventoryReducer(state = initialState, action: any): VehicleInventoryState {
  switch (action.type) {
    case SET_VEHICLE_INVENTORY:
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
export const getVehicleInventoryAction = (companyCode: string) => ({
  type: GET_VEHICLE_INVENTORY,
  payload: companyCode,
});

export const addVehicleInventoryAction = (data: any, companyCode: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: ADD_VEHICLE_INVENTORY,
  payload: data,
  companyCode,
  onSuccess,
  onError,
});

export const updateVehicleInventoryAction = (id: string, data: any, companyCode: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: UPDATE_VEHICLE_INVENTORY,
  payload: { id, data },
  companyCode,
  onSuccess,
  onError,
});

export const deleteVehicleInventoryAction = (id: string, companyCode: string, onSuccess?: () => void, onError?: (err: any) => void) => ({
  type: DELETE_VEHICLE_INVENTORY,
  payload: id,
  companyCode,
  onSuccess,
  onError,
});

// Sagas
function* getVehicleInventorySaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_LOADING, payload: true });
    const response = yield call(vehicleService.fetchVehicleInventory, action.payload);
    yield put({ type: SET_VEHICLE_INVENTORY, payload: response.data });
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  } finally {
    yield put({ type: SET_LOADING, payload: false });
  }
}

function* addVehicleInventorySaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_SAVING, payload: true });
    const companyCode = action.companyCode || 'DEFAULT_COMPANY';
    yield call(vehicleService.addVehicleInventory, companyCode, action.payload);
    yield put(getVehicleInventoryAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put({ type: SET_SAVING, payload: false });
  }
}

function* updateVehicleInventorySaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_SAVING, payload: true });
    const companyCode = action.companyCode || 'DEFAULT_COMPANY';
    yield call(vehicleService.updateVehicleInventory, companyCode, action.payload.id, action.payload.data);
    yield put(getVehicleInventoryAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put({ type: SET_SAVING, payload: false });
  }
}

function* deleteVehicleInventorySaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_SAVING, payload: true });
    const companyCode = action.companyCode || 'DEFAULT_COMPANY';
    yield call(vehicleService.deleteVehicleInventory, companyCode, action.payload);
    yield put(getVehicleInventoryAction(companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
    if (action.onError) yield call(action.onError, error);
  } finally {
    yield put({ type: SET_SAVING, payload: false });
  }
}

// Watchers
export function* watchGetVehicleInventory() {
  yield takeLatest(GET_VEHICLE_INVENTORY, getVehicleInventorySaga);
}

export function* watchAddVehicleInventory() {
  yield takeLatest(ADD_VEHICLE_INVENTORY, addVehicleInventorySaga);
}

export function* watchUpdateVehicleInventory() {
  yield takeLatest(UPDATE_VEHICLE_INVENTORY, updateVehicleInventorySaga);
}

export function* watchDeleteVehicleInventory() {
  yield takeLatest(DELETE_VEHICLE_INVENTORY, deleteVehicleInventorySaga);
}
