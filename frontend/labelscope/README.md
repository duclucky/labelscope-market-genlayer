# LabelScope frontend

The existing LabelScope Vite interface reads canonical market, position, and credit state from the deployed `LabelScopeMarket` contract and sends user-signed Studionet transactions through an injected wallet.

## Local development

1. Copy `.env.example` to `.env.local` and set `VITE_CONTRACT_ADDRESS` to a deployed Studionet address.
2. Run `npm install`.
3. Run `npm run dev`.

`npm run lint`, `npm run test`, and `npm run build` verify TypeScript, focused adapter/UI behavior, and the production bundle. Frontend environment variables are public; never place a private key in this directory.
