import { api } from '../api';

export const fetchPayments = async (companyCode: string) => {
  return await api.get(`/payment/${companyCode}`);
};

export const createPayment = async (companyCode: string, payload: any) => {
  return await api.post(`/payment/${companyCode}`, payload);
};

export const updatePayment = async (companyCode: string, id: string, payload: any) => {
  return await api.put(`/payment/${companyCode}/${id}`, payload);
};

export const deletePayment = async (companyCode: string, id: string) => {
  return await api.delete(`/payment/${companyCode}/${id}`);
};

export const resendPaymentEmail = async (companyCode: string, id: string) => {
  return await api.post(`/payment/${companyCode}/${id}/send-email`);
};

export const previewPaymentEmail = async (companyCode: string, id: string) => {
  return await api.get(`/payment/${companyCode}/${id}/preview-email`);
};


