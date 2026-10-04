export const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €';

export const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;
