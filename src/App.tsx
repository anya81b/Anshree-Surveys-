import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Surveys } from './pages/Surveys';
import { SurveyTake } from './pages/SurveyTake';
import { Wallet } from './pages/Wallet';
import { Admin } from './pages/Admin';
import { BrandDashboard } from './pages/BrandDashboard';
import { AuthProvider } from './components/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="surveys" element={<Surveys />} />
            <Route path="surveys/:id" element={<SurveyTake />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="admin" element={<Admin />} />
            <Route path="brand" element={<BrandDashboard />} />
            <Route path="*" element={<div className="p-8 text-center text-slate-500">Coming soon...</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
