# LabelScope frontend

The existing LabelScope Vite interface reads canonical market, position, and credit state from the deployed `LabelScopeMarket` contract and sends user-signed Studionet transactions through an injected wallet.

- Live app: https://labelscope-market-genlayer.vercel.app
- Studionet contract: `0x9F623cd3703c76E123aD561630A6B72364559f5E`

## Local development

1. Copy `.env.example` to `.env.local`; it already contains the active public Studionet address.
2. Run `npm install`.
3. Run `npm run dev`.

`npm run lint`, `npm run test`, and `npm run build` verify TypeScript, focused adapter/UI behavior, and the production bundle. Frontend environment variables are public; never place a private key in this directory.

Production canonical reads and the responsive user interface were verified. The
injected-wallet write path is implemented and tested, but browser-wallet write
evidence remains pending because the installed OKX Wallet did not grant a
connection during this build session.
