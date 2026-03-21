 import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/shared/store/slice/authSlice';
import challengeReducer from '@/shared/store/slice/challengeSlice';
import adminReducer from './slice/adminSlice';
import adminManageReducer from './slice/adminManageSlice';
import profileReducer from './slice/profileSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        challenges: challengeReducer,
        admin: adminReducer,
        adminManage: adminManageReducer,
        profile: profileReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
