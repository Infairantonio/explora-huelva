// src/componentes/RutaProtegida.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { isAuth } from '../utils/auth';

/**
 * Protege una ruta: si no hay sesión válida, redirige a /login
 * y guarda la ubicación actual en state.from para volver después del login.
 *
 * Uso:
 * <RutaProtegida>
 *   <Panel />
 * </RutaProtegida>
 */
export default function RutaProtegida({ children, redirectTo = "/login" }) {
  const location = useLocation();

  if (!isAuth()) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }
  return children;
}
