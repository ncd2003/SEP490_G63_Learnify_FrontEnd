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
const LoginPage = Loadable(lazy(() => import("@/pages/Login")));
const RegisterPage = Loadable(lazy(() => import("@/pages/Register")));
const OtpVerificationPage = Loadable(
  lazy(() => import("@/pages/OtpVerification")),
);
const ForgotPasswordPage = Loadable(
  lazy(() => import("@/pages/ForgotPassword")),
);
const ForgotPasswordOtpPage = Loadable(
  lazy(() => import("@/pages/ForgotPasswordOtp")),
);
const ResetPasswordPage = Loadable(lazy(() => import("@/pages/ResetPassword")));
const HomePage = Loadable(lazy(() => import("@/pages/Home")));
const OAuth2RedirectPage = Loadable(
  lazy(() => import("@/pages/OAuth2Redirect")),
);
const RoleSelectionPage = Loadable(lazy(() => import("@/pages/RoleSelection")));

// ─── Teacher pages ────────────────────────────────────────────────────────────
const UserProfilePage = Loadable(lazy(() => import("@/pages/UserProfile")));
const ClassroomListPage = Loadable(
  lazy(() => import("@/pages/classroom/list/classroom-page")),
);
const ClassroomPostPage = Loadable(
  lazy(() => import("@/pages/classroom/feed/post-page")),
);
const PendingRequestsPage = Loadable(
  lazy(() => import("@/pages/classroom/PendingRequests")),
);
const QuestionBankPage = Loadable(
  lazy(() => import("@/pages/question-bank/list/question-bank-page")),
);
const ResourceBankDetailPage = Loadable(
  lazy(() => import("@/pages/question-bank/detail/resource-bank-detail-page")),
);
const EditResourceBankPage = Loadable(
  lazy(() => import("@/pages/question-bank/edit/edit-resource-bank-page")),
);
const ImportQuestionPage = Loadable(
  lazy(() => import("@/pages/question-bank/import/import-question-page")),
);
const AddQuestionMethodPage = Loadable(
  lazy(() => import("@/pages/question-bank/method/add-question-method-page")),
);
const CreateQuestionAiPage = Loadable(
  lazy(() => import("@/pages/question-bank/ai/create-question-ai-page")),
);
const CreateQuestionManualPage = Loadable(
  lazy(
    () => import("@/pages/question-bank/manual/create-question-manual-page"),
  ),
);

// ─── Not Found ────────────────────────────────────────────────────────────────
const NotFoundPage = Loadable(
  lazy(() => import("@/pages/not-found/not-found-page")),
);

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
          path: PATH_AUTH.forgotPassword,
          element: <ForgotPasswordPage />,
        },
        {
          path: PATH_AUTH.forgotPasswordOtp,
          element: <ForgotPasswordOtpPage />,
        },
        {
          path: PATH_AUTH.resetPassword,
          element: <ResetPasswordPage />,
        },
        {
          path: PATH_AUTH.oauth2Redirect,
          element: <OAuth2RedirectPage />,
        },
        {
          path: PATH_AUTH.selectRole,
          element: <RoleSelectionPage />,
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
        {
          path: PATH_TEACHER.questionBank,
          element: <QuestionBankPage />,
        },
        {
          path: PATH_TEACHER.questionBankDetail(":bankId"),
          element: <ResourceBankDetailPage />,
        },
        {
          path: PATH_TEACHER.questionBankEdit(":bankId"),
          element: <EditResourceBankPage />,
        },
        {
          path: PATH_TEACHER.questionBankMethod(":bankId"),
          element: <AddQuestionMethodPage />,
        },
        {
          path: PATH_TEACHER.questionBankImport(":bankId"),
          element: <ImportQuestionPage />,
        },
        {
          path: PATH_TEACHER.questionBankAi(":bankId"),
          element: <CreateQuestionAiPage />,
        },
        {
          path: PATH_TEACHER.questionBankManual(":bankId"),
          element: <CreateQuestionManualPage />,
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
