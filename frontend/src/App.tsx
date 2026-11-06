import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { PublicLayout } from './components/PublicLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminNewRafflePage } from './pages/AdminNewRafflePage';
import { AdminRafflePage } from './pages/AdminRafflePage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { RafflePage } from './pages/RafflePage';
import { WinnersPage } from './pages/WinnersPage';

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/sorteios/:id" element={<RafflePage />} />
        <Route path="/pagamento/:id" element={<CheckoutPage />} />
        <Route path="/ganhadores" element={<WinnersPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="sorteios/novo" element={<AdminNewRafflePage />} />
        <Route path="sorteios/:id" element={<AdminRafflePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
