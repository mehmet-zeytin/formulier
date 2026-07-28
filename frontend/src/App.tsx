import { Routes, Route } from 'react-router-dom';
import FormPage from './pages/FormPage';
import LoginPage from './pages/LoginPage';
import WerkordersPage from './pages/WerkordersPage';
import WerkorderDetailPage from './pages/WerkorderDetailPage';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin/werkorders"
        element={
          <PrivateRoute>
            <WerkordersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/werkorders/:id"
        element={
          <PrivateRoute>
            <WerkorderDetailPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;