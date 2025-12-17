export const yesNo = value => value ? '✔' : '—';

export const list = value =>
  Array.isArray(value) && value.length
    ? value.join(', ')
    : '—';
