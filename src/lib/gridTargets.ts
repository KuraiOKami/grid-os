export const KNOWN_DOMAINS = new Set([
  'gridos.corp', 'pulse.news', 'ghostlily.blog',
  'civic.archive', 'voidbay.net', 'yellowthread.forum',
  'gridnetnews.com', 'gridsocial.net', 'noodlehut.blog',
  'mtell.dev', 'gridmart.shop',
])

export function isValidGridUrl(url: string) {
  return KNOWN_DOMAINS.has(url.split('/')[0])
}
