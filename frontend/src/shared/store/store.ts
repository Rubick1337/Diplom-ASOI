import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/shared/store/slice/authSlice';
import challengeReducer from '@/shared/store/slice/challengeSlice';
import adminReducer from './slice/adminSlice';
import adminManageReducer from './slice/adminManageSlice';
import profileReducer from './slice/profileSlice';
import adminTestReducer from './slice/adminTestSlice';
import testReducer from './slice/testSlice';
import solutionReducer from './slice/solutionSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        challenges: challengeReducer,
        admin: adminReducer,
        adminManage: adminManageReducer,
        profile: profileReducer,
        adminTest: adminTestReducer,
        test: testReducer,
        solutions: solutionReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
