import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getToken } from '../auth';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function AdminNewRafflePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [prize, setPrize] = useState('');
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState(10);
  const [totalNumbers, setTotalNumbers] = useState(100);
  const [endsAt, setEndsAt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!image) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) {
      return;
    }
    if (!image) {
      setError('A foto do produto é obrigatória.');
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
      setError('Envie uma foto JPG, PNG ou WebP.');
      return;
    }
    if (image.size > MAX_IMAGE_BYTES) {
      setError('A foto pode ter no máximo 5 MB.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const raffle = await api.createRaffle(token, {
        title,
        prize,
        description,
        ticketPrice,
        totalNumbers,
        endsAt: new Date(endsAt).toISOString(),
        image,
      });
      navigate(`/admin/sorteios/${raffle.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="hero">
      <h1>Novo sorteio</h1>
      <form className="card form" onSubmit={(event) => void onSubmit(event)}>
        <label>
          Título
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label>
          Prêmio
          <input value={prize} onChange={(event) => setPrize(event.target.value)} required />
        </label>
        <label>
          Foto do produto
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          />
          <small className="hint">JPG, PNG ou WebP, até 5 MB. Essa foto aparece para quem vai comprar.</small>
        </label>
        {preview && <img className="prize-photo hero" src={preview} alt="Prévia do produto" />}
        <label>
          Descrição
          <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} required />
        </label>
        <label>
          Valor do número
          <input
            type="number"
            min={1}
            step="0.01"
            value={ticketPrice}
            onChange={(event) => setTicketPrice(Number(event.target.value))}
          />
        </label>
        <label>
          Quantidade de números
          <input
            type="number"
            min={2}
            max={5000}
            value={totalNumbers}
            onChange={(event) => setTotalNumbers(Number(event.target.value))}
          />
        </label>
        <label>
          Encerra em
          <input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="button" disabled={saving}>
          {saving ? 'Publicando...' : 'Publicar sorteio'}
        </button>
      </form>
    </section>
  );
}
