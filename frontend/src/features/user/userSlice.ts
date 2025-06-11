import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id: number | null;
  username: string | null;
}

const savedUser = localStorage.getItem('user');
const initialState: UserState = savedUser
  ? JSON.parse(savedUser)
  : { id: null, username: null };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      state.id = action.payload.id;
      state.username = action.payload.username;

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify({ id: state.id, username: state.username }));
    },
    clearUser(state) {
      state.id = null;
      state.username = null;

      // Remove from localStorage on logout
      localStorage.removeItem('user');
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
