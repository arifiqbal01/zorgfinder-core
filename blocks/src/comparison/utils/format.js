export function shortPhone(phone) {
  if (!phone) return '';
  return phone.replace(/\s+/g, ' ');
}
