import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import AuthGuard from "@/guards/auth-guard";
import GuestGuard from "@/guards/guest-guard";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingScreen from "@/components/LoadingScreen";
import { PATH_AUTH } from "@/routes/paths";
import { PATH_TEACHER } from "@/routes/paths";

const Loadable = (Component) => {
  const WrappedComponent = Component;

  return (props) => (
    <Suspense fallback={<LoadingScreen />}>
      <WrappedComponent {...props} />
    </Suspense>
  );
};

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
const RoleSelectionPage = Loadable(lazy(() => import("@/pages/RoleSelection")));

const HomePage = Loadable(lazy(() => import("@/pages/Home")));
const OAuth2RedirectPage = Loadable(
  lazy(() => import("@/pages/OAuth2Redirect")),
);

// ─── Teacher pages ────────────────────────────────────────────────────────────
const UserProfilePage = Loadable(lazy(() => import("@/pages/UserProfile")));
const ChangePasswordPage = Loadable(
  lazy(() => import("@/pages/ChangePassword")),
);
const ClassroomListPage = Loadable(
  lazy(() => import("@/pages/classroom/list/classroom-page")),
);
const ClassroomPostPage = Loadable(
  lazy(() => import("@/pages/classroom/feed/post-page")),
);
const PendingRequestsPage = Loadable(
  lazy(() => import("@/pages/classroom/PendingRequests")),
);
const AssignmentPage = Loadable(
  lazy(() => import("@/pages/assignment/list/assignment-page")),
);
const AssignmentHubPage = Loadable(
  lazy(() => import("@/pages/assignment/hub/assignment-hub-page")),
);
const CreateAssignmentMethodPage = Loadable(
  lazy(() => import("@/pages/assignment/method/create-assignment-method-page")),
);
const ManualAssignmentSetupPage = Loadable(
  lazy(() => import("@/pages/assignment/create/manual-assignment-setup-page")),
);
const ManualAssignmentCreatorPage = Loadable(
  lazy(
    () => import("@/pages/assignment/create/manual-assignment-creator-page"),
  ),
);
const AssignToClassesPage = Loadable(
  lazy(() => import("@/pages/assignment/assign/assign-to-classes-page")),
);
const CreateAssignmentAiPage = Loadable(
  lazy(() => import("@/pages/assignment/ai/create-assignment-ai-page")),
);
const ImportAssignmentFilePage = Loadable(
  lazy(() => import("@/pages/assignment/import/import-assignment-file-page")),
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
      path: PATH_AUTH.selectRole,
      element: <RoleSelectionPage />,
    },
    {
      path: PATH_AUTH.oauth2Redirect,
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
    {
      path: "change-password",
      element: (
        <AuthGuard>
          <ChangePasswordPage />
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
          path: PATH_TEACHER.assignments,
          element: <AssignmentHubPage />,
        },
        {
          path: PATH_TEACHER.assignmentCreateMethod,
          element: <CreateAssignmentMethodPage />,
        },
        {
          path: PATH_TEACHER.assignmentCreateAi,
          element: <CreateAssignmentAiPage />,
        },
        {
          path: PATH_TEACHER.assignmentCreateManual,
          element: <ManualAssignmentSetupPage />,
        },
        {
          path: PATH_TEACHER.assignmentCreateManualQuestions,
          element: <ManualAssignmentCreatorPage />,
        },
        {
          path: PATH_TEACHER.assignmentAssignClasses(":assignmentId"),
          element: <AssignToClassesPage />,
        },
        {
          path: PATH_TEACHER.assignmentCreateImport,
          element: <ImportAssignmentFilePage />,
        },
        {
          path: PATH_TEACHER.classroom.assignments(":id"),
          element: <AssignmentPage />,
        },
        {
          path: PATH_TEACHER.classroom.assignmentCreateManual(":id"),
          element: <ManualAssignmentSetupPage />,
        },
        {
          path: PATH_TEACHER.classroom.assignmentCreateManualQuestions(":id"),
          element: <ManualAssignmentCreatorPage />,
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

    // ── Catch-all ─────────────────────────────────────────────────────────────
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ]);

export default AppRoutes;
