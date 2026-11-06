import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../auth';

export function AdminLayout() {
  const session = getSession();
  const navigate = useNavigate();

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <>
      <header className="admin-header">
        <div className="shell">
          <Link to="/admin" className="brand">
            <img src="/logo.png" alt="Consulado do Grêmio" />
            <div>
              <strong>Painel do Consulado</strong>
              <small>{session.user.name}</small>
            </div>
          </Link>
          <nav className="nav">
            <Link to="/">Ver site</Link>
            <Link to="/admin/sorteios/novo">Novo sorteio</Link>
            <button
              className="ghost"
              onClick={() => {
                clearSession();
                navigate('/admin/login');
              }}
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="shell">
        <Outlet />
      </main>
    </>
  );
}
