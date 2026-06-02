import { Navigate, useParams } from 'react-router-dom';

export const ExperienciaRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/experiencias/${slug}`} replace />;
};

export const LibreriaRedirect = () => {
  const { slug } = useParams();
  if (slug) return <Navigate to={`/biblioteca/${slug}`} replace />;
  return <Navigate to="/biblioteca" replace />;
};

export const AuthRedirect = () => {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  const mode = params.get('mode');
  const target = mode === 'register' ? '/registro' : '/login';
  const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
  return <Navigate to={`${target}${query}`} replace />;
};
