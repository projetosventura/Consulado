import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatDate } from '../lib/format';
import type { Winner } from '../types';

export function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listWinners()
      .then(setWinners)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section className="hero">
      <h1>Ganhadores</h1>
      <p>Transparência dos sorteios realizados pelo Consulado do Grêmio FB.</p>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {winners.length === 0 && <article className="card">Nenhum sorteio realizado ainda.</article>}
        {winners.map((winner) => (
          <article className="card" key={winner.id}>
            <strong>{winner.raffle?.title}</strong>
            <p>Número {winner.ticket.number} — {winner.ticket.buyerName}</p>
            <small>{winner.raffle?.prize} · {formatDate(winner.drawnAt)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
