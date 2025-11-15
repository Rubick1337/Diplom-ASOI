'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AuthService, { AuthUser } from '@/shared/services/AuthService';

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    error: string | null;
    isAuth: boolean;
}

const initialState: AuthState = {
    user: null,
    isLoading: false,
    error: null,
    isAuth: false,
};

// === Thunks ===

export const login = createAsyncThunk(
    'auth/login',
    async (
        payload: { login: string; password: string },
        { rejectWithValue }
    ) => {
        try {
            const res = await AuthService.login(payload.login, payload.password);
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', res.accessToken);
            }
            return res;
        } catch (e: any) {
            return rejectWithValue(e.message || 'Ошибка при входе');
        }
    }
);

export const registration = createAsyncThunk(
    'auth/registration',
    async (
        payload: { username: string; email: string; password: string; role: number },
        { rejectWithValue }
    ) => {
        try {
            const res = await AuthService.registration(
                payload.username,
                payload.email,
                payload.password,
                payload.role
            );
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', res.accessToken);
            }
            return res;
        } catch (e: any) {
            return rejectWithValue(e.message || 'Ошибка при регистрации');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await AuthService.logout();
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
            }
        } catch (e: any) {
            return rejectWithValue(e.message || 'Ошибка при выходе');
        }
    }
);

export const checkAuth = createAsyncThunk(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            const res = await AuthService.refresh();
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', res.accessToken);
            }
            return res;
        } catch (e: any) {
            return rejectWithValue(e.message || 'Не авторизован');
        }
    }
);

// === Slice ===

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUserFromStorage(state, action) {
            state.user = action.payload;
            state.isAuth = !!action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // LOGIN
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuth = true;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = (action.payload as string) ?? 'Ошибка входа';
                state.isAuth = false;
            })

            // REGISTRATION
            .addCase(registration.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registration.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuth = true;
                state.user = action.payload.user;
            })
            .addCase(registration.rejected, (state, action) => {
                state.isLoading = false;
                state.error = (action.payload as string) ?? 'Ошибка регистрации';
            })

            // LOGOUT
            .addCase(logout.fulfilled, (state) => {
                state.isAuth = false;
                state.user = null;
                state.error = null;
            })

            // CHECK AUTH
            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuth = true;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isLoading = false;
                state.isAuth = false;
                state.user = null;
            });
    },
});

export const { setUserFromStorage } = authSlice.actions;
export default authSlice.reducer;
