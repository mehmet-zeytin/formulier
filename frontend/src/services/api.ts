import axios from 'axios';

const API_BASE_URL =
  'http://localhost:3000/api';

const TOKEN_KEY =
  'token';

export const api =
  axios.create({
    baseURL:
      API_BASE_URL,

    timeout:
      15000
  });

api.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem(
        TOKEN_KEY
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

api.interceptors.response.use(
  response =>
    response,

  error => {
    const isLoginRequest =
      error.config?.url?.includes(
        '/auth/login'
      );

    if (
      error.response?.status ===
        401 &&
      !isLoginRequest
    ) {
      localStorage.removeItem(
        TOKEN_KEY
      );

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