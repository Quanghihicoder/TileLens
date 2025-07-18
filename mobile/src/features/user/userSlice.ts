import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppDispatch } from '../../app/store';

interface UserState {
  id: number | null;
  username: string | null;
}

const initialState: UserState = {
  id: null,
  username: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInState(state, action: PayloadAction<UserState>) {
      state.id = action.payload.id;
      state.username = action.payload.username;
    },
    clearUserInState(state) {
      state.id = null;
      state.username = null;
    },
  },
});

export const { setUserInState, clearUserInState } = userSlice.actions;

// Async thunks
export const setUser = (user: UserState) => async (dispatch: AppDispatch) => {
  await AsyncStorage.setItem('user', JSON.stringify(user));
  dispatch(setUserInState(user));
};

export const clearUser = () => async (dispatch: AppDispatch) => {
  await AsyncStorage.removeItem('user');
  dispatch(clearUserInState());
};

export const loadUser = () => async (dispatch: AppDispatch) => {
  const savedUser = await AsyncStorage.getItem('user');
  console.log("Load")

  console.log(savedUser)
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser) as UserState;
      dispatch(setUserInState(parsed));
    } catch (e) {
      console.warn('Failed to parse stored user:', e);
    }
  }
};

export default userSlice.reducer;
