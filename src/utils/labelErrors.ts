import { cleanString } from './similarity';

/**
 * Erro de uma requisição de etiqueta, com o status HTTP e a mensagem crua do
 * backend (mantida para o console/suporte, nunca exibida diretamente).
 */
export class LabelRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'LabelRequestError';
    this.status = status;
  }
}

/** Monta um LabelRequestError a partir de uma resposta HTTP não-ok. */
export async function createLabelError(response: Response): Promise<LabelRequestError> {
  const data = await response.json().catch(() => null);
  return new LabelRequestError(data?.message || '', response.status);
}

const DEFAULT_MESSAGE =
  'Não foi possível obter a etiqueta agora. Tente novamente em alguns minutos. Se o problema continuar, avise o suporte.';

// Padrões aplicados sobre a mensagem normalizada (minúscula, sem acentos e sem
// pontuação — ver cleanString). A primeira regra que casar vence.
const FRIENDLY_MESSAGES: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /ainda nao liberada|ready to print|ainda esta sendo processada|ainda nao atribuiu um codigo de rastreio|should print first/,
    message: 'A etiqueta ainda não está disponível. O marketplace ainda não liberou a impressão; tente novamente em alguns minutos.',
  },
  {
    pattern: /fulfillment|nao tem etiqueta disponivel por essa api/,
    message: 'Este pedido é enviado diretamente pelo marketplace (Fulfillment), por isso a etiqueta não pode ser impressa por aqui.',
  },
  {
    pattern: /nao possui shipment|no shipment/,
    message: 'Este pedido não tem um envio cadastrado no marketplace, então ainda não há etiqueta para imprimir.',
  },
  {
    pattern: /nf e deste pedido ainda nao foi enviada|invoice/,
    message: 'A NF-e deste pedido ainda não foi enviada ao marketplace. Envie a nota fiscal antes de imprimir a etiqueta.',
  },
  {
    pattern: /nao esta em um status que permite|order status|invalid order/,
    message: 'O pedido ainda não está pronto para envio no marketplace. Confira o status do pedido e tente novamente.',
  },
  {
    pattern: /nao tem um pdf de etiqueta enviado pelo cigam/,
    message: 'O CIGAM não enviou a etiqueta desta nota fiscal. Tente imprimir a etiqueta do marketplace.',
  },
  {
    pattern: /nao esta vinculada a um marketplace/,
    message: 'Esta nota fiscal não está vinculada a um marketplace com etiqueta disponível. Tente imprimir a etiqueta do CIGAM.',
  },
  {
    pattern: /nenhuma etiqueta disponivel/,
    message: 'Ainda não há nenhuma etiqueta disponível para esta nota fiscal.',
  },
  {
    pattern: /pickup|dropoff|coleta|postagem/,
    message: 'O marketplace não informou uma forma de envio (coleta ou postagem) para este pedido. Verifique o pedido no painel do marketplace.',
  },
  {
    pattern: /nenhum token|nao configurado|can not print to label|nao esta habilitada/,
    message: 'A integração com o marketplace precisa de ajuste para gerar etiquetas. Avise o suporte.',
  },
];

/**
 * Converte qualquer erro na impressão/download de etiqueta numa mensagem
 * amigável para o usuário.
 */
export function getFriendlyLabelErrorMessage(err: unknown): string {
  // fetch lança TypeError quando não consegue falar com o servidor
  if (err instanceof TypeError) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
  }

  const status = err instanceof LabelRequestError ? err.status : undefined;
  if (status === 401 || status === 403) {
    return 'Sua sessão expirou. Faça login novamente para imprimir a etiqueta.';
  }

  const normalized = cleanString(err instanceof Error ? err.message : '');
  const match = FRIENDLY_MESSAGES.find(({ pattern }) => pattern.test(normalized));
  if (match) return match.message;

  if (status === 404) {
    return 'Não encontramos a etiqueta deste pedido. Confira se o pedido ainda existe no marketplace.';
  }
  if (status !== undefined && status >= 500) {
    return 'O serviço de etiquetas está instável no momento. Tente novamente em alguns minutos.';
  }

  return DEFAULT_MESSAGE;
}
