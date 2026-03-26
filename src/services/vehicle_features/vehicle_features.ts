import { api } from '../api';

// Types
export const fetchVehicleTypes = async (companyCode: string) => {
  return await api.get(`/vehicle-features/type/${companyCode}`);
};

export const addVehicleType = async (companyCode: string, data: any) => {
  return await api.post(`/vehicle-features/type/${companyCode}`, data);
};

export const deleteVehicleType = async (companyCode: string, id: string) => {
  return await api.delete(`/vehicle-features/type/${companyCode}/${id}`);
};

// Categories
export const fetchVehicleCategories = async (companyCode: string) => {
  return await api.get(`/vehicle-features/category/${companyCode}`);
};

export const addVehicleCategory = async (companyCode: string, data: any) => {
  return await api.post(`/vehicle-features/category/${companyCode}`, data);
};

export const deleteVehicleCategory = async (companyCode: string, id: string) => {
  return await api.delete(`/vehicle-features/category/${companyCode}/${id}`);
};

// Accessories
export const fetchVehicleAccessories = async (companyCode: string) => {
  return await api.get(`/vehicle-features/accessory/${companyCode}`);
};

export const addVehicleAccessory = async (companyCode: string, data: any) => {
  return await api.post(`/vehicle-features/accessory/${companyCode}`, data);
};

export const deleteVehicleAccessory = async (companyCode: string, id: string) => {
  return await api.delete(`/vehicle-features/accessory/${companyCode}/${id}`);
};
