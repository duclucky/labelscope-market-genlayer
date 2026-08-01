import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Application root is unavailable.');
const root = createRoot(rootElement);

void import('./App.tsx')
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown startup failure';
    rootElement.dataset.bootError = message;
    console.error('LabelScope failed to start:', error);
    root.render(
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <section className="max-w-lg bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
          <h1 className="font-sans font-bold text-2xl text-slate-900 mb-2">LabelScope could not start</h1>
          <p className="font-sans text-sm text-slate-500">Reload the page. If the issue continues, the current deployment may be temporarily unavailable.</p>
        </section>
      </main>,
    );
  });
