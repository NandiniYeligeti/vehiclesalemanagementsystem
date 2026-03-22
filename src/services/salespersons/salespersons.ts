import { api } from '../api';

export const fetchSalespersons = async (companyCode: string) => {
  return await api.get(`/salesperson/${companyCode}`);
};

export const addSalesperson = async (companyCode: string, data: any) => {
  return await api.post(`/salesperson/${companyCode}`, data);
};

export const updateSalesperson = async (companyCode: string, id: string, data: any) => {
  return await api.put(`/salesperson/${companyCode}/${id}`, data);
};

export const deleteSalesperson = async (companyCode: string, id: string) => {
  return await api.delete(`/salesperson/${companyCode}/${id}`);
};
