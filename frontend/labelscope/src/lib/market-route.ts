export function marketUrl(marketId: string, href = window.location.href): string {
  const url = new URL(href);
  url.searchParams.set('market', marketId);
  return url.toString();
}

export function marketIdFromLocation(search = window.location.search): string | null {
  return new URLSearchParams(search).get('market');
}

export function syncMarketLocation(marketId: string | null): void {
  const url = new URL(window.location.href);
  if (marketId) url.searchParams.set('market', marketId);
  else url.searchParams.delete('market');
  window.history.replaceState(null, '', url);
}
