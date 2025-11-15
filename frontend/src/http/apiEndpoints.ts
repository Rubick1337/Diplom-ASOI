// shared/http/apiEndpoints.ts

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9005/api';

console.log('API_BASE_URL:', API_BASE_URL);

export const API_ENDPOINTS = {
    USER: {
        LOGIN: `${API_BASE_URL}/users/login`,
        LOGOUT: `${API_BASE_URL}/users/logout`,
        REGISTRATION: `${API_BASE_URL}/users/register`,
        REFRESH: `${API_BASE_URL}/users/refresh`,
        GET_USERS: `${API_BASE_URL}/users/getAll`,
        UPDATE_USER: (id: number | string) => `${API_BASE_URL}/users/${id}`,
    },
};
