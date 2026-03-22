import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { logout } from "@/store/ducks/auth.duck";

// ================================
// TYPES
// ================================

interface JwtPayload {
  exp?: number;
  [key: string]: any;
}

interface RetryAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshSubscriber {
  (token: string | null, err?: any): void;
}

interface ExtendedAxiosInstance extends AxiosInstance {
  __isRefreshing?: boolean;
  __refreshSubscribers?: RefreshSubscriber[];
  __refreshTimeout?: ReturnType<typeof setTimeout>;
}

// ================================
// BASE API SETUP
// ================================

const api = axios.create({
  baseURL:
    import.meta.env.VITE_BASE_URL || "https://fitpro-api.meizoerp.com/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Send cookies with requests
}) as ExtendedAxiosInstance;

const authApi = axios.create({
  baseURL:
    import.meta.env.VITE_AUTH_BASE_URL || "https://api-erp.meizoerp.com",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
}) as ExtendedAxiosInstance;

// ================================
// TOKEN HELPERS
// ================================

// Token helpers are no longer needed with httpOnly cookies
// const getAccessToken = (): string | null => null;
// const setAccessToken = (token: string): void => {};
// const getRefreshToken = (): string | null => null;
// const setRefreshToken = (token: string): void => {};

// ================================
// INTERCEPTORS
// ================================

const setupInterceptors = (dispatch: any): void => {
  const parseJwt = (token: string | null): JwtPayload | null => {
    if (!token) return null;

    try {
      const payload = token.split(".")[1];
      return JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      );
    } catch {
      return null;
    }
  };

  const getExpiryMs = (token: string | null): number | null => {
    const decoded = parseJwt(token);
    if (!decoded?.exp) return null;
    return decoded.exp * 1000;
  };

  const scheduleRefresh = (): void => {
    clearTimeout(api.__refreshTimeout);

    const token = getAccessToken();
    if (!token) return;

    const expMs = getExpiryMs(token);
    if (!expMs) return;

    const delay = Math.max(0, expMs - 60000 - Date.now());

    api.__refreshTimeout = setTimeout(async () => {
      try {
        await performRefresh();
      } catch (err) {
        console.error("Scheduled refresh failed", err);
      }
    }, delay);
  };

  const performRefresh = async (): Promise<string> => {
    if (!api.__isRefreshing) {
      api.__isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        const response = await authApi.post("/authn/api/v1/authn/refresh", {
          refresh_token: refreshToken,
        });

        const data = response.data.data || {};

        const newAccess =
          data.access_token || data.tokens?.AccessToken;

        const newRefresh =
          data.refresh_token || data.tokens?.RefreshToken;

        if (newAccess) setAccessToken(newAccess);
        if (newRefresh) setRefreshToken(newRefresh);

        scheduleRefresh();

        api.__refreshSubscribers?.forEach((cb) => cb(newAccess));
        api.__refreshSubscribers = [];

        return newAccess;
      } catch (err) {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");

        dispatch(logout());

        window.location.href = "/";

        api.__refreshSubscribers?.forEach((cb) => cb(null, err));
        api.__refreshSubscribers = [];

        throw err;
      } finally {
        api.__isRefreshing = false;
      }
    }

    return new Promise((resolve, reject) => {
      api.__refreshSubscribers = api.__refreshSubscribers || [];

      api.__refreshSubscribers.push((token, err) => {
        if (err || !token) reject(err);
        else resolve(token);
      });
    });
  };

  const tryRestoreSession = async (): Promise<void> => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    const expMs = getExpiryMs(accessToken);

    if (accessToken && expMs && expMs - Date.now() > 120000) {
      scheduleRefresh();
      return;
    }

    if (refreshToken) {
      try {
        await performRefresh();
      } catch (err) {
        console.warn("Session restore failed", err);
      }
    }
  };

  // ================================
  // REQUEST INTERCEPTOR
  // ================================

  api.interceptors.request.use(
    (config) => {
      // No manual token injection needed; cookies are sent automatically
      const activeCompany = sessionStorage.getItem("companyCode") || "DEFAULT_COMPANY";

      // 1. MULTI-TENANCY URL INTERPOLATION
      if (config.url && config.url.includes("DEFAULT_COMPANY")) {
        config.url = config.url.replace("DEFAULT_COMPANY", activeCompany);
      }

      // 2. MULTI-TENANCY PAYLOAD INTERPOLATION
      if (config.data) {
        // If data is FormData (like photo uploads)
        if (config.data instanceof FormData) {
          if (config.data.get("company_id") === "DEFAULT_COMPANY") {
             config.data.set("company_id", activeCompany);
          }
        } 
        // If data is standard JSON
        else if (config.data.company_id === "DEFAULT_COMPANY") {
           config.data.company_id = activeCompany;
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // ================================
  // RESPONSE INTERCEPTOR
  // ================================

  api.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },

    async (error: AxiosError<any>) => {
      if (!error.response) {
        return Promise.reject({
          status: 0,
          message: "Network error",
        });
      }

      const originalRequest =
        error.config as RetryAxiosRequestConfig;

      if (error.response.status !== 401) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const token = await performRefresh();

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${token}`,
        };

        return api(originalRequest);
      } catch (err) {
        dispatch(logout());
        window.location.href = "/";
        return Promise.reject(err);
      }
    }
  );

  tryRestoreSession();
};

export { api, authApi, setupInterceptors };