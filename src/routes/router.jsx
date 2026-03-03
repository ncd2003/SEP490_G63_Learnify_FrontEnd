import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Register";
import OtpVerificationPage from "../pages/OtpVerification";
import HomePage from "../pages/Home";
import OAuth2Redirect from "../pages/OAuth2Redirect";
import UserProfile from "../pages/UserProfile";
import ClassroomList from "../pages/classroom/ClassroomList";
import ClassroomFeed from "../pages/classroom/ClassroomFeed";
import ClassroomSchedule from "../pages/classroom/ClassroomSchedule";
import PendingRequests from "../pages/classroom/PendingRequests";
import { PATH_AUTH, PATH_TEACHER } from "./paths";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to={PATH_AUTH.home} replace />} />

        {/* Guest / Public */}
        <Route path={PATH_AUTH.home}           element={<HomePage />} />
        <Route path={PATH_AUTH.login}          element={<LoginPage />} />
        <Route path={PATH_AUTH.register}       element={<RegisterPage />} />
        <Route path={PATH_AUTH.verifyOtp}      element={<OtpVerificationPage />} />
        <Route path={PATH_AUTH.oauth2Redirect} element={<OAuth2Redirect />} />

        {/* Teacher */}
        <Route path={PATH_TEACHER.profile}           element={<UserProfile />} />
        <Route path={PATH_TEACHER.classroom.root}    element={<ClassroomList />} />
        <Route path="/teacher/classrooms/:id" element={<ClassroomFeed />} />
        <Route path="/teacher/classrooms/:id/schedule" element={<ClassroomSchedule />} />
        <Route path="/teacher/classrooms/:id/pending-requests" element={<PendingRequests />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
