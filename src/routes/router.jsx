import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import { PATH_AUTH, PATH_TEACHER } from "./paths";
import GuestGuard from "@/guards/guest-guard";
import RoleBasedGuard from "@/guards/role-base-guard";
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
    // ── Root redirect ──────────────────────────────────────────────────────────
    {
      path: "/",
      element: <Navigate to={PATH_AUTH.home} replace />,
    },

    // ── Auth routes ────────────────────────────────────────────────────────────
    {
      path: PATH_AUTH.root,
      children: [
        {
          path: PATH_AUTH.login,
          element: (
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          ),
        },
        {
          path: PATH_AUTH.register,
          element: (
            <GuestGuard>
              <RegisterPage />
            </GuestGuard>
          ),
        },
        {
          path: PATH_AUTH.verifyOtp,
          element: <OtpVerificationPage />,
        },
        {
          path: PATH_AUTH.oauth2Redirect,
          element: <OAuth2RedirectPage />,
        },
      ],
    },

    // ── Public routes ──────────────────────────────────────────────────────────
    {
      path: PATH_AUTH.home,
      element: <HomePage />,
    },

    // ── Teacher routes ─────────────────────────────────────────────────────────
    {
      path: PATH_TEACHER.root,
      element: (
        <RoleBasedGuard role="ROLE_TEACHER">
          <DashboardLayout />
        </RoleBasedGuard>
      ),
      children: [
        {
          index: true,
          element: <Navigate to={PATH_TEACHER.classroom.root} replace />,
        },
        {
          path: PATH_TEACHER.profile,
          element: <UserProfilePage />,
        },
        {
          path: PATH_TEACHER.classroom.root,
          element: <ClassroomListPage />,
        },
        {
          path: PATH_TEACHER.classroom.detail(":id"),
          element: <ClassroomPostPage />,
        },
        {
          path: PATH_TEACHER.classroom.pendingRequests(":id"),
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

