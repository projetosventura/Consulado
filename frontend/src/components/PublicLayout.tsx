import { Link, Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <>
      <header className="public-header">
        <div className="shell">
          <Link to="/" className="brand">
            <img src="/logo.png" alt="Consulado do Grêmio de Francisco Beltrão" />
            <div>
              <strong>Consulado do Grêmio FB</strong>
            </div>
          </Link>
          <nav className="nav">
            <Link to="/">Sorteios</Link>
            <Link to="/ganhadores">Ganhadores</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        </div>
      </header>
      <main className="shell">
        <Outlet />
      </main>
    </>
  );
}
