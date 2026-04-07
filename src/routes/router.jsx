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

// Auth pages
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

// User/Teacher pages
const UserProfilePage = Loadable(lazy(() => import("@/pages/UserProfile")));
const ChangePasswordPage = Loadable(
  lazy(() => import("@/pages/ChangePassword")),
);
const ClassroomListPage = Loadable(
  lazy(() => import("@/pages/classroom/list/classroom-page")),
);
const StudentClassroomListPage = Loadable(
  lazy(() => import("@/pages/classroom/list/student-classroom-page")),
);
const ClassroomPostPage = Loadable(
  lazy(() => import("@/pages/classroom/feed/post-page")),
);
const PendingRequestsPage = Loadable(
  lazy(() => import("@/pages/classroom/PendingRequests")),
);
const SchedulePage = Loadable(
  lazy(() => import("@/pages/classroom/schedule/schedulePage")),
);
const TeacherSchedulePage = Loadable(
  lazy(() => import("@/pages/classroom/schedule/teacher-schedule-page")),
);
const ClassroomLecturePage = Loadable(
  lazy(() => import("@/pages/classroom/lecture/lecture-page")),
);
const ClassroomRecordingPage = Loadable(
  lazy(() => import("@/pages/classroom/recording/recording-page")),
);
const AttendanceListPage = Loadable(
  lazy(() => import("@/pages/classroom/attendance/attendance-list-page")),
);
const AttendancePage = Loadable(
  lazy(() => import("@/pages/classroom/attendance/attendance-page")),
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

const NotFoundPage = Loadable(
  lazy(() => import("@/pages/not-found/not-found-page")),
);

const ClassroomListOrStudentPage = () => {
  const { user } = useAuth();
  if (user?.role === "ROLE_STUDENT") return <StudentClassroomListPage />;
  return <ClassroomListPage />;
};

const AppRoutes = () =>
  useRoutes([
    {
      path: "/",
      element: <Navigate to="/home" replace />,
    },
    {
      path: "home",
      element: <HomePage />,
    },
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
          path: PATH_TEACHER.schedule,
          element: <TeacherSchedulePage />,
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
    {
      path: PATH_TEACHER.classroom.detail(":id"),
      element: (
        <AuthGuard>
          <ClassroomPostPage />
        </AuthGuard>
      ),
    },
    {
      path: PATH_TEACHER.classroom.pendingRequests(":id"),
      element: (
        <AuthGuard>
          <PendingRequestsPage />
        </AuthGuard>
      ),
    },
    {
      path: PATH_TEACHER.classroom.schedule(":id"),
      element: (
        <AuthGuard>
          <SchedulePage />
        </AuthGuard>
      ),
    },
    {
      path: PATH_TEACHER.classroom.lecture(":id"),
      element: (
        <AuthGuard>
          <ClassroomLecturePage />
        </AuthGuard>
      ),
    },
    {
      path: PATH_TEACHER.classroom.recordings(":id"),
      element: (
        <AuthGuard>
          <ClassroomRecordingPage />
        </AuthGuard>
      ),
    },
    {
      path: PATH_TEACHER.classroom.attendance(":id"),
      element: (
        <AuthGuard>
          <AttendanceListPage />
        </AuthGuard>
      ),
    },
    {
      path: PATH_TEACHER.classroom.attendanceSession(":id", ":sessionId"),
      element: (
        <AuthGuard>
          <AttendancePage />
        </AuthGuard>
      ),
    },
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ]);

export default AppRoutes;
