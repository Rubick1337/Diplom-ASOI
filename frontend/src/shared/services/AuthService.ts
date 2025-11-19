'use client';

import $api from '@/http/apiClient';
import { API_ENDPOINTS } from '@/http/apiEndpoints';

export interface AuthUser {
    id: number;
    username: string;
    email: string;
    role: number;
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
        } catch (error: unknown) {
            // аккуратно сужаем unknown
            if (typeof error === 'object' && error !== null) {
                const err = error as {
                    response?: { data?: { message?: string } };
                    request?: unknown;
                    message?: string;
                };

                if (err.response) {
                    console.error('Server Error:', err.response.data);
                    throw new Error(
                        err.response.data?.message ||
                        'Неизвестная ошибка при авторизации'
                    );
                }

                if (err.request) {
                    console.error('Request Error:', err.request);
                    throw new Error('Не удалось установить соединение с сервером');
                }

                if (typeof err.message === 'string') {
                    console.error('Error:', err.message);
                    throw new Error('Ошибка при настройке запроса');
                }
            }

            console.error('Unknown auth error:', error);
            throw new Error('Неизвестная ошибка при авторизации');
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
