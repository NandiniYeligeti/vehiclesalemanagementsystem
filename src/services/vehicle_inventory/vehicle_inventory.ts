import { api } from '../api';

export const fetchVehicleInventory = async (companyCode: string) => {
  return await api.get(`/vehicle-inventory/${companyCode}`);
};

export const addVehicleInventory = async (companyCode: string, data: any) => {
  return await api.post(`/vehicle-inventory/${companyCode}`, data);
};

export const updateVehicleInventory = async (companyCode: string, id: string, data: any) => {
  return await api.put(`/vehicle-inventory/${companyCode}/${id}`, data);
};

export const deleteVehicleInventory = async (companyCode: string, id: string) => {
  return await api.delete(`/vehicle-inventory/${companyCode}/${id}`);
};
