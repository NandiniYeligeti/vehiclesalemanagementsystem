import { api } from '../api';

export const fetchVehicleModels = async (companyCode: string) => {
  return await api.get(`/vehicle-model/${companyCode}`);
};

export const addVehicleModel = async (companyCode: string, data: any) => {
  return await api.post(`/vehicle-model/${companyCode}`, data);
};

export const batchAddVehicleModels = async (companyCode: string, data: any[]) => {
  return await api.post(`/vehicle-model/${companyCode}/batch`, data);
};

export const updateVehicleModel = async (companyCode: string, id: string, data: any) => {
  return await api.put(`/vehicle-model/${companyCode}/${id}`, data);
};

export const deleteVehicleModel = async (companyCode: string, id: string) => {
  return await api.delete(`/vehicle-model/${companyCode}/${id}`);
};
