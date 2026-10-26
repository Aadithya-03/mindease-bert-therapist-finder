import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Chatbot from './pages/Chatbot';
import Therapist from './pages/Therapist';
import Voice from './pages/Voice';
import MindCheck from './pages/MindCheck';
import Nearby from './pages/Nearby';
import Emergency from './pages/Emergency';
import HistoryPage from './pages/History';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash" role="status">Loading MindEase…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Home />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="therapist" element={<Therapist />} />
        <Route path="voice" element={<Voice />} />
        <Route path="mind-check" element={<MindCheck />} />
        <Route path="nearby" element={<Nearby />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
