import { all, fork } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";

import {
  watchGetCustomers,
  watchAddCustomer,
  watchUpdateCustomer,
  watchDeleteCustomer,
  watchGetCustomerLedger,
} from "./ducks/customers.ducks";

import {
  watchGetSalespersons,
  watchAddSalesperson,
  watchUpdateSalesperson,
  watchDeleteSalesperson,
} from "./ducks/salespersons.ducks";

import {
  watchGetVehicleModels,
  watchAddVehicleModel,
  watchUpdateVehicleModel,
  watchDeleteVehicleModel,
} from "./ducks/vehicle_models.ducks";

import {
  watchGetVehicleInventory,
  watchAddVehicleInventory,
  watchUpdateVehicleInventory,
  watchDeleteVehicleInventory,
} from "./ducks/vehicle_inventory.ducks";
import { watchSalesOrders } from "./ducks/sales_orders.ducks";
import { watchPayments } from "./ducks/payments.ducks";
import { watchLoans } from "./ducks/loans.ducks";
import { watchGetDashboardStats } from "./ducks/dashboard.ducks";
import { watchAuth } from "./ducks/auth.duck";

// ================================
// ROOT SAGA
// ================================

export default function* rootSaga(): SagaIterator {
  yield all([
    fork(watchAuth),
    // Customers
    fork(watchGetCustomers),
    fork(watchAddCustomer),
    fork(watchUpdateCustomer),
    fork(watchDeleteCustomer),
    fork(watchGetCustomerLedger),

    // Salespersons
    fork(watchGetSalespersons),
    fork(watchAddSalesperson),
    fork(watchUpdateSalesperson),
    fork(watchDeleteSalesperson),

    // Vehicle Models
    fork(watchGetVehicleModels),
    fork(watchAddVehicleModel),
    fork(watchUpdateVehicleModel),
    fork(watchDeleteVehicleModel),

    // Vehicle Inventory
    fork(watchGetVehicleInventory),
    fork(watchAddVehicleInventory),
    fork(watchUpdateVehicleInventory),
    fork(watchDeleteVehicleInventory),

    fork(watchSalesOrders),
    fork(watchPayments),
    fork(watchLoans),
    fork(watchGetDashboardStats),
  ]);
}