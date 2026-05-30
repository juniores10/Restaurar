import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { BranchSelection } from './components/BranchSelection';
import { MainApp } from './components/MainApp';

function AppContent() {
  const { user, loading, selectedBranch } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
          <p className="text-white mt-4 font-medium text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!selectedBranch) {
    return <BranchSelection />;
  }

  return <MainApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
