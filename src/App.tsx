import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { ActivityList } from './components/ActivityList';
import { CreateActivity } from './components/CreateActivity';
import { EditActivity } from './components/EditActivity';
import { ActivityDetail } from './components/ActivityDetail';
import { Layout } from './components/Layout';

function App() {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        padding: '4rem 2rem', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner" style={{ 
          width: '2rem', 
          height: '2rem',
          borderWidth: '3px',
          color: 'var(--albion-gold)'
        }}></div>
        <p className="text-dim" style={{ fontSize: '1.125rem' }}>{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ActivityList />} />
          <Route path="/create" element={<CreateActivity />} />
          <Route path="/activity/:id" element={<ActivityDetail />} />
          <Route path="/activity/:id/edit" element={<EditActivity />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
