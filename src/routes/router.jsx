// src/routes/index.js
import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/Login.jsx";
import RegisterScreen from "../pages/Register.jsx";
import OtpVerification from "../pages/OtpVerification.jsx";
import HomePage from "../pages/Home.jsx";
import OAuth2Redirect from "../pages/OAuth2Redirect.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterScreen />,
  },
  {
    path: "/verify-otp",
    element: <OtpVerification />,
  },
  {
    path: "/home",
    element: <HomePage />,
  },
  {
    path: "/oauth2/redirect",
    element: <OAuth2Redirect />,
  },
]);

export default router;
