import { cleanString } from './similarity';

/**
 * Explicação de uma falha de integração do pedido com o CIGAM: o que
 * aconteceu, como resolver e (quando houver) um atalho para a tela da correção.
 */
export interface EventErrorGuide {
  title: string;
  explanation: string;
  steps: string[];
  action?: {
    label: string;
    to: string;
    /** Telas restritas (De Para, Configurações): não-admin recebe adminHint. */
    adminOnly?: boolean;
  };
  /** Orientação para quem não tem acesso à tela da correção. */
  adminHint?: string;
}

// Mensagens gravadas em events.error_message pelo backend (cigamPedidoService,
// cigamAuthService, eventController). A regra é aplicada sobre a mensagem
// normalizada (ver cleanString); a primeira que casar vence.
interface Rule {
  pattern: RegExp;
  build: (raw: string) => EventErrorGuide;
}

// Trecho após o primeiro ":" — normalmente o motivo devolvido pelo CIGAM.
function cigamReason(raw: string) {
  const reason = raw.split(' | resposta CIGAM:')[0];
  const index = reason.indexOf(': ');
  return index >= 0 ? reason.slice(index + 2).trim() : '';
}

function deParaLink(aba: string, busca?: string) {
  const params = new URLSearchParams({ aba });
  if (busca) params.set('busca', busca);
  return `/de-para?${params.toString()}`;
}

const RETRY_STEP = 'Volte aqui e clique em "Tentar novamente".';

const RULES: Rule[] = [
  {
    pattern: /forma de pagamento.*nao possui mapeamento/,
    build: (raw) => {
      const id = raw.match(/ID Bling: (\d+)/)?.[1];
      return {
        title: 'Forma de pagamento sem De Para',
        explanation: `A forma de pagamento usada neste pedido${id ? ` (ID Bling ${id})` : ''} ainda não foi vinculada a uma condição de pagamento do CIGAM, então o ERP não sabe como registrá-lo.`,
        steps: [
          'Abra o De Para na aba Formas de pagamento.',
          'Se ela não aparecer na lista, clique em "Sincronizar Bling".',
          'Selecione a forma no Bling e a condição equivalente no CIGAM e associe.',
          RETRY_STEP,
        ],
        action: { label: 'Vincular forma de pagamento', to: deParaLink('formas_pagamento', id), adminOnly: true },
        adminHint: `Peça a um administrador para vincular a forma de pagamento${id ? ` ${id}` : ''} no De Para.`,
      };
    },
  },
  {
    pattern: /produto.*nao possui mapeamento/,
    build: (raw) => {
      const id = raw.match(/ID Bling: (\d+)/)?.[1];
      const nome = raw.match(/Produto "(.+?)"/)?.[1];
      return {
        title: 'Produto sem De Para',
        explanation: `O produto ${nome ? `"${nome}"` : 'deste pedido'}${id ? ` (ID Bling ${id})` : ''} não está vinculado a um material do CIGAM. Todos os itens do pedido precisam de vínculo para ele ser criado no ERP.`,
        steps: [
          'Abra o De Para na aba Produtos.',
          'Se o produto não aparecer, clique em "Sincronizar Bling" (e em "Sincronizar CIGAM", se o material for novo).',
          'Selecione o produto no Bling e o material equivalente no CIGAM e associe.',
          RETRY_STEP,
        ],
        action: { label: 'Vincular produto', to: deParaLink('produtos', id), adminOnly: true },
        adminHint: `Peça a um administrador para vincular o produto${nome ? ` "${nome}"` : ''} no De Para.`,
      };
    },
  },
  {
    pattern: /configurac(ao|oes)( do ambiente)? cigam.*nao encontrada/,
    build: () => ({
      title: 'Ambiente CIGAM não configurado',
      explanation:
        'Não há credencial cadastrada para o ambiente do CIGAM que está ativo (Homologação ou Produção), então o pedido não pôde ser enviado.',
      steps: [
        'Confira no menu lateral qual ambiente está ativo.',
        'Em Configurações → Configurações CIGAM, cadastre a credencial desse ambiente.',
        RETRY_STEP,
      ],
      action: { label: 'Abrir Configurações CIGAM', to: '/configuracoes?aba=cigam', adminOnly: true },
      adminHint: 'Peça a um administrador para cadastrar a credencial do CIGAM em Configurações.',
    }),
  },
  {
    pattern: /falha na autenticacao cigam|status code 401|status code 403/,
    build: () => ({
      title: 'O CIGAM recusou o login',
      explanation:
        'O Chocmaster não conseguiu se autenticar no CIGAM. Normalmente o usuário ou a senha (PIN) do ambiente ativo foram alterados ou expiraram.',
      steps: [
        'Em Configurações → Configurações CIGAM, confira a credencial do ambiente ativo.',
        'Atualize o usuário e a senha, se necessário.',
        RETRY_STEP,
      ],
      action: { label: 'Abrir Configurações CIGAM', to: '/configuracoes?aba=cigam', adminOnly: true },
      adminHint: 'Peça a um administrador para conferir a credencial do CIGAM em Configurações.',
    }),
  },
  {
    pattern: /cigam rejeitou a criacao da capa/,
    build: (raw) => {
      const motivo = cigamReason(raw);
      return {
        title: 'O CIGAM recusou o pedido',
        explanation: `O CIGAM validou os dados do pedido e não aceitou.${motivo ? ` Motivo informado: "${motivo}".` : ''}`,
        steps: [
          'Leia o motivo acima: ele costuma indicar o campo com problema.',
          'Causas comuns: cliente com cadastro incompleto no CIGAM (CPF/CNPJ, endereço), loja sem "Código da Conta" no De Para → Lojas, ou condição de pagamento inativa.',
          'Corrija o cadastro indicado e clique em "Tentar novamente".',
          'Se o motivo não for claro, envie os detalhes técnicos ao suporte.',
        ],
        action: { label: 'Conferir lojas no De Para', to: deParaLink('lojas'), adminOnly: true },
      };
    },
  },
  {
    pattern: /falha ao adicionar item/,
    build: (raw) => {
      const material = raw.match(/Material: ([^)]+)\)/)?.[1]?.trim();
      const motivo = cigamReason(raw);
      return {
        title: 'O CIGAM recusou um item do pedido',
        explanation: `O pedido foi aberto no CIGAM, mas o material${material ? ` ${material}` : ''} não pôde ser adicionado.${motivo ? ` Motivo informado: "${motivo}".` : ''}`,
        steps: [
          'Confira se o produto está vinculado ao material correto em Mapeados → Produtos.',
          'Verifique no CIGAM se o material está ativo e com cadastro fiscal completo.',
          'Se o vínculo estiver errado, exclua-o em Mapeados e refaça no De Para.',
          RETRY_STEP,
        ],
        action: {
          label: 'Ver vínculo do produto',
          to: `/mapeados?${new URLSearchParams({ aba: 'produtos', ...(material ? { busca: material } : {}) }).toString()}`,
        },
      };
    },
  },
  {
    pattern: /nao foi possivel recuperar o codigo do pedido|nao encontrado apos \d+ tentativas/,
    build: () => ({
      title: 'O CIGAM não confirmou o pedido',
      explanation:
        'O pedido foi enviado, mas o CIGAM não devolveu a confirmação a tempo. Ele pode ter sido criado ou não.',
      steps: [
        'Aguarde alguns minutos: o CIGAM pode estar lento.',
        'Clique em "Tentar novamente". O sistema reaproveita o pedido já aberto no CIGAM, quando houver.',
        'Se a falha se repetir, confira no CIGAM se o pedido existe antes de acionar o suporte.',
      ],
    }),
  },
  {
    pattern: /hub pedido api key/,
    build: () => ({
      title: 'Configuração do servidor incompleta',
      explanation:
        'Falta uma chave de acesso ao CIGAM na configuração do servidor do Chocmaster. Isso não se resolve pela tela.',
      steps: ['Avise o suporte técnico e envie os detalhes técnicos abaixo.', 'Depois do ajuste, clique em "Tentar novamente".'],
    }),
  },
  {
    pattern: /timeout|econnrefused|econnreset|enotfound|etimedout|socket hang up|network error|status code 5\d\d/,
    build: () => ({
      title: 'CIGAM indisponível no momento',
      explanation: 'O servidor do CIGAM não respondeu ou estava instável quando o pedido foi enviado.',
      steps: [
        'Aguarde alguns minutos.',
        'Clique em "Tentar novamente".',
        'Se continuar falhando por mais de 30 minutos, avise o suporte.',
      ],
    }),
  },
];

/** Converte a mensagem de erro crua de um evento numa explicação com solução. */
export function getEventErrorGuide(raw: string | null | undefined): EventErrorGuide {
  const message = raw ?? '';
  const normalized = cleanString(message);
  const rule = RULES.find(({ pattern }) => pattern.test(normalized));
  if (rule) return rule.build(message);

  return {
    title: 'Falha ao enviar ao CIGAM',
    explanation: 'O pedido não pôde ser gravado no CIGAM por um motivo que o sistema não reconheceu automaticamente.',
    steps: [
      'Clique em "Tentar novamente": falhas temporárias costumam se resolver assim.',
      'Se repetir, copie os detalhes técnicos abaixo e envie ao suporte.',
    ],
  };
}
