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
    CHALLENGE: {
        CREATE: `${API_BASE_URL}/challenges/create`,
        GET_ALL: `${API_BASE_URL}/challenges/getAll`,
        GET_ONE: (id: number | string) => `${API_BASE_URL}/challenges/${id}`,
        UPDATE: (id: number | string) => `${API_BASE_URL}/challenges/${id}`,
        DELETE: (id: number | string) => `${API_BASE_URL}/challenges/${id}`,
        EXECUTE: (id: number | string) => `${API_BASE_URL}/challenges/${id}/execute`,
        FORMAT: `${API_BASE_URL}/challenges/format`,
        GET_HISTORY: (id: number | string) => `${API_BASE_URL}/challenges/${id}/history`,
        GET_SOLUTIONS: (id: number | string) => `${API_BASE_URL}/challenges/${id}/solutions`,
        GET_REVIEWS: (id: number | string) => `${API_BASE_URL}/challenges/${id}/reviews`,
        CREATE_REVIEW: (id: number | string) => `${API_BASE_URL}/challenges/${id}/reviews`,
    },
};
