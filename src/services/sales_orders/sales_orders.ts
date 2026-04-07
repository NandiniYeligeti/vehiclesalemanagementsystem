import { api } from '../api';

export const fetchSalesOrders = async (companyCode: string) => {
  return await api.get(`/sales-order/${companyCode}`);
};

export const createSalesOrder = async (companyCode: string, payload: any) => {
  return await api.post(`/sales-order/${companyCode}`, payload);
};

export const updateSalesOrder = async (companyCode: string, id: string, payload: any) => {
  return await api.put(`/sales-order/${companyCode}/${id}`, payload);
};

export const deleteSalesOrder = async (companyCode: string, id: string) => {
  return await api.delete(`/sales-order/${companyCode}/${id}`);
};

export const resendSalesOrderEmail = async (companyCode: string, id: string) => {
  return await api.post(`/sales-order/${companyCode}/${id}/send-email`);
};

export const previewSalesOrderEmail = async (companyCode: string, id: string) => {
  return await api.get(`/sales-order/${companyCode}/${id}/preview-email`);
};


