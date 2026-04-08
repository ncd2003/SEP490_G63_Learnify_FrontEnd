import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import AuthGuard from "@/guards/auth-guard";
import GuestGuard from "@/guards/guest-guard";
import RoleBasedGuard from "@/guards/role-base-guard";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/lib/auth-role";
import { PATH_AUTH, PATH_ADMIN, PATH_COMMON, PATH_TEACHER } from "@/routes/paths";

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

// ─── Auth pages ─────────────────────────────────────────────
const LoginPage             = Loadable(lazy(() => import("@/pages/Login")));
const AdminLoginPage        = Loadable(lazy(() => import("@/pages/AdminLogin")));
const RegisterPage          = Loadable(lazy(() => import("@/pages/Register")));
const OtpVerificationPage   = Loadable(lazy(() => import("@/pages/OtpVerification")));
const ForgotPasswordPage    = Loadable(lazy(() => import("@/pages/ForgotPassword")));
const ForgotPasswordOtpPage = Loadable(lazy(() => import("@/pages/ForgotPasswordOtp")));
const ResetPasswordPage     = Loadable(lazy(() => import("@/pages/ResetPassword")));
const RoleSelectionPage     = Loadable(lazy(() => import("@/pages/RoleSelection")));
const OAuth2RedirectPage    = Loadable(lazy(() => import("@/pages/OAuth2Redirect")));
const HomePage              = Loadable(lazy(() => import("@/pages/Home")));
const PublicPlanPage        = Loadable(lazy(() => import("@/pages/plan/public-plan-page")));
// ─── User / Profile ─────────────────────────────────────────
const UserProfilePage       = Loadable(lazy(() => import("@/pages/UserProfile")));
const ChangePasswordPage    = Loadable(lazy(() => import("@/pages/ChangePassword")));

// ─── Classroom ─────────────────────────────────────────────
const ClassroomListPage         = Loadable(lazy(() => import("@/pages/classroom/list/classroom-page")));
const StudentClassroomListPage  = Loadable(lazy(() => import("@/pages/classroom/list/student-classroom-page")));
const ClassroomPostPage         = Loadable(lazy(() => import("@/pages/classroom/feed/post-page")));
const PendingRequestsPage       = Loadable(lazy(() => import("@/pages/classroom/PendingRequests")));
const SchedulePage              = Loadable(lazy(() => import("@/pages/classroom/schedule/schedulePage")));
const TeacherSchedulePage       = Loadable(lazy(() => import("@/pages/classroom/schedule/teacher-schedule-page")));
const ClassroomLecturePage      = Loadable(lazy(() => import("@/pages/classroom/lecture/lecture-page")));
const ClassroomRecordingPage    = Loadable(lazy(() => import("@/pages/classroom/recording/recording-page")));
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

// ─── Admin pages ───────────────────────────────────────────
const AdminDashboardPage       = Loadable(lazy(() => import("@/pages/admin/AdminDashboard")));
const AdminUserListPage        = Loadable(lazy(() => import("@/pages/admin/AdminUserList")));
const AdminUserDetailPage      = Loadable(lazy(() => import("@/pages/admin/AdminUserDetail")));
const AdminSubscriptionListPage = Loadable(lazy(() => import("@/pages/admin/subscription/subscription-list-page")));
const AdminPlanManagementPage  = Loadable(lazy(() => import("@/pages/admin/plan/plan-management-page")));

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

const RootRedirect = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATH_AUTH.home} replace />;
  }

  if (isAdminRole(user?.role)) {
    return <Navigate to={PATH_ADMIN.dashboard} replace />;
  }

  return <Navigate to={PATH_TEACHER.classroom.root} replace />;
};

// ─── ROUTES ────────────────────────────────────────────────
const AppRoutes = () =>
  useRoutes([
    // Root
    { path: "/", element: <RootRedirect /> },

    // Public
    { path: "home", element: <HomePage /> },
    { path: PATH_AUTH.plans, element: <PublicPlanPage /> },

    // Auth
    {
      path: PATH_AUTH.login,
      element: <GuestGuard><LoginPage /></GuestGuard>,
    },
    {
      path: PATH_AUTH.adminLogin,
      element: <GuestGuard><AdminLoginPage /></GuestGuard>,
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
      path: PATH_COMMON.profile,
      element: <AuthGuard><UserProfilePage /></AuthGuard>,
    },
    {
      path: PATH_COMMON.changePassword,
      element: <AuthGuard><ChangePasswordPage /></AuthGuard>,
    },

    // Dashboard layout (main app)
    {
      element: <AuthGuard><DashboardLayout /></AuthGuard>,
      children: [
        { path: "classrooms", element: <ClassroomListOrStudentPage /> },
        { path: PATH_TEACHER.schedule, element: <TeacherSchedulePage /> },

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

    // ── Admin routes (with DashboardLayout) ───────────────────────────────────
    {
      element: (
        <AuthGuard>
          <RoleBasedGuard role="ROLE_ADMIN">
            <DashboardLayout />
          </RoleBasedGuard>
        </AuthGuard>
      ),
      children: [
        {
          path: PATH_ADMIN.dashboard,
          element: <AdminDashboardPage />,
        },
        {
          path: PATH_ADMIN.users.root,
          element: <AdminUserListPage />,
        },
        {
          path: PATH_ADMIN.users.detail(":id"),
          element: <AdminUserDetailPage />,
        },
        {
          path: PATH_ADMIN.subscriptions.root,
          element: <AdminSubscriptionListPage />,
        },
        {
          path: PATH_ADMIN.plans.root,
          element: <AdminPlanManagementPage />,
        },
      ],
    },

    // ── Classroom detail routes (outside DashboardLayout, uses ClassroomDetailLayout inside) ───
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
      path: "classrooms/:id/lecture",
      element: <AuthGuard><ClassroomLecturePage /></AuthGuard>,
    },
    {
      path: "classrooms/:id/recordings",
      element: <AuthGuard><ClassroomRecordingPage /></AuthGuard>,
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