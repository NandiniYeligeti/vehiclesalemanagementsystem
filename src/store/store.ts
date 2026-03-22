import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";

import rootReducer, { RootState } from "./rootReducer";
import rootSaga from "./saga";

// ================================
// SAGA MIDDLEWARE
// ================================

const sagaMiddleware = createSagaMiddleware();

// ================================
// STORE
// ================================

const store = configureStore({
  reducer: rootReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,

      serializableCheck: {
        ignoredActions: [
          "customers/ADD_CUSTOMER",
          "customers/UPDATE_CUSTOMER",
          "vehicle_models/ADD_VEHICLE_MODEL",
          "vehicle_models/UPDATE_VEHICLE_MODEL",
          "vehicle_inventory/ADD_VEHICLE_INVENTORY",
          "vehicle_inventory/UPDATE_VEHICLE_INVENTORY",
          "sales_orders/ADD_SALES_ORDER",
          "sales_orders/UPDATE_SALES_ORDER",
          "payments/ADD_PAYMENT",
          "payments/UPDATE_PAYMENT",
          "loans/ADD_LOAN",
          "loans/UPDATE_LOAN",
        ],

        ignoredActionPaths: [
          "payload.identityImage",
          "payload.profileImage",
          "onSuccess",
          "onError",
          "meta.arg",
        ],

        ignoredPaths: [],
      },
    }).concat(sagaMiddleware),
});

// ================================
// RUN ROOT SAGA
// ================================

sagaMiddleware.run(rootSaga);

// ================================
// TYPES
// ================================

export type AppDispatch = typeof store.dispatch;

export type StoreState = RootState;

// ================================
// EXPORT
// ================================

export default store;