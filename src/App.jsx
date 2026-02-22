import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import HomePage from "./pages/Home";
import OtpVerificationPage from "./pages/OtpVerification";
import OAuth2Redirect from "./pages/OAuth2Redirect";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OtpVerificationPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
