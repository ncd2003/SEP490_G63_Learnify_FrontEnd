import { createElement, lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import AuthGuard from "@/guards/auth-guard";
import GuestGuard from "@/guards/guest-guard";
import RoleBasedGuard from "@/guards/role-base-guard";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/lib/auth-role";
import {
  PATH_AUTH,
  PATH_ADMIN,
  PATH_COMMON,
  PATH_PAYMENT,
  PATH_TEACHER,
} from "@/routes/paths";

const Loadable = (component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    {createElement(component, props)}
  </Suspense>
);

// Auth pages
const LoginPage = Loadable(lazy(() => import("@/pages/Login")));
const AdminLoginPage = Loadable(lazy(() => import("@/pages/AdminLogin")));
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
const OAuth2RedirectPage = Loadable(
  lazy(() => import("@/pages/OAuth2Redirect")),
);
const HomePage = Loadable(lazy(() => import("@/pages/Home")));
const TermsOfServicePage = Loadable(
  lazy(() => import("@/pages/TermsOfService")),
);
const PrivacyPolicyPage = Loadable(lazy(() => import("@/pages/PrivacyPolicy")));
const PublicPlanPage = Loadable(
  lazy(() => import("@/pages/plan/public-plan-page")),
);
const PaymentSuccessPage = Loadable(
  lazy(() => import("@/pages/payment/payment-success-page")),
);
const PaymentCancelPage = Loadable(
  lazy(() => import("@/pages/payment/payment-cancel-page")),
);

// User / Profile
const UserProfilePage = Loadable(lazy(() => import("@/pages/UserProfile")));
const ChangePasswordPage = Loadable(
  lazy(() => import("@/pages/ChangePassword")),
);
const NotificationCenterPage = Loadable(
  lazy(() => import("@/pages/NotificationCenter")),
);

// Classroom
const ClassroomListPage = Loadable(
  lazy(() => import("@/pages/classroom/list/classroom-page")),
);
const StudentClassroomListPage = Loadable(
  lazy(() => import("@/pages/classroom/list/student-classroom-page")),
);
const ClassroomPostPage = Loadable(
  lazy(() => import("@/pages/classroom/feed/post-page")),
);
const MemberClassPage = Loadable(
  lazy(() => import("@/pages/classroom/MemberClass")),
);
const AssignmentPage = Loadable(
  lazy(() => import("@/pages/assignment/list/assignment-page")),
);
const AssignmentHubPage = Loadable(
  lazy(() => import("@/pages/assignment/hub/assignment-hub-page")),
);
const AssignmentDetailPage = Loadable(
  lazy(() => import("@/pages/assignment/detail/assignment-detail-page")),
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
const SchedulePage = Loadable(
  lazy(() => import("@/pages/classroom/schedule/schedulePage")),
);
const AttendanceListPage = Loadable(
  lazy(() => import("@/pages/classroom/attendance/attendance-list-page")),
);
const AttendancePage = Loadable(
  lazy(() => import("@/pages/classroom/attendance/attendance-page")),
);
const FoldersPage = Loadable(
  lazy(() => import("@/pages/classroom/folders/foldersPage")),
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

// Report
const SendUserReportPage = Loadable(
  lazy(() => import("@/pages/report/SendUserReportPage")),
);

// Admin pages
const AdminDashboardPage = Loadable(
  lazy(() => import("@/pages/admin/AdminDashboard")),
);
const AdminRevenueDashboardPage = Loadable(
  lazy(() => import("@/pages/admin/AdminRevenueDashboard")),
);
const AdminTransactionHistoryPage = Loadable(
  lazy(() => import("@/pages/admin/AdminTransactionHistory")),
);
const AdminUserListPage = Loadable(
  lazy(() => import("@/pages/admin/AdminUserList")),
);
const AdminUserDetailPage = Loadable(
  lazy(() => import("@/pages/admin/AdminUserDetail")),
);
const AdminSystemNotificationPage = Loadable(
  lazy(() => import("@/pages/admin/AdminSystemNotification")),
);
const AdminManageReportPage = Loadable(
  lazy(() => import("@/pages/admin/AdminManageReport")),
);
const AdminSubscriptionListPage = Loadable(
  lazy(() => import("@/pages/admin/subscription/subscription-list-page")),
);
const AdminPlanManagementPage = Loadable(
  lazy(() => import("@/pages/admin/plan/plan-management-page")),
);

const NotFoundPage = Loadable(
  lazy(() => import("@/pages/not-found/not-found-page")),
);

const ClassroomListOrStudentPage = () => {
  const { user } = useAuth();
  return user?.role === "ROLE_STUDENT" ? (
    <StudentClassroomListPage />
  ) : (
    <ClassroomListPage />
  );
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

const AppRoutes = () =>
  useRoutes([
    { path: "/", element: <RootRedirect /> },

    // Public
    { path: "home", element: <HomePage /> },
    {
      path: PATH_AUTH.plans,
      element: (
        <AuthGuard>
          <RoleBasedGuard role="ROLE_TEACHER">
            <PublicPlanPage />
          </RoleBasedGuard>
        </AuthGuard>
      ),
    },
    { path: PATH_PAYMENT.success, element: <PaymentSuccessPage /> },
    { path: PATH_PAYMENT.cancel, element: <PaymentCancelPage /> },
    { path: PATH_AUTH.terms, element: <TermsOfServicePage /> },
    { path: PATH_AUTH.privacy, element: <PrivacyPolicyPage /> },

    // Auth
    {
      path: PATH_AUTH.login,
      element: (
        <GuestGuard>
          <LoginPage />
        </GuestGuard>
      ),
    },
    {
      path: PATH_AUTH.adminLogin,
      element: (
        <GuestGuard>
          <AdminLoginPage />
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
    { path: PATH_AUTH.verifyOtp, element: <OtpVerificationPage /> },
    { path: PATH_AUTH.forgotPassword, element: <ForgotPasswordPage /> },
    { path: PATH_AUTH.forgotPasswordOtp, element: <ForgotPasswordOtpPage /> },
    { path: PATH_AUTH.resetPassword, element: <ResetPasswordPage /> },
    { path: PATH_AUTH.selectRole, element: <RoleSelectionPage /> },
    { path: PATH_AUTH.oauth2Redirect, element: <OAuth2RedirectPage /> },

    // Profile
    {
      path: PATH_COMMON.profile,
      element: (
        <AuthGuard>
          <UserProfilePage />
        </AuthGuard>
      ),
    },
    {
      path: PATH_COMMON.changePassword,
      element: (
        <AuthGuard>
          <ChangePasswordPage />
        </AuthGuard>
      ),
    },

    // Dashboard layout (main app)
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
        {
          path: PATH_TEACHER.assignments,
          element: <AssignmentHubPage />,
        },
        {
          path: PATH_TEACHER.assignmentDetail(":id"),
          element: <AssignmentDetailPage />,
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

        // Teacher report
        { path: PATH_TEACHER.reports, element: <SendUserReportPage /> },
        {
          path: PATH_COMMON.notifications,
          element: <NotificationCenterPage />,
        },
      ],
    },

    // Admin routes
    {
      element: (
        <AuthGuard>
          <RoleBasedGuard role="ROLE_ADMIN">
            <DashboardLayout />
          </RoleBasedGuard>
        </AuthGuard>
      ),
      children: [
        { path: PATH_ADMIN.dashboard, element: <AdminDashboardPage /> },
        {
          path: PATH_ADMIN.revenueDashboard,
          element: <AdminRevenueDashboardPage />,
        },
        {
          path: PATH_ADMIN.transactionHistory,
          element: <AdminTransactionHistoryPage />,
        },
        { path: PATH_ADMIN.users.root, element: <AdminUserListPage /> },
        {
          path: PATH_ADMIN.users.detail(":id"),
          element: <AdminUserDetailPage />,
        },
        {
          path: PATH_ADMIN.systemNotifications,
          element: <AdminSystemNotificationPage />,
        },
        { path: PATH_ADMIN.reports, element: <AdminManageReportPage /> },
        {
          path: PATH_COMMON.notifications,
          element: <NotificationCenterPage />,
        },
        {
          path: PATH_ADMIN.subscriptions.root,
          element: <AdminSubscriptionListPage />,
        },
        { path: PATH_ADMIN.plans.root, element: <AdminPlanManagementPage /> },
      ],
    },

    // Classroom detail
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
          <MemberClassPage />
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
    {
      path: "classrooms/:id/attendance",
      element: (
        <AuthGuard>
          <AttendanceListPage />
        </AuthGuard>
      ),
    },
    {
      path: "classrooms/:id/attendance/:sessionId",
      element: (
        <AuthGuard>
          <AttendancePage />
        </AuthGuard>
      ),
    },
    {
      path: "classrooms/:id/folders",
      element: (
        <AuthGuard>
          <FoldersPage />
        </AuthGuard>
      ),
    },

    { path: "*", element: <NotFoundPage /> },
  ]);

export default AppRoutes;
