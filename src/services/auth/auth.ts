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

// ================= USER MANAGEMENT =================

export const createUserApi = async (companyCode: string, data: { username: string; email: string; password: string }) => {
  const response = await api.post(`/users/${companyCode}`, data);
  return response.data;
};

export const getUsersApi = async (companyCode: string) => {
  const response = await api.get(`/users/${companyCode}`);
  return response.data;
};

export const deleteUserApi = async (companyCode: string, userId: string) => {
  const response = await api.delete(`/users/${companyCode}/${userId}`);
  return response.data;
};

export const updateUserMenusApi = async (userId: string, menus: string[], permissions: any[], branches: string[] = [], showrooms: string[] = [], areas: string[] = []) => {
  const response = await api.put(`/users/${userId}/menus`, { menus, permissions, branches, showrooms, areas });
  return response.data;
};

export const updatePasswordApi = async (userId: string, password: string) => {
  const response = await api.put(`/users/${userId}/password`, { password });
  return response.data;
};

export const forgotPasswordApi = async (email: string) => {
  const response = await api.post("/forgot-password", { email });
  return response.data;
};

