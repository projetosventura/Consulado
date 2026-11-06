import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PrizePhoto } from '../components/PrizePhoto';
import { getToken } from '../auth';
import { formatDate, formatMoney, statusLabel } from '../lib/format';
import type { Raffle } from '../types';

export function AdminDashboardPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const token = getToken();
    if (!token) {
      return;
    }
    setRaffles(await api.adminRaffles(token));
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function removeRaffle(raffle: Raffle) {
    const token = getToken();
    if (!token) {
      return;
    }
    const confirmed = window.confirm(
      `Remover o sorteio "${raffle.title}"? Números, pagamentos e a foto serão apagados.`,
    );
    if (!confirmed) {
      return;
    }
    setError('');
    try {
      await api.deleteRaffle(raffle.id, token);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="hero">
      <h1>Sorteios</h1>
      <p>Cadastre rifas, acompanhe reservas e registre os ganhadores.</p>
      <Link className="button" to="/admin/sorteios/novo">
        Cadastrar sorteio
      </Link>
      {error && <p className="error">{error}</p>}
      <div className="grid raffle-grid">
        {raffles.map((raffle) => (
          <article className="card" key={raffle.id}>
            <PrizePhoto imageUrl={raffle.imageUrl} alt={raffle.prize} />
            <span className={`badge ${raffle.status.toLowerCase()}`}>{statusLabel(raffle.status)}</span>
            <h2>{raffle.title}</h2>
            <p>{raffle.prize}</p>
            <p>
              {formatMoney(raffle.ticketPrice)} · {raffle.counters.paid}/{raffle.totalNumbers} pagos
            </p>
            <p>Encerra em {formatDate(raffle.endsAt)}</p>
            <div className="toolbar">
              <Link className="button" to={`/admin/sorteios/${raffle.id}`}>
                Abrir sorteio
              </Link>
              <button className="button danger" type="button" onClick={() => void removeRaffle(raffle)}>
                Remover
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
