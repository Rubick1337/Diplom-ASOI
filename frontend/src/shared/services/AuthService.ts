'use client';

import $api from '@/http/apiClient';
import { API_ENDPOINTS } from '@/http/apiEndpoints';

export interface AuthUser {
    id: number;
    username: string;
    email: string;
    role: number;
    roleName: string | null;
    experience: number;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

export default class AuthService {
    private static mapResponse(data: any): AuthResponse {
        return {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                role: data.user.role ?? data.user.roleId,
                roleName: data.user.roleName ?? null,
                experience: data.user.experience || 0,
            },
        };
    }

    static async login(login: string, password: string): Promise<AuthResponse> {
        const { data } = await $api.post(API_ENDPOINTS.USER.LOGIN, { login, password });
        return this.mapResponse(data);
    }

    static async registration(username: string, email: string, password: string, role: number): Promise<AuthResponse> {
        const { data } = await $api.post(API_ENDPOINTS.USER.REGISTRATION, { username, email, password, role });
        return this.mapResponse(data);
    }

    static async logout(): Promise<void> {
        await $api.post(API_ENDPOINTS.USER.LOGOUT);
    }

    static async refresh(): Promise<AuthResponse> {
        const { data } = await $api.get(API_ENDPOINTS.USER.REFRESH, { withCredentials: true });
        return this.mapResponse(data);
    }
}
