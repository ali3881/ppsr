import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/Home';
import ChangePasswordPage from './pages/ChangePassword';
import StatusPage from './pages/Status';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="status" element={<StatusPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
