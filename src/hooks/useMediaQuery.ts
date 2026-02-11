import { useState, useEffect } from 'react';

/**
 * Reactive media query hook. Returns true when the query matches.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** True when viewport is below 768px (tablet/phone). */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}
