import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewPrediction from './pages/NewPrediction.jsx';
import PredictionDetail from './pages/PredictionDetail.jsx';
import History from './pages/History.jsx';
import ModelInfo from './pages/ModelInfo.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}
function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Public><Login /></Public>} />
      <Route path="/signup" element={<Public><Signup /></Public>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/predict" element={<NewPrediction />} />
        <Route path="/history" element={<History />} />
        <Route path="/prediction/:id" element={<PredictionDetail />} />
        <Route path="/model" element={<ModelInfo />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
