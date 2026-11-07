import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';
import { getToken } from '../auth';
import { formatMoney, statusLabel } from '../lib/format';
import type { Payment } from '../types';

export function CheckoutPage() {
  const { id } = useParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const data = await api.getPayment(id);
        if (active) {
          setPayment(data);
        }
      } catch (err) {
        if (active) {
          setError((err as Error).message);
        }
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [id]);

  async function copyPix() {
    if (!payment?.pixCopyPaste) {
      return;
    }
    await navigator.clipboard.writeText(payment.pixCopyPaste);
    setCopied(true);
  }

  async function confirmSandbox() {
    const token = getToken();
    if (!payment || !token) {
      return;
    }
    try {
      setPayment(await api.sandboxConfirm(payment.id, token));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!payment) {
    return <p>{error || 'Gerando PIX...'}</p>;
  }

  const paid = payment.status === 'APPROVED';

  return (
    <section className="checkout">
      <article className="card qr-box">
        {paid ? (
          <>
            <span className="badge approved">Pago</span>
            <h1>Número garantido</h1>
            <p className="success">
              {payment.tickets.map((ticket) => String(ticket.number).padStart(2, '0')).join(', ')}
            </p>
            <Link className="button" to="/ganhadores">
              Ver ganhadores
            </Link>
          </>
        ) : (
          <>
            <h2>Pague com PIX</h2>
            {payment.pixCopyPaste && <QRCodeSVG value={payment.pixCopyPaste} size={220} />}
            <div className="pix-code">{payment.pixCopyPaste}</div>
            <button className="ghost" type="button" onClick={() => void copyPix()}>
              {copied ? 'Código copiado' : 'Copiar código PIX'}
            </button>
            {payment.sandbox && getToken() && (
              <button className="button" type="button" onClick={() => void confirmSandbox()}>
                Confirmar pagamento de teste
              </button>
            )}
          </>
        )}
      </article>

      <article className="card">
        <span className={`badge ${payment.status.toLowerCase()}`}>{statusLabel(payment.status)}</span>
        <h2>{payment.raffle.title}</h2>
        <p>{payment.raffle.prize}</p>
        <p>
          Números {payment.tickets.map((ticket) => ticket.number).join(', ')} · {formatMoney(payment.amount)}
        </p>
        <p>
          {payment.payerName} · {payment.payerEmail}
        </p>
        {error && <p className="error">{error}</p>}
      </article>
    </section>
  );
}
