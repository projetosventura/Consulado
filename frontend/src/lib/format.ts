export function formatMoney(value: string | number) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    OPEN: 'Aberto',
    CLOSED: 'Encerrado',
    DRAWN: 'Sorteado',
    DRAFT: 'Rascunho',
    AVAILABLE: 'Livre',
    RESERVED: 'Reservado',
    PAID: 'Pago',
    PENDING: 'Pendente',
    APPROVED: 'Pago',
    EXPIRED: 'Expirado',
    CANCELLED: 'Cancelado',
    REJECTED: 'Recusado',
  };
  return labels[status] ?? status;
}
