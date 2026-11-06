import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { PrizePhoto } from '../components/PrizePhoto';
import { formatDate, formatMoney, statusLabel } from '../lib/format';
import type { Raffle } from '../types';

export function RafflePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    api
      .getRaffle(id)
      .then(setRaffle)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  const tickets = useMemo(() => {
    const list = raffle?.tickets ?? [];
    if (!query) {
      return list;
    }
    return list.filter((ticket) => String(ticket.number).includes(query));
  }, [query, raffle]);

  function toggle(number: number, status: string) {
    if (status !== 'AVAILABLE' || raffle?.status !== 'OPEN') {
      return;
    }
    setSelected((current) =>
      current.includes(number) ? current.filter((item) => item !== number) : [...current, number],
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!raffle) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payment = await api.checkout({
        raffleId: raffle.id,
        numbers: selected,
        buyerName,
        buyerEmail,
        buyerPhone: buyerPhone.replace(/\D/g, ''),
      });
      navigate(`/pagamento/${payment.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!raffle) {
    return <p>{error || 'Carregando sorteio...'}</p>;
  }

  const total = selected.length * Number(raffle.ticketPrice);

  return (
    <>
      <section className="hero product-layout">
        <PrizePhoto variant="hero" imageUrl={raffle.imageUrl} alt={raffle.prize} />
        <div className="product-copy">
        <span className={`badge ${raffle.status.toLowerCase()}`}>{statusLabel(raffle.status)}</span>
        <h1>{raffle.title}</h1>
        <p className="lede">{raffle.prize}</p>
        <p>{raffle.description}</p>
        <div className="stats">
          <div className="stat">
            <strong>{formatMoney(raffle.ticketPrice)}</strong>
            por número
          </div>
          <div className="stat">
            <strong>{raffle.counters.available}</strong>
            livres
          </div>
          <div className="stat">
            <strong>{formatDate(raffle.endsAt)}</strong>
            encerra
          </div>
        </div>
        </div>
      </section>

      {raffle.winners && raffle.winners.length > 0 && (
        <section className="card">
          <h2>Ganhadores</h2>
          {raffle.winners.map((winner) => (
            <p key={winner.id}>
              Número {winner.ticket.number} — {winner.ticket.buyerName}
            </p>
          ))}
        </section>
      )}

      <section className="card">
        <div className="toolbar">
          <input
            placeholder="Buscar número"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="numbers">
          {tickets.map((ticket) => (
            <button
              key={ticket.number}
              type="button"
              className={`number ${ticket.status.toLowerCase()} ${selected.includes(ticket.number) ? 'selected' : ''}`}
              onClick={() => toggle(ticket.number, ticket.status)}
            >
              {String(ticket.number).padStart(2, '0')}
            </button>
          ))}
        </div>
      </section>

      {raffle.status === 'OPEN' && (
        <form className="card form" onSubmit={onSubmit}>
          <h2>Seus dados</h2>
          <label>
            Nome
            <input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} required />
          </label>
          <label>
            E-mail
            <input type="email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} required />
          </label>
          <label>
            WhatsApp com DDD
            <input
              value={buyerPhone}
              onChange={(event) => setBuyerPhone(event.target.value)}
              placeholder="46999990000"
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="button" disabled={selected.length === 0 || loading}>
            Reservar {selected.length || ''} {selected.length === 1 ? 'número' : 'números'} e pagar
          </button>
        </form>
      )}

      {selected.length > 0 && (
        <div className="footer-bar">
          <div className="shell">
            <div>
              {selected.length} número(s): {selected.sort((a, b) => a - b).join(', ')}
            </div>
            <strong>{formatMoney(total)}</strong>
          </div>
        </div>
      )}
    </>
  );
}
