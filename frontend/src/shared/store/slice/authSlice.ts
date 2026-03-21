'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AuthService, { AuthUser, AuthResponse } from '@/shared/services/AuthService';

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    error: string | null;
    isAuth: boolean;
    isInitialized: boolean;
}

const initialState: AuthState = {
    user: null,
    isLoading: false,
    error: null,
    isAuth: false,
    isInitialized: false,
};

export const login = createAsyncThunk<AuthResponse, { login: string; password: string }, { rejectValue: string }>(
    'auth/login',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await AuthService.login(payload.login, payload.password);
            localStorage.setItem('token', res.accessToken);
            return res;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка входа');
        }
    }
);

export const registration = createAsyncThunk<
    AuthResponse,
    { username: string; email: string; password: string; role: number },
    { rejectValue: string }
>(
    'auth/registration',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await AuthService.registration(
                payload.username,
                payload.email,
                payload.password,
                payload.role
            );
            localStorage.setItem('token', res.accessToken);
            return res;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка при регистрации');
        }
    }
);

export const logout = createAsyncThunk('auth/logout', async () => {
    try {
        await AuthService.logout();
    } finally {
        localStorage.removeItem('token');
    }
});

export const checkAuth = createAsyncThunk<AuthResponse, void, { rejectValue: string }>(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            const res = await AuthService.refresh();
            localStorage.setItem('token', res.accessToken);
            return res;
        } catch (e) {
            return rejectWithValue('Не авторизован');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {

        addExperience(state, action: PayloadAction<number>) {
            if (state.user) {
                state.user.experience += action.payload;
            }
        },

        clearAuthError(state) {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder

            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuth = true;
                state.isInitialized = true;
                state.user = action.payload.user;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(registration.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registration.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuth = true;
                state.isInitialized = true;
                state.user = action.payload.user;
            })
            .addCase(registration.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(logout.fulfilled, (state) => {
                state.isAuth = false;
                state.user = null;
                state.error = null;
            })

            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuth = true;
                state.isInitialized = true;
                state.user = action.payload.user;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isLoading = false;
                state.isInitialized = true;

                if (!state.isAuth) {
                    state.isAuth = false;
                    state.user = null;
                }
            });
    },
});

export const { addExperience, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
