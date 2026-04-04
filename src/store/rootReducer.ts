import { combineReducers } from "redux";

import customersReducer from "./ducks/customers.ducks";
import salespersonsReducer from "./ducks/salespersons.ducks";
import vehicleModelsReducer from "./ducks/vehicle_models.ducks";
import vehicleInventoryReducer from "./ducks/vehicle_inventory.ducks";
import salesOrdersReducer from "./ducks/sales_orders.ducks";
import paymentsReducer from "./ducks/payments.ducks";
import loansReducer from "./ducks/loans.ducks";
import dashboardReducer from "./ducks/dashboard.ducks";
import authReducer from "./ducks/auth.duck";
import vehicleFeaturesReducer from "./ducks/vehicle_features.ducks";
import companyReducer from "./ducks/company.ducks";
import companyMastersReducer from "./ducks/company_masters.ducks";
import { persistReducer } from "../persist/persist";

// ================================
// ROOT REDUCER
// ================================

const rootReducer = combineReducers({
  customers: customersReducer,
  salespersons: salespersonsReducer,
  vehicleModels: vehicleModelsReducer,
  vehicleInventory: vehicleInventoryReducer,
  salesOrders: salesOrdersReducer,
  payments: paymentsReducer,
  loans: loansReducer,
  dashboard: dashboardReducer,
  vehicleFeatures: vehicleFeaturesReducer,
  company: companyReducer,
  companyMasters: companyMastersReducer,

  auth: persistReducer(authReducer, {
    key: "auth",
  }),
});

// ================================
// ROOT STATE TYPE
// ================================

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;