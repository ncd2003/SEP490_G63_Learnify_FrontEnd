import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import AuthGuard from "@/guards/auth-guard";
import GuestGuard from "@/guards/guest-guard";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

// ─── Auth pages ───────────────────────────────────────────────────────────────
const LoginPage             = Loadable(lazy(() => import("@/pages/Login")));
const RegisterPage          = Loadable(lazy(() => import("@/pages/Register")));
const OtpVerificationPage   = Loadable(lazy(() => import("@/pages/OtpVerification")));
const ForgotPasswordPage    = Loadable(lazy(() => import("@/pages/ForgotPassword")));
const ForgotPasswordOtpPage = Loadable(lazy(() => import("@/pages/ForgotPasswordOtp")));
const ResetPasswordPage     = Loadable(lazy(() => import("@/pages/ResetPassword")));
const RoleSelectionPage     = Loadable(lazy(() => import("@/pages/RoleSelection")));

const HomePage              = Loadable(lazy(() => import("@/pages/Home")));
const OAuth2RedirectPage    = Loadable(lazy(() => import("@/pages/OAuth2Redirect")));

// ─── Teacher / User pages ─────────────────────────────────────────────────────
const UserProfilePage           = Loadable(lazy(() => import("@/pages/UserProfile")));
const ClassroomListPage         = Loadable(lazy(() => import("@/pages/classroom/list/classroom-page")));
const StudentClassroomListPage  = Loadable(lazy(() => import("@/pages/classroom/list/student-classroom-page")));
const ClassroomPostPage         = Loadable(lazy(() => import("@/pages/classroom/feed/post-page")));
const PendingRequestsPage   = Loadable(lazy(() => import("@/pages/classroom/PendingRequests")));
const SchedulePage          = Loadable(lazy(() => import("@/pages/classroom/schedule/schedulePage")));

// ─── Not Found ────────────────────────────────────────────────────────────────
const NotFoundPage          = Loadable(lazy(() => import("@/pages/not-found/not-found-page")));

// ─── Role-aware classroom list ────────────────────────────────────────────────
const ClassroomListOrStudentPage = () => {
  const { user } = useAuth();
  if (user?.role === "ROLE_STUDENT") return <StudentClassroomListPage />;
  return <ClassroomListPage />;
};

const AppRoutes = () =>
  useRoutes([
    // ── Root redirect ─────────────────────────────────────────────────────────
    {
      path: "/",
      element: <Navigate to="/home" replace />,
    },

    // ── Public routes ─────────────────────────────────────────────────────────
    {
      path: "home",
      element: <HomePage />,
    },

    // ── Auth routes ───────────────────────────────────────────────────────────
    {
      path: "login",
      element: (
        <GuestGuard>
          <LoginPage />
        </GuestGuard>
      ),
    },
    {
      path: "register",
      element: (
        <GuestGuard>
          <RegisterPage />
        </GuestGuard>
      ),
    },
    {
      path: "verify-otp",
      element: <OtpVerificationPage />,
    },
    {
      path: "forgot-password",
      element: <ForgotPasswordPage />,
    },
    {
      path: "forgot-password-otp",
      element: <ForgotPasswordOtpPage />,
    },
    {
      path: "reset-password",
      element: <ResetPasswordPage />,
    },
    {
      path: "select-role",
      element: <RoleSelectionPage />,
    },
    {
      path: "oauth2/redirect",
      element: <OAuth2RedirectPage />,
    },

    // ── User Profile (Authenticated) ──────────────────────────────────────────
    {
      path: "profile",
      element: (
        <AuthGuard>
          <UserProfilePage />
        </AuthGuard>
      ),
    },

    // ── Classroom list route (with DashboardLayout) ──────────────────────────
    {
      element: (
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        {
          path: "classrooms",
          element: <ClassroomListOrStudentPage />,
        },
      ],
    },

    // ── Classroom detail routes (without DashboardLayout, uses ClassroomDetailLayout inside) ───
    {
      path: "classrooms/:id",
      element: (
        <AuthGuard>
          <ClassroomPostPage />
        </AuthGuard>
      ),
    },
    {
      path: "classrooms/:id/pending-requests",
      element: (
        <AuthGuard>
          <PendingRequestsPage />
        </AuthGuard>
      ),
    },
    {
      path: "classrooms/:id/schedule",
      element: (
        <AuthGuard>
          <SchedulePage />
        </AuthGuard>
      ),
    },

    // ── Catch-all ─────────────────────────────────────────────────────────────
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ]);

export default AppRoutes;