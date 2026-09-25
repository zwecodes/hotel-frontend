import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let refreshPromise = null;

function hasSessionFlag() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("hb_session="));
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/api/auth/refresh")
      .then((res) => res)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || "";

    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout") ||
      url.includes("/auth/me") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");

    if (status === 401 && !original._retry && !isAuthEndpoint && hasSessionFlag()) {
      original._retry = true;
      try {
        await refreshSession();
        return api(original);
      } catch {
        if (typeof window !== "undefined") {
          document.cookie = "hb_session=; path=/; max-age=0; SameSite=Lax";
          const path = window.location.pathname;
          if (!path.startsWith("/auth/")) {
            window.location.href = "/auth/login";
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
