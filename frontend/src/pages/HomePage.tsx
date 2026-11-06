import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PrizePhoto } from '../components/PrizePhoto';
import { formatDate, formatMoney, statusLabel } from '../lib/format';
import type { Raffle } from '../types';

export function HomePage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listRaffles()
      .then(setRaffles)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <>
      <section className="hero">
        <span className="badge open">Organização sem fins lucrativos</span>
        <h1>Central de rifas do Consulado</h1>
        <p>
          Escolha seu número, pague no PIX e acompanhe os ganhadores. Toda a arrecadação apoia as
          ações do Consulado do Grêmio em Francisco Beltrão.
        </p>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="grid raffle-grid">
        {raffles.map((raffle) => (
          <article className="card" key={raffle.id}>
            <PrizePhoto imageUrl={raffle.imageUrl} alt={raffle.prize} />
            <span className={`badge ${raffle.status.toLowerCase()}`}>{statusLabel(raffle.status)}</span>
            <h2>{raffle.title}</h2>
            <p className="lede">{raffle.prize}</p>
            <strong className="price">{formatMoney(raffle.ticketPrice)}</strong>
            <p>
              {raffle.counters.available} livres · {raffle.counters.paid} pagos · até {formatDate(raffle.endsAt)}
            </p>
            <Link className="button" to={`/sorteios/${raffle.id}`}>
              {raffle.status === 'OPEN' ? 'Escolher número' : 'Ver sorteio'}
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
