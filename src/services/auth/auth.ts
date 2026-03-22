import { api } from "../api";

export const loginApi = async (data: any) => {
  const response = await api.post("/login", data);
  return response.data;
};

export const createCompanyApi = async (data: any) => {
  const response = await api.post("/super-admin/company", data);
  return response.data;
};

export const getCompaniesApi = async () => {
  const response = await api.get("/super-admin/companies");
  return response.data;
};
