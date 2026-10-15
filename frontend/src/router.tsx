import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PageShell } from './components/layout/PageShell';
import { AuthGuard } from './components/layout/AuthGuard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Overview } from './pages/Overview';
import { EquipmentMonitoring } from './pages/EquipmentMonitoring';
import { YieldAnalytics } from './pages/YieldAnalytics';
import { PredictiveMaintenance } from './pages/PredictiveMaintenance';
import { InvestigationView } from './pages/InvestigationView';
import { Datasets } from './pages/Datasets';
import { AlertsCenter } from './pages/AlertsCenter';
import { Reports } from './pages/Reports';
import { ModelCardView } from './pages/ModelCardView';
import { AccountSettings } from './pages/AccountSettings';
import { Onboarding } from './pages/Onboarding';
import { Glossary } from './pages/Glossary';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <PageShell />
      </AuthGuard>
    ),
    children: [
      {
        path: '/',
        element: (() => {
          const dismissed = localStorage.getItem('semimatrix_onboarding_dismissed');
          return dismissed ? <Navigate to="/overview" replace /> : <Navigate to="/onboarding" replace />;
        })()
      },
      {
        path: '/onboarding',
        element: <Onboarding />
      },
      {
        path: '/getting-started',
        element: <Navigate to="/onboarding" replace />
      },
      {
        path: '/overview',
        element: <Overview />
      },
      {
        path: '/dashboard',
        element: <Navigate to="/overview" replace />
      },
      {
        path: '/equipment',
        element: <EquipmentMonitoring />
      },
      {
        path: '/floor',
        element: <Navigate to="/equipment" replace />
      },
      {
        path: '/yield',
        element: <YieldAnalytics />
      },
      {
        path: '/analytics',
        element: <Navigate to="/yield" replace />
      },
      {
        path: '/predictive-maintenance',
        element: <PredictiveMaintenance />
      },
      {
        path: '/maintenance',
        element: <Navigate to="/predictive-maintenance" replace />
      },
      {
        path: '/investigations',
        element: <InvestigationView />
      },
      {
        path: '/investigation',
        element: <Navigate to="/investigations" replace />
      },
      {
        path: '/datasets',
        element: <Datasets />
      },
      {
        path: '/settings',
        element: <Navigate to="/datasets" replace />
      },
      {
        path: '/history',
        element: <Navigate to="/datasets" replace />
      },
      {
        path: '/alerts',
        element: <AlertsCenter />
      },
      {
        path: '/reports',
        element: <Reports />
      },
      {
        path: '/model-card',
        element: <ModelCardView />
      },
      {
        path: '/models',
        element: <Navigate to="/model-card" replace />
      },
      {
        path: '/glossary',
        element: <Glossary />
      },
      {
        path: '/account',
        element: <AccountSettings />
      }
    ]
  }
]);
