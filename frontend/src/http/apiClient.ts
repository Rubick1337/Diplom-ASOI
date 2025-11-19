'use client';

import axios from 'axios';
import { API_ENDPOINTS } from './apiEndpoints';

export const API_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9005/api';

const $api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

$api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

$api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._isRetry
        ) {
            originalRequest._isRetry = true;
            try {
                const refreshResponse = await axios.get(
                    API_ENDPOINTS.USER.REFRESH,
                    { withCredentials: true }
                );

                const newAccessToken = refreshResponse.data.accessToken;
                if (typeof window !== 'undefined' && newAccessToken) {
                    localStorage.setItem('token', newAccessToken);
                }

                return $api.request(originalRequest);
            } catch (refreshError) {
                console.error('Не авторизован (refresh не прошёл)', refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default $api;
