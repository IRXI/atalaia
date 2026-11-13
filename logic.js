export function localDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDate(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(y, m - 1, d);
  next.setDate(next.getDate() + days);
  return localDate(next);
}

export function nextStreak(prev, today) {
  const last = prev?.lastOpen || "";
  const streak = Number(prev?.streak) || 0;
  if (last === today) return { streak: Math.max(streak, 1), lastOpen: today };
  if (last && shiftDate(last, 1) === today) {
    return { streak: streak + 1, lastOpen: today };
  }
  return { streak: 1, lastOpen: today };
}

export function formatStreak(n) {
  return n === 1 ? "1 dia" : `${n} dias`;
}

export function pickId(ids, lastId, random = Math.random) {
  if (!ids.length) return null;
  const pool = ids.length > 1 ? ids.filter((id) => id !== lastId) : ids;
  const choices = pool.length ? pool : ids;
  const index = Math.min(choices.length - 1, Math.floor(random() * choices.length));
  return choices[index];
}

export function dailyIndex(dateStr, length) {
  let hash = 2166136261;
  for (let i = 0; i < dateStr.length; i += 1) {
    hash ^= dateStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

export function dailyItem(list, dateStr) {
  return list[dailyIndex(dateStr, list.length)];
}

export function videoUrl(name) {
  return `biblioteca/${encodeURIComponent(name)}`;
}

export const LINHAS = [
  "A disciplina é a armadura invisível.",
  "Um dia de cada vez. A forja não apressa o aço.",
  "Levante. O dia já começou.",
  "O que você repete, você se torna.",
  "Silêncio também é treino.",
  "A chama pequena ainda queima.",
  "Honre o que você prometeu ontem.",
  "Corpo cansado, vontade de pé.",
  "Não negocie com o primeiro não.",
  "A constância vence o talento parado.",
  "Você não precisa de ânimo. Precisa de um passo.",
  "O aço lembra cada batida.",
];

export const MISSOES = [
  "Beba um copo de água antes de qualquer tela.",
  "Caminhe dez minutos sem fone.",
  "Arrume a cama antes de sair.",
  "Escreva uma frase sobre o que importa hoje.",
  "Faça vinte agachamentos agora.",
  "Mande uma mensagem curta a alguém que você respeita.",
  "Deixe o celular em outro cômodo por uma hora.",
  "Respire fundo dez vezes, devagar.",
  "Termine uma tarefa pequena que você adia.",
  "Feche as telas vinte minutos antes de dormir.",
  "Alongue o corpo por três minutos.",
  "Anote a única coisa que não pode ficar para amanhã.",
];
