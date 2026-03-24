import { createBrowserRouter, Navigate } from 'react-router';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardShell } from './DashboardShell';
import { UploadPage } from '../pages/dashboard/UploadPage';
import { OverviewPage } from '../pages/dashboard/OverviewPage';
import { HistoryPage } from '../pages/dashboard/HistoryPage';
import { ReportsPage } from '../pages/dashboard/ReportsPage';
import { ScanResultPage } from '../pages/dashboard/ScanResultPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/dashboard',
    element: <ProtectedRoute><DashboardShell /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="upload" replace /> },
      { path: 'upload', element: <UploadPage /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'scan/:scanId', element: <ScanResultPage /> },
    ]
  }
]);
