// Alle opslag van de app begint met "lijstjes-", omdat WoonWerk dezelfde opslag van de browser deelt (AC16).
// De testversie op /lijstjes/test/ (gebouwd met VITE_TEST=1) gebruikt "lijstjes-test-", zodat hij je
// echte lijstjes nooit aanraakt.
export const IS_TEST = import.meta.env.VITE_TEST === '1'
export const KEY_PREFIX = IS_TEST ? 'lijstjes-test-' : 'lijstjes-'
