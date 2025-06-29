import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/HomePage";
import ImageList from "./pages/Image/ListPage";
import ImageView from "./pages/Image/ViewPage";
import ImageUpload from "./pages/Image/UploadPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAppDispatch } from "./hooks/useRedux";
import { setUser, clearUser } from "./features/user/userSlice";
import { useEffect } from "react";
import axios from "axios";
import NavBar from "./components/NavBar";
import NotFoundPage from "./pages/NotFound/NotFoundPage";

const apiUrl = import.meta.env.VITE_API_URL;

const App = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await axios.get(`${apiUrl}/current_user`, {
          withCredentials: true,
        });
        if (response.data.user) {
          dispatch(setUser(response.data.user));
        } else {
          dispatch(clearUser());
        }
      } catch {
        dispatch(clearUser());
      }
    }

    fetchUser();
  }, [dispatch]);

  return (
    <Routes>
      <Route index element={<Home />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<NavBar />}>
          <Route path="/image">
            <Route index element={<ImageList />} />
            <Route path="view/:imageId" element={<ImageView />} />
            <Route path="upload" element={<ImageUpload />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
