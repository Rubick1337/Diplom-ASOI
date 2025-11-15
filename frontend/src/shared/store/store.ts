'use client';

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/shared/store/slice/authSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        // bikes: bikeReducer,
        // ...
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
