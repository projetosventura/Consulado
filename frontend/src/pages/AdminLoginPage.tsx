import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { saveSession } from '../auth';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@consulado.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const session = await api.login(email, password);
      saveSession(session);
      navigate('/admin');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="shell" style={{ paddingTop: 48 }}>
      <form className="card form" onSubmit={(event) => void onSubmit(event)}>
        <Link to="/" className="brand">
          <img src="/logo.png" alt="Consulado" width={48} height={48} />
          <strong>Entrar no painel</strong>
        </Link>
        <label>
          E-mail
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <label>
          Senha
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="button">Entrar</button>
      </form>
    </main>
  );
}
