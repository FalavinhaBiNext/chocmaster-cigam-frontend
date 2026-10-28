// Conteúdo do tour guiado. Cada passo pode apontar para um elemento marcado com
// data-tour="<target>" e, se precisar, para a rota onde esse elemento existe.
// Passos sem target (ou cujo elemento não está visível, ex.: menu no celular)
// aparecem como um card centralizado.

export interface TourStep {
  id: string;
  title: string;
  /** Rótulo curto exibido acima do título (ex.: nome da tela). */
  section: string;
  /** Objetivo da funcionalidade, em uma ou duas frases. */
  objective: string;
  /** Como a funcionalidade funciona por trás. */
  howItWorks?: string[];
  /** Passo a passo de uso. */
  steps?: string[];
  /** Dica ou alerta importante. */
  tip?: string;
  route?: string;
  target?: string;
  adminOnly?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "boas-vindas",
    section: "Boas-vindas",
    title: "Bem-vindo ao Chocmaster",
    objective:
      "O Chocmaster é o integrador que conecta os pedidos do Bling ao ERP CIGAM e devolve as notas fiscais aos marketplaces (Mercado Livre, Shopee e Tray), sem digitação manual.",
    howItWorks: [
      "O pedido é criado no Bling e chega aqui automaticamente via webhook.",
      "O Chocmaster traduz clientes, produtos, pagamentos e transportadoras para os códigos do CIGAM (De Para) e envia o pedido ao ERP.",
      "Quando o CIGAM fatura, a NF-e volta para o Chocmaster.",
      "A NF-e é enviada ao marketplace, liberando a etiqueta de envio.",
    ],
    tip: "Este tour leva cerca de 3 minutos. Use as setas do teclado para navegar e Esc para sair. Você pode reabri-lo a qualquer momento pelo botão \"Tour do sistema\" no menu.",
  },
  {
    id: "menu",
    section: "Navegação",
    title: "Menu principal",
    target: "sidebar-nav",
    objective: "Aqui ficam todas as telas do sistema. A tela atual aparece destacada em azul.",
    steps: [
      "Clique em um item para abrir a tela correspondente.",
      "No computador, use a setinha na borda do menu para recolhê-lo e ganhar espaço.",
      "No celular, o menu abre pelo botão ☰ no canto superior esquerdo.",
    ],
    tip: "Algumas telas (De Para e Configurações) só aparecem para administradores.",
  },
  {
    id: "ambiente",
    section: "Navegação",
    title: "Ambiente do CIGAM",
    target: "env-selector",
    objective:
      "Define para qual ambiente do CIGAM os pedidos são enviados: Homologação (testes) ou Produção (operação real).",
    howItWorks: [
      "Cada ambiente usa um usuário CIGAM cadastrado em Configurações → Configurações CIGAM.",
      "Ao trocar, o sistema ativa a credencial do ambiente escolhido e recarrega os dados.",
    ],
    steps: [
      "Confira a cor antes de operar: amarelo = Homologação, verde = Produção.",
      "Clique no ambiente desejado para alternar.",
    ],
    tip: "Atenção: em Produção os pedidos geram movimentação real no ERP. Use Homologação para testes.",
  },
  {
    id: "dashboard-periodo",
    section: "Dashboard",
    title: "Visão geral da operação",
    route: "/dashboard",
    target: "dashboard-header",
    objective:
      "O Dashboard resume como está a integração: quantos pedidos chegaram, quantos foram para o CIGAM e quantas NF-e já foram enviadas.",
    steps: [
      "Escolha o período no seletor de datas (padrão: últimos 30 dias).",
      "Clique no botão de atualizar (↻) para buscar os dados mais recentes.",
    ],
    tip: "O mesmo seletor de período existe na tela de Eventos e segue a mesma regra: a data considerada é a de recebimento do pedido.",
  },
  {
    id: "dashboard-atencao",
    section: "Dashboard",
    title: "Itens que precisam de atenção",
    route: "/dashboard",
    target: "dashboard-attention",
    objective: "Este painel é o primeiro lugar para olhar todo dia: ele lista o que está travando a operação agora.",
    howItWorks: [
      "Pedidos com falha no CIGAM e pedidos parados há mais de 30 minutos.",
      "NF-e aguardando envio ao marketplace.",
      "Integrações desconectadas ou com autorização expirada.",
      "Formas de pagamento sem De Para (fazem os pedidos falharem).",
    ],
    steps: ["Clique em um item para ir direto à tela onde ele é resolvido."],
    tip: "Quando estiver verde com \"Tudo em dia\", não há pendências.",
  },
  {
    id: "dashboard-indicadores",
    section: "Dashboard",
    title: "Indicadores e funil",
    route: "/dashboard",
    target: "dashboard-stats",
    objective: "Os cartões mostram os números do período, comparados com o período anterior de mesmo tamanho.",
    howItWorks: [
      "Pedidos recebidos e valor movimentado: tudo que chegou do Bling.",
      "Sincronizados no CIGAM: percentual de pedidos já gravados no ERP.",
      "NF-e enviadas: notas faturadas que já chegaram ao marketplace.",
      "Mais abaixo: pedidos por dia, por canal, o funil operacional (recebido → CIGAM → faturado → enviado), status das integrações e resumo do De Para.",
    ],
    tip: "Se o funil \"afunila\" muito em uma etapa, é ali que está o gargalo.",
  },
  {
    id: "depara",
    section: "De Para",
    title: "De Para: Bling ↔ CIGAM",
    route: "/de-para",
    target: "depara-tabs",
    adminOnly: true,
    objective:
      "Vincula cada cadastro do Bling ao código equivalente no CIGAM. Sem esse vínculo o CIGAM não reconhece o pedido.",
    howItWorks: [
      "Abas: Clientes, Produtos, Formas de pagamento, Transportadoras e Lojas (canais de venda).",
      "Formas de pagamento são obrigatórias. Produtos sem vínculo fazem o pedido falhar.",
      "Clientes e transportadoras são vinculados automaticamente ao integrar o pedido.",
    ],
    steps: [
      "Escolha a aba da entidade.",
      "Use \"Sincronizar Bling\" / \"Sincronizar CIGAM\" para trazer os cadastros mais recentes.",
      "Selecione um registro na tabela do Bling e o correspondente na tabela do CIGAM.",
      "Confirme a associação.",
      "Ou abra \"Sugestões inteligentes\" para associar vários itens de uma vez por similaridade de nome/código.",
    ],
    tip: "Use o filtro \"Não associados\" para ver só o que falta vincular.",
  },
  {
    id: "mapeados",
    section: "Mapeados",
    title: "Vínculos já criados",
    route: "/mapeados",
    target: "mapeados-tabs",
    objective: "Consulta todos os vínculos De Para existentes, com ID do Bling, ID do CIGAM e nome.",
    steps: [
      "Escolha a aba da entidade.",
      "Use a busca para encontrar um item.",
      "Para corrigir um vínculo errado, exclua a associação (ícone de lixeira) e refaça no De Para.",
    ],
    tip: "Se a lista estiver vazia, os vínculos ainda não foram criados na tela De Para.",
  },
  {
    id: "eventos",
    section: "Eventos",
    title: "Eventos: pedidos recebidos",
    route: "/eventos",
    target: "eventos-section",
    objective:
      "Cada pedido que chega do Bling vira um evento. Aqui você acompanha se ele foi gravado no CIGAM e resolve os que travaram.",
    howItWorks: [
      "Pendente: ainda não foi para o CIGAM.",
      "Sincronizado: gravado no CIGAM com sucesso.",
      "Falha: o CIGAM recusou. Abra o pedido para ver o motivo.",
    ],
    steps: [
      "Filtre por Pendentes, Sincronizados ou Falhas e ajuste o período.",
      "Busque pelo número do pedido Bling.",
      "Clique no pedido para ver detalhes: cliente, itens, pagamento e erro.",
      "Corrija a causa (geralmente um De Para faltando) e clique em \"Tentar novamente\" (↺).",
      "Alterne entre visualização em Cards ou Lista conforme preferir.",
    ],
    tip: "Excluir um evento é definitivo: ele não poderá mais ser sincronizado com o CIGAM.",
  },
  {
    id: "nfe",
    section: "NF-e CIGAM",
    title: "Notas fiscais e etiquetas",
    route: "/nfe",
    target: "nfe-section",
    objective:
      "Reúne as NF-e faturadas pelo CIGAM e as entrega ao marketplace de origem do pedido, liberando a etiqueta de envio.",
    howItWorks: [
      "O CIGAM envia a NF-e automaticamente quando o pedido é faturado.",
      "O sistema identifica o pedido e o marketplace (Mercado Livre, Shopee, Tray...).",
    ],
    steps: [
      "Filtre por Pendentes para ver o que ainda não foi enviado.",
      "Clique em \"Enviar XML ao marketplace\" na nota desejada.",
      "Depois do envio, imprima a etiqueta de envio pelo ícone da impressora.",
      "Na Shopee, use \"Verificar envios Shopee\" para organizar os envios em lote.",
      "Também é possível visualizar ou baixar o XML e copiar a chave de acesso.",
    ],
    tip: "Se o marketplace ainda não liberou o envio, aguarde alguns minutos e tente de novo.",
  },
  {
    id: "configuracoes",
    section: "Configurações",
    title: "Configurações do sistema",
    route: "/configuracoes",
    target: "config-tabs",
    adminOnly: true,
    objective: "Área do administrador para preparar e manter as conexões da integração.",
    howItWorks: [
      "Resumo: visão geral das conexões e envio automático para o CIGAM (liga/desliga).",
      "Usuários: cadastro de quem acessa o Chocmaster e seus perfis.",
      "Configurações CIGAM: credenciais de Homologação e Produção.",
      "Conexões Marketplace: autorização de Mercado Livre, Shopee e Tray.",
    ],
    steps: [
      "Cadastre as credenciais CIGAM dos dois ambientes.",
      "Conecte cada marketplace e autorize o acesso na janela que abrir.",
      "Reconecte sempre que o Dashboard avisar que uma autorização expirou.",
    ],
  },
  {
    id: "ajuda",
    section: "Ajuda",
    title: "Reabra o tour quando quiser",
    target: "tour-button",
    objective: "Ficou alguma dúvida? Este botão inicia o tour novamente, do começo.",
  },
  {
    id: "conclusao",
    section: "Pronto!",
    title: "Sua rotina recomendada",
    objective: "Você já conhece o básico do Chocmaster. Uma rotina simples para o dia a dia:",
    steps: [
      "Abra o Dashboard e confira o painel de atenção.",
      "Resolva falhas e pendências na tela de Eventos.",
      "Envie as NF-e pendentes e imprima as etiquetas.",
      "Quando surgir um produto ou forma de pagamento novo no Bling, crie o vínculo no De Para.",
    ],
    tip: "Bom trabalho! 🚀",
  },
];
