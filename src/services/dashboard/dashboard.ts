import { api } from "../api";

export const fetchDashboardStats = async (companyCode: string) => {
  const response = await api.get(`/dashboard/${companyCode}`);
  return response.data;
};
