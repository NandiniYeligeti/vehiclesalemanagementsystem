import { api } from '../api';

export const fetchLoans = async (companyCode: string) => {
  return await api.get(`/loan/${companyCode}`);
};

export const fetchLoanById = async (companyCode: string, id: string) => {
  return await api.get(`/loan/${companyCode}/${id}`);
};

export const addLoan = async (companyCode: string, data: any) => {
  return await api.post(`/loan/${companyCode}`, data);
};

export const updateLoan = async (companyCode: string, id: string, data: any) => {
  return await api.put(`/loan/${companyCode}/${id}`, data);
};

export const deleteLoan = async (companyCode: string, id: string) => {
  return await api.delete(`/loan/${companyCode}/${id}`);
};
