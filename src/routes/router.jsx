import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import AuthGuard from "@/guards/auth-guard";
import GuestGuard from "@/guards/guest-guard";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { PATH_AUTH, PATH_TEACHER } from "@/routes/paths";

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

// ─── Auth pages ─────────────────────────────────────────────
const LoginPage             = Loadable(lazy(() => import("@/pages/Login")));
const RegisterPage          = Loadable(lazy(() => import("@/pages/Register")));
const OtpVerificationPage   = Loadable(lazy(() => import("@/pages/OtpVerification")));
const ForgotPasswordPage    = Loadable(lazy(() => import("@/pages/ForgotPassword")));
const ForgotPasswordOtpPage = Loadable(lazy(() => import("@/pages/ForgotPasswordOtp")));
const ResetPasswordPage     = Loadable(lazy(() => import("@/pages/ResetPassword")));
const RoleSelectionPage     = Loadable(lazy(() => import("@/pages/RoleSelection")));
const OAuth2RedirectPage    = Loadable(lazy(() => import("@/pages/OAuth2Redirect")));

const HomePage              = Loadable(lazy(() => import("@/pages/Home")));

// ─── User / Profile ─────────────────────────────────────────
const UserProfilePage       = Loadable(lazy(() => import("@/pages/UserProfile")));
const ChangePasswordPage    = Loadable(lazy(() => import("@/pages/ChangePassword")));

// ─── Classroom ─────────────────────────────────────────────
const ClassroomListPage         = Loadable(lazy(() => import("@/pages/classroom/list/classroom-page")));
const StudentClassroomListPage  = Loadable(lazy(() => import("@/pages/classroom/list/student-classroom-page")));
const ClassroomPostPage         = Loadable(lazy(() => import("@/pages/classroom/feed/post-page")));
const PendingRequestsPage       = Loadable(lazy(() => import("@/pages/classroom/PendingRequests")));
const SchedulePage              = Loadable(lazy(() => import("@/pages/classroom/schedule/schedulePage")));
const AttendanceListPage        = Loadable(lazy(() => import("@/pages/classroom/attendance/attendance-list-page")));
const AttendancePage            = Loadable(lazy(() => import("@/pages/classroom/attendance/attendance-page")));
const FoldersPage               = Loadable(lazy(() => import("@/pages/classroom/folders/foldersPage")));

// ─── Question Bank ─────────────────────────────────────────
const QuestionBankPage          = Loadable(lazy(() => import("@/pages/question-bank/list/question-bank-page")));
const ResourceBankDetailPage    = Loadable(lazy(() => import("@/pages/question-bank/detail/resource-bank-detail-page")));
const EditResourceBankPage      = Loadable(lazy(() => import("@/pages/question-bank/edit/edit-resource-bank-page")));
const ImportQuestionPage        = Loadable(lazy(() => import("@/pages/question-bank/import/import-question-page")));
const AddQuestionMethodPage     = Loadable(lazy(() => import("@/pages/question-bank/method/add-question-method-page")));
const CreateQuestionAiPage      = Loadable(lazy(() => import("@/pages/question-bank/ai/create-question-ai-page")));
const CreateQuestionManualPage  = Loadable(lazy(() => import("@/pages/question-bank/manual/create-question-manual-page")));

// ─── Not Found ─────────────────────────────────────────────
const NotFoundPage = Loadable(
  lazy(() => import("@/pages/not-found/not-found-page"))
);

// ─── Role-based classroom list ─────────────────────────────
const ClassroomListOrStudentPage = () => {
  const { user } = useAuth();
  return user?.role === "ROLE_STUDENT"
    ? <StudentClassroomListPage />
    : <ClassroomListPage />;
};

// ─── ROUTES ────────────────────────────────────────────────
const AppRoutes = () =>
  useRoutes([
    // Root
    { path: "/", element: <Navigate to="/home" replace /> },

    // Public
    { path: "home", element: <HomePage /> },

    // Auth
    {
      path: PATH_AUTH.login,
      element: <GuestGuard><LoginPage /></GuestGuard>,
    },
    {
      path: PATH_AUTH.register,
      element: <GuestGuard><RegisterPage /></GuestGuard>,
    },
    { path: PATH_AUTH.verifyOtp, element: <OtpVerificationPage /> },
    { path: PATH_AUTH.forgotPassword, element: <ForgotPasswordPage /> },
    { path: PATH_AUTH.forgotPasswordOtp, element: <ForgotPasswordOtpPage /> },
    { path: PATH_AUTH.resetPassword, element: <ResetPasswordPage /> },
    { path: PATH_AUTH.selectRole, element: <RoleSelectionPage /> },
    { path: PATH_AUTH.oauth2Redirect, element: <OAuth2RedirectPage /> },

    // Profile
    {
      path: "profile",
      element: <AuthGuard><UserProfilePage /></AuthGuard>,
    },
    {
      path: "change-password",
      element: <AuthGuard><ChangePasswordPage /></AuthGuard>,
    },

    // Dashboard layout (main app)
    {
      element: <AuthGuard><DashboardLayout /></AuthGuard>,
      children: [
        { path: "classrooms", element: <ClassroomListOrStudentPage /> },

        // Question Bank
        { path: PATH_TEACHER.questionBank, element: <QuestionBankPage /> },
        { path: PATH_TEACHER.questionBankDetail(":bankId"), element: <ResourceBankDetailPage /> },
        { path: PATH_TEACHER.questionBankEdit(":bankId"), element: <EditResourceBankPage /> },
        { path: PATH_TEACHER.questionBankMethod(":bankId"), element: <AddQuestionMethodPage /> },
        { path: PATH_TEACHER.questionBankImport(":bankId"), element: <ImportQuestionPage /> },
        { path: PATH_TEACHER.questionBankAi(":bankId"), element: <CreateQuestionAiPage /> },
        { path: PATH_TEACHER.questionBankManual(":bankId"), element: <CreateQuestionManualPage /> },
      ],
    },

    // Classroom detail (outside layout)
    {
      path: "classrooms/:id",
      element: <AuthGuard><ClassroomPostPage /></AuthGuard>,
    },
    {
      path: "classrooms/:id/pending-requests",
      element: <AuthGuard><PendingRequestsPage /></AuthGuard>,
    },
    {
      path: "classrooms/:id/schedule",
      element: <AuthGuard><SchedulePage /></AuthGuard>,
    },
    {
      path: "classrooms/:id/attendance",
      element: <AuthGuard><AttendanceListPage /></AuthGuard>,
    },
    {
      path: "classrooms/:id/attendance/:sessionId",
      element: <AuthGuard><AttendancePage /></AuthGuard>,
    },
    {
      path: "classrooms/:id/folders",
      element: <AuthGuard><FoldersPage /></AuthGuard>,
    },

    // 404
    { path: "*", element: <NotFoundPage /> },
  ]);

export default AppRoutes;