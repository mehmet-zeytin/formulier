import {
  Navigate,
  Route,
  Routes,
  useParams
} from 'react-router-dom';

import FormPage from './pages/FormPage';
import LoginPage from './pages/LoginPage';
import WerkordersPage from './pages/WerkordersPage';
import WerkorderDetailPage from './pages/WerkorderDetailPage';
import EditWerkorderPage from './pages/EditWerkorderPage';
import UsersPage from './pages/UsersPage';
import PrivateRoute from './components/PrivateRoute';
import TrashPage from './pages/TrashPage';

function LegacyWerkorderDetailRedirect() {
  const { id } =
    useParams<{ id: string }>();

  return (
    <Navigate
      to={`/werkorders/${id}`}
      replace
    />
  );
}

function LegacyWerkorderEditRedirect() {
  const { id } =
    useParams<{ id: string }>();

  return (
    <Navigate
      to={`/werkorders/${id}/edit`}
      replace
    />
  );
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to="/werkorders"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      <Route
        path="/werkorders"
        element={
          <PrivateRoute>
            <WerkordersPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/werkorders/new"
        element={
          <PrivateRoute>
            <FormPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/werkorders/trash"
        element={
          <TrashPage />
        }
      />

      <Route
        path="/werkorders/:id/edit"
        element={
          <PrivateRoute>
            <EditWerkorderPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/werkorders/:id"
        element={
          <PrivateRoute>
            <WerkorderDetailPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/users"
        element={
          <PrivateRoute
            allowedRoles={['owner', 'admin']}
          >
            <UsersPage />
          </PrivateRoute>
        }
      />

      {/* Oude URL's */}
      <Route
        path="/admin/login"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="/admin/users"
        element={
          <Navigate
            to="/users"
            replace
          />
        }
      />

      <Route
        path="/admin/werkorders"
        element={
          <Navigate
            to="/werkorders"
            replace
          />
        }
      />

      <Route
        path="/admin/werkorders/:id/edit"
        element={
          <LegacyWerkorderEditRedirect />
        }
      />

      <Route
        path="/admin/werkorders/:id"
        element={
          <LegacyWerkorderDetailRedirect />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/werkorders"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;