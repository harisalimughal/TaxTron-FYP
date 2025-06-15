import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  
  return isLoggedIn ? children : <Navigate to="/admin/login" />;
};

export default ProtectedRoute;