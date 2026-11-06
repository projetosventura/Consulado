import type { AdminSession, Payment, Raffle, Winner } from './types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.message;
    throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Falha na requisição.');
  }

  return payload as T;
}

export const api = {
  listRaffles: () => request<Raffle[]>('/raffles'),
  getRaffle: (id: string) => request<Raffle>(`/raffles/${id}`),
  listWinners: () => request<Winner[]>('/raffles/winners'),
  checkout: (body: {
    raffleId: string;
    numbers: number[];
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
  }) => request<Payment>('/payments/checkout', { method: 'POST', body: JSON.stringify(body) }),
  getPayment: (id: string) => request<Payment>(`/payments/${id}`),
  sandboxConfirm: (id: string) =>
    request<Payment>(`/payments/${id}/sandbox-confirm`, { method: 'POST' }),
  login: (email: string, password: string) =>
    request<AdminSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  adminRaffles: (token: string) => request<Raffle[]>('/admin/raffles', {}, token),
  adminRaffle: (id: string, token: string) => request<Raffle>(`/admin/raffles/${id}`, {}, token),
  createRaffle: (
    token: string,
    body: {
      title: string;
      description: string;
      prize: string;
      ticketPrice: number;
      totalNumbers: number;
      endsAt: string;
      image: File;
    },
  ) => {
    const form = new FormData();
    form.set('title', body.title);
    form.set('description', body.description);
    form.set('prize', body.prize);
    form.set('ticketPrice', String(body.ticketPrice));
    form.set('totalNumbers', String(body.totalNumbers));
    form.set('endsAt', body.endsAt);
    form.set('image', body.image);
    return request<Raffle>('/admin/raffles', { method: 'POST', body: form }, token);
  },
  updateRaffleImage: (id: string, token: string, image: File) => {
    const form = new FormData();
    form.set('image', image);
    return request<Raffle>(`/admin/raffles/${id}/image`, { method: 'POST', body: form }, token);
  },
  closeRaffle: (id: string, token: string) =>
    request<Raffle>(`/admin/raffles/${id}/close`, { method: 'POST' }, token),
  deleteRaffle: (id: string, token: string) =>
    request<{ id: string }>(`/admin/raffles/${id}`, { method: 'DELETE' }, token),
  drawRaffle: (id: string, token: string, winnersCount = 1) =>
    request<Winner[]>(`/admin/raffles/${id}/draw`, {
      method: 'POST',
      body: JSON.stringify({ winnersCount }),
    }, token),
  simulateApprove: (id: string, token: string) =>
    request<Payment>(`/payments/${id}/simulate-approve`, { method: 'POST' }, token),
};
