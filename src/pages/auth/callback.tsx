import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    // Wait for auth state to be initialized
    if (!isLoading) {
      if (user) {
        // User successfully authenticated via OAuth
        navigate('/', { replace: true });
      } else {
        // Authentication failed or was cancelled
        navigate('/auth', { replace: true });
      }
    }
  }, [isLoading, user, navigate]);

  return (
    <>
    <SEO
      title="Autentifikatsiya"
      description="Avtotestu.uz autentifikatsiya jarayoni."
      path="/auth/callback"
      noIndex={true}
    />
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e5e7eb',
        borderTopColor: '#1e3a8a',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </>
  );
};

export default AuthCallback;
