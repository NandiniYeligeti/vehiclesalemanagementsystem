import { api } from "../api";

export const fetchCustomers = async (companyCode: string) => {
  const response = await api.get(`/customer/${companyCode}`);
  return response.data;
};

export const addCustomer = async (companyCode: string, data: any) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (key === 'photo' && data[key] instanceof File) {
      formData.append('photo', data[key]);
    } else {
      formData.append(key, data[key]);
    }
  });

  const response = await api.post(`/customer/${companyCode}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateCustomer = async (companyCode: string, customerId: string, data: any) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (key === 'photo' && data[key] instanceof File) {
      formData.append('photo', data[key]);
    } else {
      formData.append(key, data[key]);
    }
  });

  const response = await api.put(`/customer/${companyCode}/${customerId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteCustomer = async (companyCode: string, customerId: string) => {
  const response = await api.delete(`/customer/${companyCode}/${customerId}`);
  return response.data;
};

export const fetchCustomerLedger = async (companyCode: string, customerId: string) => {
  const response = await api.get(`/customer/ledger/${companyCode}/${customerId}`);
  return response.data;
};
