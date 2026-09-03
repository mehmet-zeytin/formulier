import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'api';

export const api =
  axios.create({
    baseURL:
      API_BASE_URL,

    timeout:
      15000,

    /*
     * HttpOnly-cookie'yi backend'e
     * otomatik gönder.
     */
    withCredentials:
      true
  });

api.interceptors.response.use(
  response =>
    response,

  error => {
    const isLoginRequest =
      error.config
        ?.url
        ?.includes(
          '/auth/login'
        );

    const isLogoutRequest =
      error.config
        ?.url
        ?.includes(
          '/auth/logout'
        );

    if (
      error.response
        ?.status ===
        401 &&
      !isLoginRequest &&
      !isLogoutRequest
    ) {
      if (
        window.location.pathname !==
          '/login'
      ) {
        window.location.href =
          '/login';
      }
    }

    return Promise.reject(
      error
    );
  }
);