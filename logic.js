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

export function visibleEntries(entries, hiddenIds) {
  const hidden = new Set(hiddenIds || []);
  return entries.filter((entry) => !hidden.has(entry.id));
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

export function nextLine(list, current) {
  if (!list.length) return "";
  if (list.length === 1) return list[0];
  const index = list.indexOf(current);
  return list[(index < 0 ? 0 : index + 1) % list.length];
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
  "Abra os olhos. A atalaia não dorme por você.",
  "O primeiro movimento já é vitória.",
  "Levante antes que a dúvida sente.",
  "Hoje pede presença, não perfeição.",
  "A guarda se troca. Você continua.",
  "Um passo honesto vale mais que um plano bonito.",
  "Não espere o fogo alto. Acenda o pavio.",
  "O dia não cobra ânimo. Cobra presença.",
  "Fique de pé. O resto se arruma andando.",
  "A muralha se ergue pedra por pedra.",
  "Você já atravessou dias piores.",
  "Comece pequeno. Termine de pé.",
  "A manhã não pede discurso. Pede corpo.",
  "Honre a hora. O resto obedece.",
  "Cansaço não é ordem de parar.",
  "A forja aceita quem volta.",
  "Não peça permissão ao medo.",
  "O turno é seu. Ocupe.",
  "Respire e entre no dia.",
  "A chama cabe na palma. Ainda ilumina.",
  "Faça o que está na sua frente.",
  "A constância é uma porta baixa. Atravesse.",
  "Você não está atrasado. Está acordado.",
  "Deixe o dia encontrar você em movimento.",
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
  "Levante e abra a janela por um minuto.",
  "Lave o rosto antes de decidir qualquer coisa.",
  "Vista-se por completo antes de sentar.",
  "Encha uma garrafa de água e deixe-a à vista.",
  "Faça dez flexões, ou dez apoios na parede.",
  "Caminhe até o fim da rua e volte.",
  "Nomeie a primeira tarefa e abra só ela.",
  "Solte os ombros e alongue o pescoço.",
  "Coma uma fruta ou um pão antes de mais café.",
  "Feche uma aba que não serve a hoje.",
  "Escreva a hora em que vai parar de trabalhar.",
  "Suba um lance de escada sem olhar o celular.",
  "Guarde três objetos que estão fora do lugar.",
  "Conte quatro respirações lentas de pé.",
  "Diga bom dia a alguém, em uma frase.",
  "Silencie um aplicativo que te chama cedo.",
  "Fique de pé cinco minutos sem tela.",
  "Separe agora o que vai almoçar.",
  "Abra a tarefa adiada e faça só a primeira linha.",
  "Alongue a lombar antes de voltar à cadeira.",
  "Diga em voz alta a prioridade única do dia.",
  "Saia um minuto para o ar livre.",
  "Anote, à noite, uma coisa que você fez de pé.",
  "Deixe o sapato ou a roupa de amanhã no lugar.",
  "Leia por cinco minutos. Uma página já conta.",
  "Aprenda um passo de uma habilidade nova.",
  "Estude uma língua por cinco minutos: uma palavra ou uma frase.",
  "Releia em voz alta o que você anotou ontem.",
  "Explique uma ideia, em uma frase, como se ensinasse alguém.",
  "Resolva um problema pequeno no papel, sem tela.",
  "Aprenda o nome de uma ferramenta ou de um músculo que você usa.",
  "Pratique uma frase nova no idioma que você está estudando.",
  "Leia cinco minutos de algo que não seja rede social.",
  "Anote uma palavra nova e use-a numa frase.",
];
