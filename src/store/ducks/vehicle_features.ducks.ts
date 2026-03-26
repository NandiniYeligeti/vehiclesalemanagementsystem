import { put, takeLatest, call, all } from 'redux-saga/effects';
import { SagaIterator } from 'redux-saga';
import * as featureService from '@/services/vehicle_features/vehicle_features';

// Action Types
export const GET_TYPES = 'vehicle_features/GET_TYPES';
export const SET_TYPES = 'vehicle_features/SET_TYPES';
export const ADD_TYPE = 'vehicle_features/ADD_TYPE';
export const DELETE_TYPE = 'vehicle_features/DELETE_TYPE';

export const GET_CATEGORIES = 'vehicle_features/GET_CATEGORIES';
export const SET_CATEGORIES = 'vehicle_features/SET_CATEGORIES';
export const ADD_CATEGORY = 'vehicle_features/ADD_CATEGORY';
export const DELETE_CATEGORY = 'vehicle_features/DELETE_CATEGORY';

export const GET_ACCESSORIES = 'vehicle_features/GET_ACCESSORIES';
export const SET_ACCESSORIES = 'vehicle_features/SET_ACCESSORIES';
export const ADD_ACCESSORY = 'vehicle_features/ADD_ACCESSORY';
export const DELETE_ACCESSORY = 'vehicle_features/DELETE_ACCESSORY';

export const SET_LOADING = 'vehicle_features/SET_LOADING';
export const SET_ERROR = 'vehicle_features/SET_ERROR';

export interface VehicleFeatureItem {
  id?: string;
  _id?: string;
  entity_id?: string;
  name: string;
  price?: number;
}

interface VehicleFeaturesState {
  types: VehicleFeatureItem[];
  categories: VehicleFeatureItem[];
  accessories: VehicleFeatureItem[];
  loading: boolean;
  error: string | null;
}

const initialState: VehicleFeaturesState = {
  types: [],
  categories: [],
  accessories: [],
  loading: false,
  error: null,
};

// Reducer
export default function vehicleFeaturesReducer(state = initialState, action: any): VehicleFeaturesState {
  switch (action.type) {
    case SET_TYPES:
      return { ...state, types: action.payload, loading: false };
    case SET_CATEGORIES:
      return { ...state, categories: action.payload, loading: false };
    case SET_ACCESSORIES:
      return { ...state, accessories: action.payload, loading: false };
    case SET_LOADING:
      return { ...state, loading: action.payload };
    case SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

// Action Creators
export const getTypesAction = (companyCode: string) => ({ type: GET_TYPES, payload: companyCode });
export const addTypeAction = (companyCode: string, data: any, onSuccess?: () => void, onError?: (err: any) => void) => ({ type: ADD_TYPE, companyCode, payload: data, onSuccess, onError });
export const deleteTypeAction = (companyCode: string, id: string, onSuccess?: () => void, onError?: (err: any) => void) => ({ type: DELETE_TYPE, companyCode, payload: id, onSuccess, onError });

export const getCategoriesAction = (companyCode: string) => ({ type: GET_CATEGORIES, payload: companyCode });
export const addCategoryAction = (companyCode: string, data: any, onSuccess?: () => void, onError?: (err: any) => void) => ({ type: ADD_CATEGORY, companyCode, payload: data, onSuccess, onError });
export const deleteCategoryAction = (companyCode: string, id: string, onSuccess?: () => void, onError?: (err: any) => void) => ({ type: DELETE_CATEGORY, companyCode, payload: id, onSuccess, onError });

export const getAccessoriesAction = (companyCode: string) => ({ type: GET_ACCESSORIES, payload: companyCode });
export const addAccessoryAction = (companyCode: string, data: any, onSuccess?: () => void, onError?: (err: any) => void) => ({ type: ADD_ACCESSORY, companyCode, payload: data, onSuccess, onError });
export const deleteAccessoryAction = (companyCode: string, id: string, onSuccess?: () => void, onError?: (err: any) => void) => ({ type: DELETE_ACCESSORY, companyCode, payload: id, onSuccess, onError });

// Sagas
function* getTypesSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_LOADING, payload: true });
    const response = yield call(featureService.fetchVehicleTypes, action.payload);
    yield put({ type: SET_TYPES, payload: response.data });
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  } finally {
    yield put({ type: SET_LOADING, payload: false });
  }
}

function* addTypeSaga(action: any): SagaIterator {
  try {
    yield call(featureService.addVehicleType, action.companyCode, action.payload);
    yield put(getTypesAction(action.companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    if (action.onError) yield call(action.onError, error);
  }
}

function* deleteTypeSaga(action: any): SagaIterator {
  try {
    yield call(featureService.deleteVehicleType, action.companyCode, action.payload);
    yield put(getTypesAction(action.companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    if (action.onError) yield call(action.onError, error);
  }
}

// Categories Sagas
function* getCategoriesSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_LOADING, payload: true });
    const response = yield call(featureService.fetchVehicleCategories, action.payload);
    yield put({ type: SET_CATEGORIES, payload: response.data });
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  } finally {
    yield put({ type: SET_LOADING, payload: false });
  }
}

function* addCategorySaga(action: any): SagaIterator {
  try {
    yield call(featureService.addVehicleCategory, action.companyCode, action.payload);
    yield put(getCategoriesAction(action.companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    if (action.onError) yield call(action.onError, error);
  }
}

function* deleteCategorySaga(action: any): SagaIterator {
  try {
    yield call(featureService.deleteVehicleCategory, action.companyCode, action.payload);
    yield put(getCategoriesAction(action.companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    if (action.onError) yield call(action.onError, error);
  }
}

// Accessories Sagas
function* getAccessoriesSaga(action: any): SagaIterator {
  try {
    yield put({ type: SET_LOADING, payload: true });
    const response = yield call(featureService.fetchVehicleAccessories, action.payload);
    yield put({ type: SET_ACCESSORIES, payload: response.data });
  } catch (error: any) {
    yield put({ type: SET_ERROR, payload: error.message });
  } finally {
    yield put({ type: SET_LOADING, payload: false });
  }
}

function* addAccessorySaga(action: any): SagaIterator {
  try {
    yield call(featureService.addVehicleAccessory, action.companyCode, action.payload);
    yield put(getAccessoriesAction(action.companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    if (action.onError) yield call(action.onError, error);
  }
}

function* deleteAccessorySaga(action: any): SagaIterator {
  try {
    yield call(featureService.deleteVehicleAccessory, action.companyCode, action.payload);
    yield put(getAccessoriesAction(action.companyCode));
    if (action.onSuccess) yield call(action.onSuccess);
  } catch (error: any) {
    if (action.onError) yield call(action.onError, error);
  }
}

// Watchers
export function* watchVehicleFeatures() {
  yield all([
    takeLatest(GET_TYPES, getTypesSaga),
    takeLatest(ADD_TYPE, addTypeSaga),
    takeLatest(DELETE_TYPE, deleteTypeSaga),
    takeLatest(GET_CATEGORIES, getCategoriesSaga),
    takeLatest(ADD_CATEGORY, addCategorySaga),
    takeLatest(DELETE_CATEGORY, deleteCategorySaga),
    takeLatest(GET_ACCESSORIES, getAccessoriesSaga),
    takeLatest(ADD_ACCESSORY, addAccessorySaga),
    takeLatest(DELETE_ACCESSORY, deleteAccessorySaga),
  ]);
}
