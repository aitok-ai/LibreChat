import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import {
  Login,
  Registration,
  RequestPasswordReset,
  ResetPassword,
  VerifyEmail,
  ApiErrorWatcher,
  TwoFactorScreen,
} from '~/components/Auth';
import { AuthContextProvider } from '~/hooks/AuthContext';
import Profile from '../components/Profile';
import Leaderboard from '~/components/ui/Leaderboard';
import SharedConvo from '~/components/ui/SharedConvo';
import Recommendations from '~/components/ui/Recommendations';
import { useEffect } from 'react';
import RouteErrorBoundary from './RouteErrorBoundary';
import StartupLayout from './Layouts/Startup';
import LoginLayout from './Layouts/Login';
import dashboardRoutes from './Dashboard';
import ShareRoute from './ShareRoute';
import ChatRoute from './ChatRoute';
import Search from './Search';
import Root from './Root';

const AuthLayout = () => {
  useEffect(() => {
    localStorage.setItem('isSharedPage', 'false');
  }, []);

  return (
    <AuthContextProvider>
      <Outlet />
      <ApiErrorWatcher />
    </AuthContextProvider>
  );
};

export const router = createBrowserRouter([
  {
    path: 'share/:shareId',
    element: <ShareRoute />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <StartupLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'register/:userId?',
        element: <Registration />,
      },
      {
        path: 'forgot-password',
        element: <RequestPasswordReset />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
    ],
  },
  {
    path: 'verify',
    element: <VerifyEmail />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: <LoginLayout />,
        children: [
          {
            path: 'login',
            element: <Login />,
          },
          {
            path: 'login/2fa',
            element: <TwoFactorScreen />,
          },
        ],
      },
      dashboardRoutes,
      {
        path: 'chat/share/:conversationId?',
        element: <SharedConvo />,
      },
      {
        path: '/',
        element: <Root />,
        children: [
          {
            index: true,
            element: <Navigate to="/c/new" replace={true} />,
          },
          {
            path: 'c/:conversationId?',
            element: <ChatRoute />,
          },
          // {
          //   path: 'chat/:conversationId?',
          //   element: <Chat />,
          // },
          // {
          //   path: 'search/:query?',
          //   element: <Search />,
          // },
          {
            path: 'leaderboard',
            element: <Leaderboard />,
          },
          {
            path: 'home',
            element: <Recommendations />,
          },
          {
            path: 'profile/:userId?',
            element: <Profile />,
          },
          // {
          //   path: 'search/:query?',
          //   element: <Search />,
          // },
          {
            path: 'search',
            element: <Search />,
          },
        ],
      },
    ],
  },
]);
