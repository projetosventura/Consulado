import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { PrizePhoto } from '../components/PrizePhoto';
import { getToken } from '../auth';
import { formatMoney, statusLabel } from '../lib/format';
import type { Raffle } from '../types';

export function AdminRafflePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [error, setError] = useState('');
  const [imageMessage, setImageMessage] = useState('');

  async function load() {
    const token = getToken();
    if (!token || !id) {
      return;
    }
    setRaffle(await api.adminRaffle(id, token));
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [id]);

  async function updateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();
    const form = event.currentTarget;
    const input = form.elements.namedItem('image');
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!token || !id || !file) {
      setError('Escolha a foto do produto.');
      return;
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Envie uma foto JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A foto pode ter no máximo 5 MB.');
      return;
    }
    setError('');
    try {
      await api.updateRaffleImage(id, token, file);
      setImageMessage('Foto publicada.');
      form.reset();
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function closeRaffle() {
    const token = getToken();
    if (!token || !id) {
      return;
    }
    await api.closeRaffle(id, token);
    await load();
  }

  async function draw() {
    const token = getToken();
    if (!token || !id) {
      return;
    }
    await api.drawRaffle(id, token);
    await load();
  }

  async function removeRaffle() {
    const token = getToken();
    if (!token || !id || !raffle) {
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
      await api.deleteRaffle(id, token);
      navigate('/admin');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function confirmPayment(paymentId: string) {
    const token = getToken();
    if (!token) {
      return;
    }
    await api.simulateApprove(paymentId, token);
    await load();
  }

  if (!raffle) {
    return <p>{error || 'Carregando...'}</p>;
  }

  return (
    <>
    <section className="hero product-layout">
      <PrizePhoto variant="hero" imageUrl={raffle.imageUrl} alt={raffle.prize} />
      <div className="product-copy">
      <span className={`badge ${raffle.status.toLowerCase()}`}>{statusLabel(raffle.status)}</span>
      <h1>{raffle.title}</h1>
      <p>{raffle.prize}</p>
      <div className="stats">
        <div className="stat">
          <strong>{raffle.counters.available}</strong>
          livres
        </div>
        <div className="stat">
          <strong>{raffle.counters.reserved}</strong>
          reservados
        </div>
        <div className="stat">
          <strong>{raffle.counters.paid}</strong>
          pagos
        </div>
      </div>
      <div className="toolbar">
        {raffle.status === 'OPEN' && (
          <button className="ghost" onClick={() => void closeRaffle()}>
            Encerrar vendas
          </button>
        )}
        {raffle.status !== 'DRAWN' && (
          <button className="button" onClick={() => void draw()}>
            Sortear ganhador
          </button>
        )}
        <button className="button danger" type="button" onClick={() => void removeRaffle()}>
          Remover sorteio
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {imageMessage && <p className="success">{imageMessage}</p>}
      <form className="form" onSubmit={(event) => void updateImage(event)}>
        <label>
          {raffle.imageUrl ? 'Trocar foto do produto' : 'Foto do produto'}
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
          <small className="hint">JPG, PNG ou WebP, até 5 MB. A foto entra na vitrine e na página de compra.</small>
        </label>
        <button className="button">Salvar foto</button>
      </form>
      </div>
    </section>

    <div className="stack">
    {raffle.winners && raffle.winners.length > 0 && (
        <article className="card">
          <h2>Ganhadores</h2>
          {raffle.winners.map((winner) => (
            <p key={winner.id}>
              Número {winner.ticket.number} — {winner.ticket.buyerName} ({winner.ticket.buyerEmail})
            </p>
          ))}
        </article>
      )}

      <article className="card">
        <h2>Pagamentos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Comprador</th>
                <th>Valor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(raffle.payments ?? []).map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.payerName}</td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>{statusLabel(payment.status)}</td>
                  <td>
                    {payment.status === 'PENDING' && (
                      <button className="ghost" onClick={() => void confirmPayment(payment.id)}>
                        Confirmar teste
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
    </>
  );
}
