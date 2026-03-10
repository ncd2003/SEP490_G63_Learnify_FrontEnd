import { lazy, Suspense } from "react";
import { useRoutes } from "react-router-dom";
import AuthGuard from "@/guards/auth-guard";
import GuestGuard from "@/guards/guest-guard";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingScreen from "@/components/LoadingScreen";

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

// ─── Auth pages ───────────────────────────────────────────────────────────────
const LoginPage           = Loadable(lazy(() => import("@/pages/Login")));
const RegisterPage        = Loadable(lazy(() => import("@/pages/Register")));
const OtpVerificationPage = Loadable(lazy(() => import("@/pages/OtpVerification")));
const HomePage            = Loadable(lazy(() => import("@/pages/Home")));
const OAuth2RedirectPage  = Loadable(lazy(() => import("@/pages/OAuth2Redirect")));

// ─── Teacher pages ────────────────────────────────────────────────────────────
const UserProfilePage     = Loadable(lazy(() => import("@/pages/UserProfile")));
const ClassroomListPage   = Loadable(lazy(() => import("@/pages/classroom/list/classroom-page")));
const ClassroomPostPage   = Loadable(lazy(() => import("@/pages/classroom/feed/post-page")));
const PendingRequestsPage = Loadable(lazy(() => import("@/pages/classroom/PendingRequests")));

// ─── Not Found ────────────────────────────────────────────────────────────────
const NotFoundPage        = Loadable(lazy(() => import("@/pages/not-found/not-found-page")));

const AppRoutes = () =>
  useRoutes([
    // ── Root / Home ────────────────────────────────────────────────────────────
    {
      path: "/",
      element: <HomePage />,
    },
    {
      path: "/home",
      element: <HomePage />,
    },

    // ── Auth routes ────────────────────────────────────────────────────────────
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
      path: "oauth2/redirect",
      element: <OAuth2RedirectPage />,
    },

    // ── User Profile (All authenticated users) ─────────────────────────────────
    {
      path: "profile",
      element: (
        <AuthGuard>
          <UserProfilePage />
        </AuthGuard>
      ),
    },

    // ── Classroom routes (Teacher & Student with DashboardLayout) ──────────────
    {
      element: (
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        {
          path: "classrooms",
          element: <ClassroomListPage />,
        },
        {
          path: "classrooms/:id",
          element: <ClassroomPostPage />,
        },
        {
          path: "classrooms/:id/pending-requests",
          element: <PendingRequestsPage />,
        },
      ],
    },

    // ── Catch-all ──────────────────────────────────────────────────────────────
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ]);

export default AppRoutes;

