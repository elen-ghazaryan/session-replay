export function maskInput(text: string, element?: HTMLElement): string {
  if (!element) return '[masked]';
  const type = (element.getAttribute('type') || '').toLowerCase();

  if (type === 'password') return '********';
  if (element.hasAttribute('data-allow')) return text;

  const autocomplete = (element.getAttribute('autocomplete') || '').toLowerCase();

  if (type === 'email' || autocomplete.includes('email')) return '[email-masked]';
  if (type === 'tel' || autocomplete.includes('tel')) return '[phone-masked]';
  if (autocomplete.includes('cc-number')) return '[card-masked]';
  if (autocomplete.includes('name')) return '[name-masked]';

  return '[masked]';
}
