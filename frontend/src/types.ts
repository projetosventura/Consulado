export type RaffleStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'DRAWN';
export type TicketStatus = 'AVAILABLE' | 'RESERVED' | 'PAID';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export type Counters = {
  available: number;
  reserved: number;
  paid: number;
};

export type Ticket = {
  id?: string;
  number: number;
  status: TicketStatus;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  payment?: { id: string; status: PaymentStatus; amount: string } | null;
};

export type Winner = {
  id: string;
  drawnAt: string;
  raffle?: { id: string; title: string; prize: string };
  ticket: {
    number: number;
    buyerName?: string | null;
    buyerEmail?: string | null;
    buyerPhone?: string | null;
  };
};

export type Payment = {
  id: string;
  status: PaymentStatus;
  amount: string;
  pixCopyPaste?: string | null;
  pixQrCodeBase64?: string | null;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  expiresAt: string;
  approvedAt?: string | null;
  createdAt: string;
  sandbox?: boolean;
  tickets: Array<{ number: number; status: TicketStatus }>;
  raffle: { id: string; title: string; prize: string };
};

export type Raffle = {
  id: string;
  title: string;
  description: string;
  prize: string;
  imageUrl: string;
  ticketPrice: string;
  totalNumbers: number;
  status: RaffleStatus;
  startsAt: string;
  endsAt: string;
  counters: Counters;
  tickets?: Ticket[];
  winners?: Winner[];
  payments?: Payment[];
};

export type AdminSession = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};
