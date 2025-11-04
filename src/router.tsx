import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/shared/layouts/AppLayout';
import { ProtectedRoute } from '@/shared/layouts/ProtectedRoute';

// Pages
import Dashboard from '@/features/market/pages/Dashboard';
import CoinsList from '@/features/coins/pages/CoinsList';
import CoinDetail from '@/features/coins/pages/CoinDetail';
import Portfolio from '@/features/portfolio/pages/Portfolio';
import Transactions from '@/features/transactions/pages/Transactions';
import Profile from '@/features/auth/pages/Profile';
import Login from '@/features/auth/pages/Login';
import Register from '@/features/auth/pages/Register';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'coins', element: <CoinsList /> },
      { path: 'coins/:id', element: <CoinDetail /> },
      { path: 'portfolio', element: <Portfolio /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
]);

