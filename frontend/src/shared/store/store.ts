 import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/shared/store/slice/authSlice';
import challengeReducer from '@/shared/store/slice/challengeSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        challenges: challengeReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
