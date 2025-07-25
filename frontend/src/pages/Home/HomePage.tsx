import { useState, useEffect, type FormEvent } from "react";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { setUser } from "../../features/user/userSlice";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../providers/Notification";

const apiUrl = import.meta.env.VITE_API_URL;

const Home = () => {
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const showNotification = useNotification();

  // If already logged in, redirect
  const user = useAppSelector((state) => state.user);
  useEffect(() => {
    if (user.id && user.username) {
      navigate("/image");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username.length == 0) {
      showNotification("Please enter a username!", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${apiUrl}/login`,
        { username },
        {
          withCredentials: true,
        }
      );

      if (response?.data?.user) {
        const { id, username } = response.data.user;
        dispatch(setUser({ id, username }));

        // Redirect to /image after login
        navigate("/image");
      }
    } catch (error) {
      console.error("Error login:", error);
      showNotification("Failed to login.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="text-start">
          <p>Account Authentication</p>
          <p>- Remember your credentials for future logins.</p>
          <p>- New unique usernames will register as new accounts.</p>
          <p>
            - If you sign in and see at least one image, you're likely viewing
            someone else's account. :D
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your username or enter 'Test' for test user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              disabled={loading}
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;
