// Conteúdo do tour guiado. Cada passo pode apontar para um elemento marcado com
// data-tour="<target>" e, se precisar, para a rota onde esse elemento existe.
// O tour completo mostra a visão geral (passos sem pageOnly); o botão "Como
// usar" de cada tela mostra todos os passos daquela rota, na ordem abaixo.
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
  /** Passo detalhado: só aparece no tour da página (botão "Como usar"). */
  pageOnly?: boolean;
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
    id: "dashboard-funil",
    section: "Dashboard",
    title: "Funil operacional",
    route: "/dashboard",
    target: "dashboard-funnel",
    pageOnly: true,
    objective: "Mostra quantos pedidos do período passaram por cada etapa, do recebimento até a NF-e no marketplace.",
    howItWorks: [
      "Pedidos recebidos → Sincronizados no CIGAM → NF-e faturada → NF-e enviada ao marketplace.",
      "A diferença entre duas etapas é o que ainda está parado entre elas.",
    ],
    tip: "Muitos recebidos e poucos sincronizados? Veja as falhas em Eventos. Muitas faturadas e poucas enviadas? Veja a tela de NF-e.",
  },
  {
    id: "dashboard-integracoes",
    section: "Dashboard",
    title: "Status das integrações",
    route: "/dashboard",
    target: "dashboard-integrations",
    pageOnly: true,
    objective: "Indica se Bling, Mercado Livre, Shopee e Tray estão conectados e com a autorização válida.",
    steps: [
      "Verde: conectado e funcionando.",
      "Amarelo/vermelho: a autorização expirou ou a conta não está conectada.",
      "Para corrigir, um administrador deve reconectar a conta em Configurações → Conexões Marketplace.",
    ],
  },
  {
    id: "dashboard-mapeamentos",
    section: "Dashboard",
    title: "Resumo do De Para",
    route: "/dashboard",
    target: "dashboard-mapping",
    pageOnly: true,
    objective: "Mostra quantos cadastros do Bling já estão vinculados ao CIGAM em cada tipo.",
    howItWorks: [
      "Formas de pagamento precisam estar 100% vinculadas: sem isso, os pedidos falham.",
      "Produtos só precisam de vínculo quando são vendidos.",
      "Clientes e transportadoras são vinculados automaticamente.",
    ],
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
    id: "depara-acoes",
    section: "De Para",
    title: "Sincronizar e sugestões",
    route: "/de-para",
    target: "depara-acoes",
    adminOnly: true,
    pageOnly: true,
    objective: "Botões para atualizar os cadastros e acelerar os vínculos.",
    howItWorks: [
      "Sincronizar Bling / Sincronizar CIGAM: busca os cadastros mais recentes de cada sistema. O progresso aparece em um painel na parte de baixo da tela.",
      "Sugestões inteligentes: compara nomes e códigos e propõe pares Bling ↔ CIGAM parecidos (acima de 45% de semelhança).",
    ],
    steps: [
      "Sincronize antes de vincular, para trabalhar com a lista atualizada.",
      "Abra as Sugestões inteligentes, revise os pares e marque os corretos.",
      "Confirme para associar todos os marcados de uma vez.",
    ],
    tip: "Sempre confira as sugestões antes de aceitar: nomes parecidos nem sempre são o mesmo item.",
  },
  {
    id: "depara-tabelas",
    section: "De Para",
    title: "Associação manual",
    route: "/de-para",
    target: "depara-tabelas",
    adminOnly: true,
    pageOnly: true,
    objective: "À esquerda ficam os cadastros do Bling e à direita os do CIGAM. Vincule um ao outro.",
    steps: [
      "Busque o item na tabela do Bling (por nome, ID ou código) e clique para selecioná-lo.",
      "Busque o equivalente na tabela do CIGAM e selecione.",
      "Clique em associar para salvar o vínculo.",
      "Use os filtros (Todos / Associados / Não associados) para acompanhar o que falta.",
    ],
    tip: "Na tela de Eventos, o botão de correção de um pedido com falha já abre esta tela filtrada no item certo.",
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
    id: "mapeados-busca",
    section: "Mapeados",
    title: "Buscar um vínculo",
    route: "/mapeados",
    target: "mapeados-busca",
    pageOnly: true,
    objective: "Encontre rapidamente para qual código do CIGAM um item do Bling está apontando.",
    steps: [
      "Digite o nome, o ID do Bling ou o código do CIGAM.",
      "Confira a coluna ID CIGAM.",
      "Se estiver errado, exclua a associação e refaça no De Para.",
    ],
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
    id: "eventos-busca",
    section: "Eventos",
    title: "Período, busca e visualização",
    route: "/eventos",
    target: "eventos-busca",
    pageOnly: true,
    objective: "Encontre um pedido específico ou restrinja a lista a um período.",
    steps: [
      "Escolha o período pela data de recebimento do pedido.",
      "Digite o número do pedido Bling na busca.",
      "Alterne entre Cards (mais detalhes) e Lista (mais compacta).",
    ],
  },
  {
    id: "eventos-falhas",
    section: "Eventos",
    title: "Resolvendo um pedido com falha",
    route: "/eventos",
    pageOnly: true,
    objective: "Ao abrir um pedido com falha, o sistema explica o motivo em linguagem simples e mostra como resolver.",
    howItWorks: [
      "O título resume o problema (ex.: \"Produto sem De Para\", \"CIGAM indisponível\").",
      "\"Como resolver\" traz o passo a passo da correção.",
      "Quando possível, um botão leva direto à tela da correção, já filtrada no item certo.",
      "\"Detalhes técnicos\" guarda a mensagem original para enviar ao suporte.",
    ],
    steps: [
      "Filtre por Falhas e clique no pedido.",
      "Siga o passo a passo ou use o botão de correção.",
      "Volte e clique em \"Tentar novamente\".",
    ],
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
    id: "nfe-shopee",
    section: "NF-e CIGAM",
    title: "Envios Shopee",
    route: "/nfe",
    target: "nfe-shopee",
    pageOnly: true,
    objective: "Na Shopee, além de enviar a NF-e, o envio precisa ser organizado para liberar a etiqueta.",
    steps: [
      "Clique em \"Verificar envios Shopee\".",
      "O sistema confere as NF-e Shopee dos últimos 30 dias e organiza as pendentes.",
      "Leia o resumo: organizados agora, já organizados, com falha e não encontrados.",
    ],
  },
  {
    id: "nfe-filtros",
    section: "NF-e CIGAM",
    title: "Filtros e ações por nota",
    route: "/nfe",
    target: "nfe-filtros",
    pageOnly: true,
    objective: "Encontre as notas pelo status, marketplace, data ou número, e aja sobre cada uma.",
    steps: [
      "Use \"Pendentes\" para ver só o que falta enviar.",
      "Filtre por marketplace ou período, ou busque por pedido, número da NF ou chave.",
      "Na linha da nota: visualizar/baixar XML, enviar ao marketplace, imprimir etiqueta ou excluir.",
    ],
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
