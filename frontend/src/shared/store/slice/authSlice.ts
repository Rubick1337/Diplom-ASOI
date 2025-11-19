'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AuthService, { AuthUser, AuthResponse } from '@/shared/services/AuthService';

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

export const login = createAsyncThunk<
    AuthResponse,
    { login: string; password: string },
    { rejectValue: string }
>(
    'auth/login',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await AuthService.login(payload.login, payload.password);
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', res.accessToken);
            }
            return res;
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Ошибка при входе';
            return rejectWithValue(message);
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
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', res.accessToken);
            }
            return res;
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Ошибка при регистрации';
            return rejectWithValue(message);
        }
    }
);

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
    'auth/logout',
    async (_: void, { rejectWithValue }) => {
        try {
            await AuthService.logout();
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
            }
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Ошибка при выходе';
            return rejectWithValue(message);
        }
    }
);

export const checkAuth = createAsyncThunk<
    AuthResponse,
    void,
    { rejectValue: string }
>(
    'auth/checkAuth',
    async (_: void, { rejectWithValue }) => {
        try {
            const res = await AuthService.refresh();
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', res.accessToken);
            }
            return res;
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Не авторизован';
            return rejectWithValue(message);
        }
    }
);

// === Slice ===

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUserFromStorage(state, action: PayloadAction<AuthUser | null>) {
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
                state.error = action.payload ?? 'Ошибка входа';
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
                state.error = action.payload ?? 'Ошибка регистрации';
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
