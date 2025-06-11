import { useAppSelector, useAppDispatch } from "../hooks";
import { clearUser } from "../features/user/userSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import hamburger from "../assets/icons/hamburger.svg";

const apiUrl = import.meta.env.VITE_API_URL;

const NavBar = () => {
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post(`${apiUrl}/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      dispatch(clearUser());
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-wrap items-center justify-between">
          {/* Left - App Name */}
          <div className="flex items-center flex-shrink-0 mr-4">
            <h1 className="text-xl font-bold">My App</h1>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="block md:hidden p-2 border rounded border-white bg-white"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              // Simple X to close menu
              <span className="text-black text-2xl font-bold leading-none select-none">
                &times;
              </span>
            ) : (
              // Hamburger icon image when menu is closed
              <img src={hamburger} alt="Menu" className="h-6 w-6" />
            )}
          </button>

          {/* Center + Right - Nav Links and User Info */}
          <div
            className={`w-full md:flex md:items-center md:w-auto ${
              menuOpen ? "block" : "hidden"
            }`}
          >
            <div className="flex flex-col md:flex-row md:space-x-6 md:mr-6">
              <NavLink
                to="/image"
                end
                className={({ isActive }) =>
                  isActive
                    ? "text-yellow-300 font-semibold border-b-2 border-yellow-300 "
                    : "hover:text-yellow-200 py-2 md:py-0"
                }
                onClick={() => setMenuOpen(false)}
              >
                My Images
              </NavLink>
              <NavLink
                to="/image/upload"
                className={({ isActive }) =>
                  isActive
                    ? "text-yellow-300 font-semibold border-b-2 border-yellow-300 "
                    : "hover:text-yellow-200 py-2 md:py-0"
                }
                onClick={() => setMenuOpen(false)}
              >
                Upload Image
              </NavLink>
            </div>

            {user.username && (
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mt-3 md:mt-0">
                <span className="font-semibold text-center md:text-left">
                  Hello, {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100 mt-2 md:mt-0"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default NavBar;
