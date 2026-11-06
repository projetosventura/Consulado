# Central de Rifas — Consulado do Grêmio FB

Aplicação da organização sem fins lucrativos **Consulado do Grêmio — Francisco Beltrão/PR** para criar sorteios, vender números escolhidos pelo comprador e registrar ganhadores.

## Como testar localmente

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

2. Suba a stack:

```bash
docker compose up --build
```

3. Acesse:

- Público: http://localhost:5173
- Admin: http://localhost:5173/admin
- API: http://localhost:3000/api/health

Credenciais iniciais do admin:

- e-mail: `admin@consulado.local`
- senha: `admin123`

## Fluxo da rifa

1. O admin cadastra o sorteio (prêmio, valor do número, quantidade e data de encerramento).
2. O comprador escolhe os números **antes** de pagar.
3. Os números ficam reservados por 15 minutos.
4. O pagamento é PIX (Mercado Pago). Sem token, o ambiente local usa um PIX de teste.
5. No modo teste, o admin confirma o pagamento em **Admin → sorteio → pagamentos pendentes**.
6. No encerramento, o admin sorteia o ganhador entre os números pagos.

## Pagamento

A API escolhida é o **Mercado Pago (PIX)**:

- é a forma mais prática de funcionar no Brasil;
- o comprador já conhece PIX;
- o sandbox é simples;
- sem credencial a aplicação ainda sobe, com confirmação manual para testes.

Para PIX real de teste, coloque o `Access Token` de teste em `MERCADOPAGO_ACCESS_TOKEN` e exponha o webhook (`/api/payments/webhook`) com um túnel (ngrok, Cloudflare Tunnel, etc.).

## Expor na internet com ngrok

Com a stack no ar (`docker compose up`), publique o site e a API na mesma URL:

```powershell
ngrok http 5173
```

O Vite encaminha `/api` para o backend. Quem acessar o link do ngrok usa o app completo, inclusive o admin.

O plano gratuito do ngrok mostra uma tela de aviso na primeira visita. Não compartilhe a senha do admin em um túnel público.
