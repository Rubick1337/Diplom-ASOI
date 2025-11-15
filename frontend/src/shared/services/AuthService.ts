'use client';

import $api from '@/http/apiClient';
import { API_ENDPOINTS } from '@/http/apiEndpoints';

export interface AuthUser {
    id: number;
    username: string;
    email: string;
    role: number;
    // сюда можно добавить googleId/githubId/experience, если нужно
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

export default class AuthService {
    static async login(login: string, password: string): Promise<AuthResponse> {
        try {
            const { data } = await $api.post(API_ENDPOINTS.USER.LOGIN, {
                login,
                password,
            });

            const authResponse: AuthResponse = {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                user: {
                    id: data.user.id,
                    username: data.user.username,
                    email: data.user.email,
                    role: data.user.role,
                },
            };

            return authResponse;
        } catch (error: any) {
            if (error.response) {
                console.error('Server Error:', error.response.data);
                throw new Error(
                    error.response.data.message || 'Неизвестная ошибка при авторизации'
                );
            } else if (error.request) {
                console.error('Request Error:', error.request);
                throw new Error('Не удалось установить соединение с сервером');
            } else {
                console.error('Error:', error.message);
                throw new Error('Ошибка при настройке запроса');
            }
        }
    }

    static async registration(
        username: string,
        email: string,
        password: string,
        role: number
    ): Promise<AuthResponse> {
        const { data } = await $api.post(API_ENDPOINTS.USER.REGISTRATION, {
            username,
            email,
            password,
            role,
        });

        const authResponse: AuthResponse = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                role: data.user.role,
            },
        };

        return authResponse;
    }

    static async logout(): Promise<void> {
        await $api.post(API_ENDPOINTS.USER.LOGOUT);
    }

    static async refresh(): Promise<AuthResponse> {
        const { data } = await $api.get(API_ENDPOINTS.USER.REFRESH, {
            withCredentials: true,
        });

        const authResponse: AuthResponse = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                role: data.user.role,
            },
        };

        return authResponse;
    }
}
