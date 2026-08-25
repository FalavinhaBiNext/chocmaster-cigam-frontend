import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { calculateSimilarity, calculateCodeSimilarity } from '../utils/similarity';
import { CheckCircle, AlertCircle, ArrowRight, Search, Link2, Sparkles, ChevronDown, RefreshCw, SlidersHorizontal, Download } from 'lucide-react';

import logoBling from '../assets/LogoBlingBlack.png'
import logoCigam from '../assets/LogoCigamBlack.png'

interface BlingItem {
  id: string;
  name: string;
  extra?: string;
  codigo?: string;
  temVariacoes?: boolean;
  id_produto?: string;
  preco?: number;
  tipo?: string;
  situacao?: string;
  formato?: string;
  descricaoCurta?: string;
  unidade?: string;
  tipoProduto?: string;
  condicao?: number;
  marca?: string;
  categoria_id?: number;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  fornecedor_codigo?: string;
  fornecedor_precoCusto?: number;
  ncm?: string;
  quantidade_estoque?: number;
  ativo?: boolean;
  unidade_negocio?: string;
  [key: string]: unknown;
}

interface CigamItem {
  id: string;
  name: string;
  extra?: string;
  [key: string]: unknown;
}

interface Mapping {
  id_bling: string;
  id_cigam: string;
  nome: string;
}

interface DeParaSectionProps {
  entity: 'clientes' | 'produtos' | 'formas_pagamento' | 'transportadoras';
  title: string;
  blingData: BlingItem[];
  cigamData: CigamItem[];
  mappings: Mapping[];
  onSaveMapping: (idBling: string, idCigam: string, name: string) => Promise<void>;
  loading: boolean;
  onSync?: () => Promise<void>;
  syncing?: boolean;
  logs?: string[];
  onRefresh?: () => Promise<void>;
  unidadeNegocioFilter?: string;
}

export const DeParaSection: React.FC<DeParaSectionProps> = ({
  entity,
  title,
  blingData,
  cigamData,
  mappings,
  onSaveMapping,
  loading,
  onSync,
  syncing,
  logs,
  onRefresh,
  unidadeNegocioFilter,
}) => {
  const { token } = useAuth();
  const [searchBling, setSearchBling] = useState('');
  const [searchCigam, setSearchCigam] = useState('');
  const [selectedBlingId, setSelectedBlingId] = useState<string | null>(null);
  const [selectedCigamId, setSelectedCigamId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>(['unmapped']);
  const [showFilters, setShowFilters] = useState(true);
  const [blingFilter, setBlingFilter] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [cigamFilter, setCigamFilter] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingPaymentSource, setExportingPaymentSource] = useState<'bling' | 'cigam' | null>(null);
  const [isSyncingCigam, setIsSyncingCigam] = useState(false);

  // Modal state for product details
  const [modalItem, setModalItem] = useState<BlingItem | CigamItem | null>(null);
  const [modalSource, setModalSource] = useState<'bling' | 'cigam' | null>(null);

  // Custom Alert Modal state
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ show: true, title, message, type });
  };

  // Pagination states
  const [visibleBlingCount, setVisibleBlingCount] = useState(25);
  const [visibleCigamCount, setVisibleCigamCount] = useState(25);

  // Suggestions state
  const [showSmartMatches, setShowSmartMatches] = useState(false);

  // Reset pagination when tab/search/filters change
  useEffect(() => {
    setVisibleBlingCount(25);
    setSelectedBlingId(null);
  }, [entity, searchBling, activeTags]);

  useEffect(() => {
    setVisibleCigamCount(25);
    setSelectedCigamId(null);
  }, [entity, searchCigam]);

  useEffect(() => {
    setShowSmartMatches(false);
    setShowFilters(true);
    setBlingFilter('all');
    setCigamFilter('all');
    setSelectedSuggestions(new Set());
    if (entity === 'produtos') {
      setActiveTags(['unmapped', 'valid_sku']);
    } else {
      setActiveTags(['unmapped']);
    }
  }, [entity]);

  // Scroll to bottom of terminal console logs when new messages arrive
  useEffect(() => {
    if (logs && logs.length > 0) {
      const bottomEl = document.getElementById('console-bottom');
      if (bottomEl) {
        bottomEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [logs]);

  // Set of mapped Bling IDs
  const mappedBlingIds = useMemo(() => new Set(mappings.map((m) => m.id_bling)), [mappings]);

  // Map of Bling ID -> CIGAM ID
  const blingToCigamMap = useMemo(() => {
    const map = new Map<string, string>();
    mappings.forEach((m) => map.set(m.id_bling, m.id_cigam));
    return map;
  }, [mappings]);

  // Map of CIGAM ID -> Array of Bling items
  const cigamToBlingMap = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string }>>();
    mappings.forEach((m) => {
      const list = map.get(m.id_cigam) || [];
      list.push({ id: m.id_bling, name: m.nome });
      map.set(m.id_cigam, list);
    });
    return map;
  }, [mappings]);

  // Find names/details
  const selectedBlingItem = useMemo(
    () => blingData.find((item) => item.id === selectedBlingId),
    [blingData, selectedBlingId]
  );
  const selectedCigamItem = useMemo(
    () => cigamData.find((item) => item.id === selectedCigamId),
    [cigamData, selectedCigamId]
  );

  // Dynamic tag counts based on text search and active tags
  const tagCounts = useMemo(() => {
    if (entity !== 'produtos') return {
      unmapped: 0, mapped: 0, validSku: 0, hasNcm: 0
    };

    let unmappedCount = 0;
    let mappedCount = 0;
    let validSku = 0;
    let hasNcm = 0;

    blingData.forEach(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchBling.toLowerCase()) ||
        item.id.includes(searchBling) ||
        (item.codigo && item.codigo.toLowerCase().includes(searchBling.toLowerCase()));
      const isUnmapped = !mappedBlingIds.has(item.id);

      if (matchesSearch) {
        if (isUnmapped) unmappedCount++;
        else mappedCount++;

        if (item.ncm && item.ncm.trim() !== '') hasNcm++;

        const isStandardSku = item.codigo ? /^\d{4}[a-zA-Z0-9]{0,2}$/.test(item.codigo) : false;
        if (isStandardSku) validSku++;
      }
    });

    return {
      unmapped: unmappedCount,
      mapped: mappedCount,
      validSku,
      hasNcm
    };
  }, [blingData, entity, searchBling, mappedBlingIds]);

  // Filtering Bling Items
  const filteredBlingData = useMemo(() => {
    return blingData.filter((item) => {
      // Filter by unidade_negocio for products
      if (entity === 'produtos' && unidadeNegocioFilter && item.unidade_negocio !== unidadeNegocioFilter) {
        return false;
      }

      const matchesSearch = item.name.toLowerCase().includes(searchBling.toLowerCase()) ||
        item.id.includes(searchBling) ||
        (item.codigo && item.codigo.toLowerCase().includes(searchBling.toLowerCase()));
      const isUnmapped = !mappedBlingIds.has(item.id);

      if (!matchesSearch) return false;

      // Other entities show only unmapped items by default
      if (entity !== 'produtos') {
        if (entity === 'formas_pagamento') {
          if (blingFilter === 'mapped' && isUnmapped) return false;
          if (blingFilter === 'unmapped' && !isUnmapped) return false;
        } else if (!isUnmapped) return false;
      } else {
        // Products apply tag filters
        for (const tag of activeTags) {
          if (tag === 'unmapped' && !isUnmapped) return false;
          if (tag === 'mapped' && isUnmapped) return false;
          if (tag === 'has_ncm' && (!item.ncm || item.ncm.trim() === '')) return false;
          if (tag === 'valid_sku') {
            const isStandardSku = item.codigo ? /^\d{4}[a-zA-Z0-9]{0,2}$/.test(item.codigo) : false;
            if (!isStandardSku) return false;
          }
        }
      }

      return true;
    });
  }, [blingData, searchBling, mappedBlingIds, activeTags, blingFilter, entity, unidadeNegocioFilter]);

  const blingCounts = useMemo(() => {
    let mapped = 0;
    let unmapped = 0;

    blingData.forEach((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchBling.toLowerCase()) ||
        item.id.toLowerCase().includes(searchBling.toLowerCase());
      if (!matchesSearch) return;
      if (mappedBlingIds.has(item.id)) mapped++;
      else unmapped++;
    });

    return { all: mapped + unmapped, mapped, unmapped };
  }, [blingData, searchBling, mappedBlingIds]);

  // Paginated Bling data
  const displayedBlingData = useMemo(() => {
    return filteredBlingData.slice(0, visibleBlingCount);
  }, [filteredBlingData, visibleBlingCount]);

  // CIGAM items count for filters
  const cigamCounts = useMemo(() => {
    let mapped = 0;
    let unmapped = 0;

    cigamData.forEach((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchCigam.toLowerCase()) ||
        item.id.toLowerCase().includes(searchCigam.toLowerCase()) ||
        (item.codigo && String(item.codigo).toLowerCase().includes(searchCigam.toLowerCase()));

      if (matchesSearch) {
        const associatedBlingItems = cigamToBlingMap.get(item.id);
        const isMapped = associatedBlingItems && associatedBlingItems.length > 0;
        if (isMapped) mapped++;
        else unmapped++;
      }
    });

    return {
      all: mapped + unmapped,
      mapped,
      unmapped,
    };
  }, [cigamData, searchCigam, cigamToBlingMap]);

  // Filtering CIGAM Items
  const filteredCigamData = useMemo(() => {
    return cigamData.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchCigam.toLowerCase()) ||
        item.id.toLowerCase().includes(searchCigam.toLowerCase()) ||
        (item.codigo && String(item.codigo).toLowerCase().includes(searchCigam.toLowerCase()));

      if (!matchesSearch) return false;

      const associatedBlingItems = cigamToBlingMap.get(item.id);
      const isMapped = associatedBlingItems && associatedBlingItems.length > 0;

      if (cigamFilter === 'mapped' && !isMapped) return false;
      if (cigamFilter === 'unmapped' && isMapped) return false;

      return true;
    });
  }, [cigamData, searchCigam, cigamToBlingMap, cigamFilter]);

  // Paginated CIGAM data
  const displayedCigamData = useMemo(() => {
    return filteredCigamData.slice(0, visibleCigamCount);
  }, [filteredCigamData, visibleCigamCount]);

  // Generate Smart Match Suggestions
  const smartMatches = useMemo(() => {
    const suggestions: Array<{
      bling: BlingItem;
      cigam: CigamItem;
      score: number;
    }> = [];

    // Only suggest matches for the first 50 unmapped Bling items to prevent UI freeze/slowness (O(N*M) complexity)
    // For 'produtos', we search all unmapped products without exception.
    const unmappedBling = entity === 'produtos'
      ? blingData.filter((b) => !mappedBlingIds.has(b.id))
      : blingData.filter((b) => !mappedBlingIds.has(b.id)).slice(0, 50);

    unmappedBling.forEach((blingItem) => {
      let bestMatch: CigamItem | null = null;
      let highestScore = 0;

      cigamData.forEach((cigamItem) => {
        let score = 0;
        if (entity === 'produtos') {
          if (blingItem.codigo && cigamItem.id) {
            score = calculateCodeSimilarity(blingItem.codigo, cigamItem.id);
          }
        } else {
          score = calculateSimilarity(blingItem.name, cigamItem.name);
        }
        if (score > highestScore) {
          highestScore = score;
          bestMatch = cigamItem;
        }
      });

      // Show suggestion if similarity is above 45%
      if (bestMatch && highestScore >= 45) {
        suggestions.push({
          bling: blingItem,
          cigam: bestMatch,
          score: highestScore,
        });
      }
    });

    return suggestions.sort((a, b) => b.score - a.score);
  }, [blingData, cigamData, mappedBlingIds, entity]);

  const handleLink = async () => {
    if (!selectedBlingId || !selectedCigamId || !selectedBlingItem) return;
    setIsSaving(true);
    try {
      await onSaveMapping(selectedBlingId, selectedCigamId, selectedBlingItem.name);
      setSelectedBlingId(null);
      setSelectedCigamId(null);
      showAlert('Associação Salva', 'A associação foi salva com sucesso no banco de dados.', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Erro ao Associar', 'Não foi possível salvar a associação manual.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplySuggestion = async (blingId: string, cigamId: string, name: string) => {
    setIsSaving(true);
    try {
      await onSaveMapping(blingId, cigamId, name);
      if (selectedBlingId === blingId) setSelectedBlingId(null);
      if (selectedCigamId === cigamId) setSelectedCigamId(null);
      // Remove from selected bulk if present
      setSelectedSuggestions((prev) => {
        if (!prev.has(blingId)) return prev;
        const next = new Set(prev);
        next.delete(blingId);
        return next;
      });
      showAlert('Associação Salva', 'Sugestão inteligente aceita e associada com sucesso.', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Erro ao Associar', 'Não foi possível associar o produto sugerido.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSuggestionSelection = (blingId: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(blingId)) {
        next.delete(blingId);
      } else {
        next.add(blingId);
      }
      return next;
    });
  };

  const handleSelectAllSuggestions = () => {
    if (selectedSuggestions.size === smartMatches.length) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(smartMatches.map((m) => m.bling.id)));
    }
  };

  const handleBulkAssociate = async () => {
    if (selectedSuggestions.size === 0) return;
    setIsBulkSaving(true);
    setIsSaving(true);
    try {
      const toAssociate = smartMatches.filter((m) => selectedSuggestions.has(m.bling.id));
      for (const m of toAssociate) {
        await onSaveMapping(m.bling.id, m.cigam.id, m.bling.name);
      }
      const count = selectedSuggestions.size;
      setSelectedSuggestions(new Set());
      showAlert('Associação em Massa', `${count} sugestões foram associadas com sucesso.`, 'success');
    } catch (error) {
      console.error(error);
      showAlert('Erro ao Associar', 'Erro ao processar as associações em massa.', 'error');
    } finally {
      setIsBulkSaving(false);
      setIsSaving(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`https://api-chocmaster.falavinhanext.tec.br/api/v1/produtos/export-excel`);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao exportar planilha. Verifique se o template ESMATERI.xlsx está na pasta Downloads.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'produtos_esmateri_preenchido.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showAlert('Exportação Concluída', 'A planilha de produtos não associados com NCM foi exportada e o download iniciado.', 'success');
    } catch (error: any) {
      console.error(error);
      showAlert('Erro de Exportação', error.message || 'Não foi possível gerar a planilha de exportação.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPaymentMethods = async (
    source: 'bling' | 'cigam',
    filter: 'all' | 'mapped' | 'unmapped',
  ) => {
    setExportingPaymentSource(source);
    try {
      const response = await fetch(
        `https://api-chocmaster.falavinhanext.tec.br/api/v1/depara/formas-pagamento/export-excel?source=${source}&association=${filter}`,
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Não foi possível gerar o Excel de formas de pagamento.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `formas_pagamento_${source}_${filter}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showAlert(
        'Exportação concluída',
        `O Excel da origem ${source === 'bling' ? 'Bling' : 'CIGAM'} foi gerado com o filtro selecionado.`,
        'success',
      );
    } catch (error: any) {
      console.error(error);
      showAlert('Erro de exportação', error.message || 'Não foi possível exportar as formas de pagamento.', 'error');
    } finally {
      setExportingPaymentSource(null);
    }
  };

  const handleSyncCigam = async () => {
    const syncConfig = {
      produtos: { endpoint: 'produtos', label: 'produtos' },
      clientes: null,
      formas_pagamento: { endpoint: 'formas-pagamento', label: 'formas de pagamento' },
      transportadoras: { endpoint: 'transportadoras', label: 'transportadoras' },
    }[entity];

    if (!syncConfig) return;
    const { endpoint, label: entityLabel } = syncConfig;

    setIsSyncingCigam(true);
    try {
      // 1. Dispara o sync (retorna imediatamente com jobId)
      const startResponse = await fetch(`https://api-chocmaster.falavinhanext.tec.br/api/v1/cigam/sync/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      if (!startResponse.ok) {
        const errData = await startResponse.json().catch(() => ({}));
        throw new Error(errData.message || `Falha ao iniciar sincronização de ${entityLabel} do CIGAM.`);
      }

      const startData = await startResponse.json();
      const jobId = startData.data?.jobId;

      if (!jobId) {
        throw new Error('Resposta inválida do servidor: jobId não encontrado.');
      }

      // 2. Polling do status até completar (máximo 15 minutos)
      const maxAttempts = 90; // 90 x 10s = 15 minutos
      const pollInterval = 10000; // 10 segundos

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(`https://api-chocmaster.falavinhanext.tec.br/api/v1/cigam/sync/status/${jobId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!statusResponse.ok) {
          continue; // Tenta novamente
        }

        const statusData = await statusResponse.json();
        const job = statusData.data;

        if (job?.status === 'completed') {
          const result = job.result;
          const extractionErrors = result?.errors || [];
          if (extractionErrors.length > 0) {
            throw new Error(extractionErrors.join('\n'));
          }

          showAlert(
            'Sincronização CIGAM',
            `A sincronização de ${entityLabel} foi finalizada com sucesso!\n\n• Total encontrado: ${result?.total || 0}\n• Novos registros: ${result?.created || 0}\n• Registros atualizados: ${result?.updated || 0}`,
            'success'
          );

          if (onRefresh) {
            await onRefresh();
          }
          return;
        }

        if (job?.status === 'failed') {
          throw new Error(job.error || `Falha na sincronização de ${entityLabel} do CIGAM.`);
        }
        // status === 'running' → continua polling
      }

      throw new Error(`A sincronização de ${entityLabel} do CIGAM está demorando mais de 15 minutos. Verifique o console do backend.`);
    } catch (error: any) {
      console.error(error);
      showAlert('Erro de Sincronização', error.message || `Ocorreu um erro ao sincronizar ${entityLabel} do CIGAM.`, 'error');
    } finally {
      setIsSyncingCigam(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setActiveTags((prev) => {
      let next = [...prev];
      if (next.includes(tagId)) {
        next = next.filter(id => id !== tagId);
      } else {
        if (tagId === 'unmapped') next = next.filter(id => id !== 'mapped');
        if (tagId === 'mapped') next = next.filter(id => id !== 'unmapped');
        next.push(tagId);
      }
      return next;
    });
  };

  const itemDetails = modalItem as any;

  const hasBlingFilters =
    entity === "produtos"
      ? activeTags.length > 0
      : blingFilter !== "all";

  const hasSeparateSourceSync =
    entity === "formas_pagamento" ||
    entity === "transportadoras" ||
    entity === "produtos";

  const panelClassName = `
    relative
    overflow-hidden
    rounded-[24px]
    border border-slate-200/80
    bg-white/[0.96]
    shadow-[0_20px_50px_-34px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(15,23,42,0.05)]
  `;

  const inputClassName = `
    h-11
    w-full
    rounded-xl
    border border-slate-300
    bg-white/90
    py-2.5 pl-10 pr-4
    text-sm text-slate-900
    shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]
    outline-none
    transition-all duration-200
    placeholder:text-slate-400
    hover:border-slate-400
    focus:border-[#00B0F1]
    focus:bg-white
    focus:ring-4
    focus:ring-[#00B0F1]/15
  `;

  const secondaryButtonClassName = `
    inline-flex h-10
    items-center justify-center gap-2
    rounded-xl
    border border-slate-300
    bg-white
    px-3.5
    text-xs font-semibold
    text-slate-700
    shadow-sm
    transition-all duration-200
    hover:-translate-y-0.5
    hover:border-[#00B0F1]/40
    hover:bg-[#00B0F1]/10
    hover:text-[#008FC7]
    focus:outline-none
    focus:ring-4
    focus:ring-[#00B0F1]/15
    disabled:cursor-not-allowed
    disabled:opacity-50
    disabled:hover:translate-y-0
  `;

  if (loading) {
    return (
      <div
        className="
          flex min-h-80
          flex-col items-center justify-center
          rounded-[24px]
          border border-slate-200/80
          bg-white/95
          px-6 py-12
          shadow-[0_20px_50px_-34px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
        "
      >
        <div
          className="
            h-10 w-10
            animate-spin
            rounded-full
            border-[3px]
            border-[#00B0F1]/20
            border-t-[#00B0F1]
          "
        />

        <p className="mt-4 text-sm font-semibold text-slate-700">
          Carregando dados e mapeamentos
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Aguarde enquanto consultamos Bling e CIGAM.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <header
        className="
          relative
          overflow-hidden
          rounded-2xl
          border border-slate-200/80
          bg-gradient-to-br
          from-white
          to-slate-50
          px-5 py-5
          shadow-[0_14px_35px_-28px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
          sm:px-6
        "
      >
        <div
          aria-hidden="true"
          className="
            absolute -right-16 -top-16
            h-40 w-40
            rounded-full
            bg-[#00B0F1]/10
            blur-3xl
          "
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-2xl
                border border-[#00B0F1]/20
                bg-[#00B0F1]/10
                text-[#008FC7]
                shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]
              "
            >
              <Link2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Mapeamento de {title}
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Associe registros do Bling aos códigos equivalentes
                cadastrados no ERP CIGAM.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="
                    inline-flex items-center gap-1.5
                    rounded-full
                    border border-amber-200
                    bg-amber-50
                    px-2.5 py-1
                    text-[0.65rem] font-bold
                    uppercase tracking-[0.08em]
                    text-amber-700
                  "
                >
                  Bling: {blingData.length}
                </span>

                <span
                  className="
                    inline-flex items-center gap-1.5
                    rounded-full
                    border border-[#00B0F1]/20
                    bg-[#00B0F1]/10
                    px-2.5 py-1
                    text-[0.65rem] font-bold
                    uppercase tracking-[0.08em]
                    text-[#008FC7]
                  "
                >
                  CIGAM: {cigamData.length}
                </span>

                <span
                  className="
                    inline-flex items-center gap-1.5
                    rounded-full
                    border border-emerald-200
                    bg-emerald-50
                    px-2.5 py-1
                    text-[0.65rem] font-bold
                    uppercase tracking-[0.08em]
                    text-emerald-700
                  "
                >
                  Associações: {mappings.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                disabled={syncing || isSyncingCigam || loading}
                className="
                  inline-flex h-10
                  items-center justify-center gap-2
                  rounded-xl
                  border border-slate-950/20
                  bg-gradient-to-b
                  from-slate-700
                  to-slate-950
                  px-4
                  text-xs font-semibold
                  text-white
                  shadow-[0_8px_18px_-10px_rgba(15,23,42,0.90),inset_0_1px_1px_rgba(255,255,255,0.20)]
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:from-slate-600
                  hover:to-slate-900
                  focus:outline-none
                  focus:ring-4
                  focus:ring-slate-500/20
                  disabled:cursor-not-allowed
                  disabled:opacity-55
                  disabled:hover:translate-y-0
                "
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""
                    }`}
                />

                <span>
                  {syncing
                    ? hasSeparateSourceSync
                      ? "Sincronizando Bling..."
                      : "Sincronizando..."
                    : hasSeparateSourceSync
                      ? "Sincronizar Bling"
                      : `Sincronizar ${title}`}
                </span>
              </button>
            )}

            {hasSeparateSourceSync && (
              <button
                type="button"
                onClick={handleSyncCigam}
                disabled={isSyncingCigam || syncing || loading}
                title={`Sincronizar ${title.toLowerCase()} do CIGAM`}
                className="
                  inline-flex h-10
                  items-center justify-center gap-2
                  rounded-xl
                  border border-emerald-600/20
                  bg-gradient-to-b
                  from-emerald-500
                  to-emerald-600
                  px-4
                  text-xs font-semibold
                  text-white
                  shadow-[0_8px_18px_-10px_rgba(5,150,105,0.75),inset_0_1px_1px_rgba(255,255,255,0.25)]
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:from-emerald-400
                  hover:to-emerald-600
                  focus:outline-none
                  focus:ring-4
                  focus:ring-emerald-500/15
                  disabled:cursor-not-allowed
                  disabled:opacity-55
                  disabled:hover:translate-y-0
                "
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isSyncingCigam ? "animate-spin" : ""
                    }`}
                />

                <span>
                  {isSyncingCigam
                    ? "Sincronizando CIGAM..."
                    : "Sincronizar CIGAM"}
                </span>
              </button>
            )}

            {smartMatches.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSmartMatches(true)}
                className="
                  inline-flex h-10
                  items-center justify-center gap-2
                  rounded-xl
                  border border-[#00B0F1]/25
                  bg-[#00B0F1]/10
                  px-4
                  text-xs font-semibold
                  text-[#008FC7]
                  shadow-sm
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-[#00B0F1]/40
                  hover:bg-[#00B0F1]/15
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#00B0F1]/15
                "
              >
                <Sparkles className="h-3.5 w-3.5" />

                <span>
                  Sugestões inteligentes ({smartMatches.length})
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Console de sincronização */}
      {((logs && logs.length > 0) || syncing) && (
        <section
          className="
            overflow-hidden
            rounded-2xl
            border border-slate-800
            bg-slate-950
            shadow-[0_18px_45px_-28px_rgba(2,6,23,0.85),inset_0_2px_10px_rgba(0,0,0,0.40)]
          "
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <span className="ml-2 font-mono text-[0.68rem] text-slate-500">
                bling-sync-console.sh
              </span>
            </div>

            {syncing && (
              <span
                className="
                  inline-flex items-center gap-2
                  text-[0.65rem] font-semibold
                  uppercase tracking-[0.1em]
                  text-cyan-400
                "
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                Sincronizando
              </span>
            )}
          </div>

          <div className="h-52 overflow-y-auto p-4 font-mono text-xs">
            <div className="space-y-1.5">
              {logs?.map((log, index) => {
                let colorClass = "text-slate-300";

                if (
                  log.startsWith("Erro") ||
                  log.includes("Erro") ||
                  log.startsWith("[ERRO]")
                ) {
                  colorClass = "text-red-400";
                } else if (
                  log.includes("sucesso") ||
                  log.includes("finalizada") ||
                  log.includes("finalizado") ||
                  log.includes("completa finalizada")
                ) {
                  colorClass = "text-emerald-400";
                } else if (
                  log.startsWith("[PRODUTO]") ||
                  log.startsWith("[CLIENTE]") ||
                  log.startsWith("[FORMA PAGAMENTO]") ||
                  log.startsWith("[TRANSPORTADORA]")
                ) {
                  colorClass = "text-cyan-300";
                }

                return (
                  <div
                    key={`${index}-${log}`}
                    className={`flex items-start gap-3 leading-relaxed ${colorClass}`}
                  >
                    <span className="shrink-0 select-none text-slate-600">
                      {String(index + 1).padStart(3, "0")}
                    </span>

                    <span className="break-all">{log}</span>
                  </div>
                );
              })}

              {syncing && (
                <div className="flex items-center gap-3 text-cyan-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                  Aguardando próximo evento...
                </div>
              )}

              <div id="console-bottom" />
            </div>
          </div>
        </section>
      )}

      {/* Modal de sugestões inteligentes - renderizado via portal */}
      {showSmartMatches &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            className="
              flex max-h-[88vh] w-full max-w-5xl
              flex-col overflow-hidden
              rounded-[28px]
              border border-white/70
              bg-white
              shadow-[0_35px_100px_-30px_rgba(2,6,23,0.85)]
            "
          >
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex h-11 w-11 shrink-0
                    items-center justify-center
                    rounded-2xl
                    border border-[#00B0F1]/20
                    bg-[#00B0F1]/10
                    text-[#008FC7]
                  "
                >
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Sugestões de associação inteligente
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Avalie a similaridade encontrada e associe os
                    registros individualmente ou em massa.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {smartMatches.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllSuggestions}
                    disabled={isBulkSaving}
                    className={secondaryButtonClassName}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedSuggestions.size ===
                        smartMatches.length &&
                        smartMatches.length > 0
                      }
                      onChange={() => undefined}
                      tabIndex={-1}
                      className="
                        h-4 w-4
                        rounded
                        border-slate-300
                        text-[#00B0F1]
                        focus:ring-[#00B0F1]
                      "
                    />

                    <span>
                      {selectedSuggestions.size === smartMatches.length
                        ? "Desmarcar todos"
                        : "Selecionar todos"}
                    </span>
                  </button>
                )}

                {selectedSuggestions.size > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkAssociate}
                    disabled={isBulkSaving}
                    className="
                      inline-flex h-10
                      items-center justify-center gap-2
                      rounded-xl
                      border border-[#008FC7]/20
                      bg-gradient-to-b
                      from-[#00B0F1]
                      to-[#008FC7]
                      px-4
                      text-xs font-semibold
                      text-white
                      shadow-[0_8px_18px_-10px_rgba(0,143,199,0.75),inset_0_1px_1px_rgba(255,255,255,0.30)]
                      transition-all duration-200
                      hover:-translate-y-0.5
                      focus:outline-none
                      focus:ring-4
                      focus:ring-[#00B0F1]/20
                      disabled:cursor-not-allowed
                      disabled:opacity-55
                    "
                  >
                    <Link2 className="h-3.5 w-3.5" />

                    <span>
                      {isBulkSaving
                        ? "Associando..."
                        : `Associar selecionados (${selectedSuggestions.size})`}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowSmartMatches(false)}
                  disabled={isBulkSaving}
                  aria-label="Fechar sugestões inteligentes"
                  className="
                    inline-flex h-10 w-10
                    items-center justify-center
                    rounded-xl
                    border border-slate-200
                    bg-white
                    text-slate-500
                    shadow-sm
                    transition
                    hover:border-red-200
                    hover:bg-red-50
                    hover:text-red-500
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
              {smartMatches.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <div
                    className="
                      flex h-14 w-14
                      items-center justify-center
                      rounded-2xl
                      border border-slate-200
                      bg-white
                      text-slate-400
                      shadow-sm
                    "
                  >
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    Nenhuma sugestão encontrada
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Não existem novos registros com similaridade
                    suficiente para associação automática.
                  </p>
                </div>
              ) : (
                smartMatches.map((match) => {
                  const isChecked = selectedSuggestions.has(
                    match.bling.id,
                  );

                  return (
                    <article
                      key={`${match.bling.id}-${match.cigam.id}`}
                      className={`
                        rounded-2xl
                        border
                        p-4
                        transition-all duration-200
                        ${isChecked
                          ? `
                              border-[#00B0F1]/40
                              bg-[#00B0F1]/[0.06]
                              shadow-[0_12px_28px_-24px_rgba(0,176,241,0.70)]
                            `
                          : `
                              border-slate-200
                              bg-white
                              hover:border-slate-300
                              hover:shadow-[0_12px_28px_-25px_rgba(2,6,23,0.45)]
                            `
                        }
                      `}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isBulkSaving}
                            onChange={() =>
                              toggleSuggestionSelection(
                                match.bling.id,
                              )
                            }
                            aria-label={`Selecionar sugestão ${match.bling.name}`}
                            className="
                              mt-1 h-4 w-4 shrink-0
                              rounded
                              border-slate-300
                              text-[#00B0F1]
                              focus:ring-[#00B0F1]
                            "
                          />

                          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                            <div className="min-w-0 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                              <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-amber-700">
                                Bling
                              </span>

                              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                                {match.bling.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                ID: {match.bling.id}
                                {match.bling.codigo &&
                                  ` • SKU: ${match.bling.codigo}`}
                              </p>
                            </div>

                            <ArrowRight className="hidden h-4 w-4 text-slate-300 lg:block" />

                            <div className="min-w-0 rounded-xl border border-[#00B0F1]/20 bg-[#00B0F1]/[0.06] p-3">
                              <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#008FC7]">
                                CIGAM
                              </span>

                              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                                {match.cigam.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Código: {match.cigam.id}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 pt-3 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
                          <span
                            className={`
                              inline-flex
                              rounded-full
                              border
                              px-2.5 py-1
                              text-[0.65rem] font-bold
                              ${match.score >= 80
                                ? `
                                    border-emerald-200
                                    bg-emerald-50
                                    text-emerald-700
                                  `
                                : `
                                    border-sky-200
                                    bg-sky-50
                                    text-sky-700
                                  `
                              }
                            `}
                          >
                            {match.score}% compatível
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleApplySuggestion(
                                match.bling.id,
                                match.cigam.id,
                                match.bling.name,
                              )
                            }
                            disabled={isSaving}
                            className="
                              inline-flex h-9
                              items-center justify-center gap-2
                              rounded-xl
                              bg-slate-900
                              px-3.5
                              text-xs font-semibold
                              text-white
                              shadow-sm
                              transition
                              hover:-translate-y-0.5
                              hover:bg-slate-800
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            <Link2 className="h-3.5 w-3.5" />

                            <span>
                              {isSaving ? "Salvando..." : "Aceitar"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => setShowSmartMatches(false)}
                disabled={isBulkSaving}
                className={secondaryButtonClassName}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
          document.body,
        )}

      {/* Painéis Bling e CIGAM */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Bling */}
        <section className={`${panelClassName} flex h-[620px] flex-col`}>
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute inset-[5px]
              rounded-[18px]
              border border-white
            "
          />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <div className="border-b border-slate-200/80 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />

                    <h3 className="text-base font-bold text-slate-900">
                      Tabela Bling
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {filteredBlingData.length} registros encontrados
                  </p>
                </div>

                <span
                  className="
                    rounded-full
                    border border-amber-200
                    bg-amber-50
                    px-2.5 py-1
                    text-[0.65rem] font-bold
                    uppercase tracking-wider
                    text-amber-700
                  "
                >
                  Origem
                </span>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    placeholder="Buscar no Bling por nome, ID ou código"
                    value={searchBling}
                    onChange={(event) =>
                      setSearchBling(event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                {(entity === "produtos" ||
                  entity === "formas_pagamento") && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowFilters((current) => !current)
                      }
                      title={
                        showFilters
                          ? "Ocultar filtros"
                          : "Mostrar filtros"
                      }
                      className={`
                      ${secondaryButtonClassName}
                      shrink-0
                      ${showFilters
                          ? `
                            border-[#00B0F1]/35
                            bg-[#00B0F1]/10
                            text-[#008FC7]
                          `
                          : hasBlingFilters
                            ? `
                              border-amber-300
                              bg-amber-50
                              text-amber-700
                            `
                            : ""
                        }
                    `}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />

                      <span>
                        {showFilters ? "Ocultar" : "Filtros"}
                      </span>

                      {hasBlingFilters && (
                        <span
                          className="
                          rounded-full
                          bg-white/80
                          px-1.5 py-0.5
                          text-[0.6rem]
                        "
                        >
                          {entity === "produtos"
                            ? activeTags.length
                            : 1}
                        </span>
                      )}
                    </button>
                  )}

                {entity === "produtos" && (
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={isExporting}
                    title="Exportar produtos para ESMATERI"
                    className="
                      inline-flex h-10 shrink-0
                      items-center justify-center gap-2
                      rounded-xl
                      border border-emerald-600/20
                      bg-emerald-600
                      px-3.5
                      text-xs font-semibold
                      text-white
                      shadow-sm
                      transition
                      hover:-translate-y-0.5
                      hover:bg-emerald-500
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Download className="h-3.5 w-3.5" />

                    <span>
                      {isExporting
                        ? "Exportando..."
                        : "ESMATERI"}
                    </span>
                  </button>
                )}

                {entity === "formas_pagamento" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleExportPaymentMethods(
                        "bling",
                        blingFilter,
                      )
                    }
                    disabled={exportingPaymentSource !== null}
                    title="Exportar formas de pagamento do Bling"
                    className="
                      inline-flex h-10 shrink-0
                      items-center justify-center gap-2
                      rounded-xl
                      border border-emerald-600/20
                      bg-emerald-600
                      px-3.5
                      text-xs font-semibold
                      text-white
                      shadow-sm
                      transition
                      hover:-translate-y-0.5
                      hover:bg-emerald-500
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Download className="h-3.5 w-3.5" />

                    <span>
                      {exportingPaymentSource === "bling"
                        ? "Exportando..."
                        : "Excel"}
                    </span>
                  </button>
                )}
              </div>

              {entity === "produtos" && showFilters && (
                <div className="mb-4 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
                  {[
                    {
                      id: "unmapped",
                      label: "Não associados",
                      count: tagCounts.unmapped,
                    },
                    {
                      id: "mapped",
                      label: "Associados",
                      count: tagCounts.mapped,
                    },
                    {
                      id: "valid_sku",
                      label: "SKU padrão",
                      count: tagCounts.validSku,
                    },
                    {
                      id: "has_ncm",
                      label: "Possui NCM",
                      count: tagCounts.hasNcm,
                    },
                  ].map((tag) => {
                    const isActive = activeTags.includes(tag.id);

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`
                          inline-flex items-center gap-1.5
                          rounded-full
                          border
                          px-2.5 py-1
                          text-[0.68rem] font-semibold
                          transition
                          ${isActive
                            ? `
                                border-[#00B0F1]/40
                                bg-[#00B0F1]/10
                                text-[#008FC7]
                              `
                            : `
                                border-slate-200
                                bg-white
                                text-slate-500
                                hover:border-slate-300
                                hover:text-slate-800
                              `
                          }
                        `}
                      >
                        <span>{tag.label}</span>

                        <span
                          className={`
                            rounded-full
                            px-1.5 py-0.5
                            text-[0.58rem]
                            ${isActive
                              ? "bg-[#00B0F1]/10"
                              : "bg-slate-100"
                            }
                          `}
                        >
                          {tag.count ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {entity === "formas_pagamento" &&
                showFilters && (
                  <div className="mb-4 flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
                    {[
                      {
                        id: "all",
                        label: "Todos",
                        count: blingCounts.all,
                      },
                      {
                        id: "unmapped",
                        label: "Não associados",
                        count: blingCounts.unmapped,
                      },
                      {
                        id: "mapped",
                        label: "Associados",
                        count: blingCounts.mapped,
                      },
                    ].map((tag) => {
                      const isActive =
                        blingFilter === tag.id;

                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() =>
                            setBlingFilter(
                              tag.id as
                              | "all"
                              | "mapped"
                              | "unmapped",
                            )
                          }
                          className={`
                            inline-flex items-center gap-1.5
                            rounded-full
                            border
                            px-2.5 py-1
                            text-[0.68rem] font-semibold
                            transition
                            ${isActive
                              ? `
                                  border-[#00B0F1]/40
                                  bg-[#00B0F1]/10
                                  text-[#008FC7]
                                `
                              : `
                                  border-slate-200
                                  bg-white
                                  text-slate-500
                                  hover:border-slate-300
                                  hover:text-slate-800
                                `
                            }
                          `}
                        >
                          <span>{tag.label}</span>

                          <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[0.58rem]">
                            {tag.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {displayedBlingData.map((item) => {
                  const isMapped = mappedBlingIds.has(item.id);
                  const isSelected =
                    selectedBlingId === item.id;

                  return (
                    <article
                      key={item.id}
                      onClick={() => {
                        if (!isMapped) {
                          setSelectedBlingId(item.id);
                        }
                      }}
                      className={`
                        rounded-xl
                        border
                        p-3
                        text-left
                        transition-all duration-200
                        ${isMapped
                          ? `
                              cursor-not-allowed
                              border-slate-200
                              bg-slate-50
                              opacity-70
                            `
                          : isSelected
                            ? `
                                cursor-pointer
                                border-[#00B0F1]/50
                                bg-[#00B0F1]/[0.07]
                                shadow-[0_10px_22px_-20px_rgba(0,176,241,0.75)]
                              `
                            : `
                                cursor-pointer
                                border-slate-200
                                bg-white
                                hover:-translate-y-0.5
                                hover:border-slate-300
                                hover:shadow-[0_10px_22px_-20px_rgba(2,6,23,0.50)]
                              `
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.name}
                            {item.unidade_negocio && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-[#00B0F1]/10 px-1.5 py-0.5 text-[0.6rem] font-bold text-[#008FC7]">
                                {item.unidade_negocio}
                              </span>
                            )}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            ID: {item.id}
                            {item.codigo &&
                              ` • Cód: ${item.codigo}`}
                            {item.ncm && ` • NCM: ${item.ncm}`}
                            {item.temVariacoes &&
                              " • Possui variações"}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setModalItem(item);
                              setModalSource("bling");
                            }}
                            aria-label={`Ver detalhes de ${item.name}`}
                            className="
                              inline-flex h-8 w-8
                              items-center justify-center
                              rounded-lg
                              border border-slate-200
                              bg-white
                              text-slate-400
                              shadow-sm
                              transition
                              hover:border-[#00B0F1]/30
                              hover:bg-[#00B0F1]/10
                              hover:text-[#008FC7]
                            "
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"
                              />
                            </svg>
                          </button>

                          {isMapped ? (
                            <span
                              className="
                                inline-flex items-center gap-1
                                rounded-full
                                border border-emerald-200
                                bg-emerald-50
                                px-2 py-1
                                text-[0.62rem] font-semibold
                                text-emerald-700
                              "
                            >
                              <CheckCircle className="h-3 w-3" />

                              <span className="max-w-24 truncate">
                                {blingToCigamMap.get(item.id)}
                              </span>
                            </span>
                          ) : (
                            <span
                              className="
                                inline-flex items-center gap-1
                                rounded-full
                                border border-amber-200
                                bg-amber-50
                                px-2 py-1
                                text-[0.62rem] font-semibold
                                text-amber-700
                              "
                            >
                              <AlertCircle className="h-3 w-3" />
                              Não associado
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}

                {filteredBlingData.length >
                  visibleBlingCount && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleBlingCount(
                          (current) => current + 25,
                        )
                      }
                      className="
                      flex w-full
                      items-center justify-center gap-2
                      rounded-xl
                      border border-slate-200
                      bg-slate-50
                      py-2.5
                      text-xs font-semibold
                      text-slate-600
                      transition
                      hover:border-[#00B0F1]/30
                      hover:bg-[#00B0F1]/10
                      hover:text-[#008FC7]
                    "
                    >
                      <ChevronDown className="h-3.5 w-3.5" />

                      <span>
                        Ver mais (
                        {filteredBlingData.length -
                          visibleBlingCount}{" "}
                        restantes)
                      </span>
                    </button>
                  )}

                {filteredBlingData.length === 0 && (
                  <div className="flex min-h-48 flex-col items-center justify-center text-center">
                    <Search className="h-7 w-7 text-slate-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      Nenhum registro encontrado
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Ajuste a pesquisa ou os filtros selecionados.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CIGAM */}
        <section className={`${panelClassName} flex h-[620px] flex-col`}>
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute inset-[5px]
              rounded-[18px]
              border border-white
            "
          />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <div className="border-b border-slate-200/80 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#00B0F1]" />

                    <h3 className="text-base font-bold text-slate-900">
                      Tabela CIGAM
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {filteredCigamData.length} registros encontrados
                  </p>
                </div>

                <span
                  className="
                    rounded-full
                    border border-[#00B0F1]/20
                    bg-[#00B0F1]/10
                    px-2.5 py-1
                    text-[0.65rem] font-bold
                    uppercase tracking-wider
                    text-[#008FC7]
                  "
                >
                  Destino
                </span>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    placeholder="Buscar no CIGAM por nome ou código"
                    value={searchCigam}
                    onChange={(event) =>
                      setSearchCigam(event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                {entity === "formas_pagamento" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleExportPaymentMethods(
                        "cigam",
                        cigamFilter,
                      )
                    }
                    disabled={exportingPaymentSource !== null}
                    title="Exportar formas de pagamento do CIGAM"
                    className="
                      inline-flex h-10 shrink-0
                      items-center justify-center gap-2
                      rounded-xl
                      border border-emerald-600/20
                      bg-emerald-600
                      px-3.5
                      text-xs font-semibold
                      text-white
                      shadow-sm
                      transition
                      hover:-translate-y-0.5
                      hover:bg-emerald-500
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Download className="h-3.5 w-3.5" />

                    <span>
                      {exportingPaymentSource === "cigam"
                        ? "Exportando..."
                        : "Excel"}
                    </span>
                  </button>
                )}
              </div>

              {(entity === "produtos" ||
                entity === "formas_pagamento") && (
                  <div className="mb-4 flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
                    {[
                      {
                        id: "all",
                        label: "Todos",
                        count: cigamCounts.all,
                      },
                      {
                        id: "unmapped",
                        label: "Não associados",
                        count: cigamCounts.unmapped,
                      },
                      {
                        id: "mapped",
                        label: "Associados",
                        count: cigamCounts.mapped,
                      },
                    ].map((tag) => {
                      const isActive =
                        cigamFilter === tag.id;

                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() =>
                            setCigamFilter(
                              tag.id as
                              | "all"
                              | "mapped"
                              | "unmapped",
                            )
                          }
                          className={`
                          inline-flex items-center gap-1.5
                          rounded-full
                          border
                          px-2.5 py-1
                          text-[0.68rem] font-semibold
                          transition
                          ${isActive
                              ? `
                                border-[#00B0F1]/40
                                bg-[#00B0F1]/10
                                text-[#008FC7]
                              `
                              : `
                                border-slate-200
                                bg-white
                                text-slate-500
                                hover:border-slate-300
                                hover:text-slate-800
                              `
                            }
                        `}
                        >
                          <span>{tag.label}</span>

                          <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[0.58rem]">
                            {tag.count ?? 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {displayedCigamData.map((item) => {
                  const isSelected =
                    selectedCigamId === item.id;

                  const associatedBlingItems =
                    cigamToBlingMap.get(item.id);

                  const isMapped =
                    associatedBlingItems &&
                    associatedBlingItems.length > 0;

                  return (
                    <article
                      key={item.id}
                      onClick={() =>
                        setSelectedCigamId(item.id)
                      }
                      className={`
                        cursor-pointer
                        rounded-xl
                        border
                        p-3
                        text-left
                        transition-all duration-200
                        ${isSelected
                          ? `
                              border-[#00B0F1]/50
                              bg-[#00B0F1]/[0.07]
                              shadow-[0_10px_22px_-20px_rgba(0,176,241,0.75)]
                            `
                          : `
                              border-slate-200
                              bg-white
                              hover:-translate-y-0.5
                              hover:border-slate-300
                              hover:shadow-[0_10px_22px_-20px_rgba(2,6,23,0.50)]
                            `
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                              {item.name}
                            </p>

                            {isMapped && (
                              <span
                                title={`Associado a: ${associatedBlingItems
                                  .map(
                                    (blingItem) =>
                                      `${blingItem.name} (ID: ${blingItem.id})`,
                                  )
                                  .join(", ")}`}
                                className="
                                  inline-flex shrink-0
                                  items-center gap-1
                                  rounded-full
                                  border border-emerald-200
                                  bg-emerald-50
                                  px-2 py-1
                                  text-[0.62rem] font-semibold
                                  text-emerald-700
                                "
                              >
                                <CheckCircle className="h-3 w-3" />
                                Associado
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            Código CIGAM: {item.id}
                            {item.extra &&
                              ` • Documento: ${item.extra}`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setModalItem(item);
                            setModalSource("cigam");
                          }}
                          aria-label={`Ver detalhes de ${item.name}`}
                          className="
                            inline-flex h-8 w-8 shrink-0
                            items-center justify-center
                            rounded-lg
                            border border-slate-200
                            bg-white
                            text-slate-400
                            shadow-sm
                            transition
                            hover:border-[#00B0F1]/30
                            hover:bg-[#00B0F1]/10
                            hover:text-[#008FC7]
                          "
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"
                            />
                          </svg>
                        </button>
                      </div>
                    </article>
                  );
                })}

                {filteredCigamData.length >
                  visibleCigamCount && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCigamCount(
                          (current) => current + 25,
                        )
                      }
                      className="
                      flex w-full
                      items-center justify-center gap-2
                      rounded-xl
                      border border-slate-200
                      bg-slate-50
                      py-2.5
                      text-xs font-semibold
                      text-slate-600
                      transition
                      hover:border-[#00B0F1]/30
                      hover:bg-[#00B0F1]/10
                      hover:text-[#008FC7]
                    "
                    >
                      <ChevronDown className="h-3.5 w-3.5" />

                      <span>
                        Ver mais (
                        {filteredCigamData.length -
                          visibleCigamCount}{" "}
                        restantes)
                      </span>
                    </button>
                  )}

                {filteredCigamData.length === 0 && (
                  <div className="flex min-h-48 flex-col items-center justify-center text-center">
                    <Search className="h-7 w-7 text-slate-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      Nenhum registro encontrado
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Ajuste a pesquisa ou os filtros selecionados.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Confirmação De-Para */}
      <section
        id="linking-panel"
        className="
          relative
          overflow-hidden
          rounded-[24px]
          border border-slate-200/80
          bg-gradient-to-br
          from-white
          to-slate-50
          p-5
          shadow-[0_20px_50px_-34px_rgba(2,6,23,0.70),inset_0_1px_1px_rgba(255,255,255,0.95)]
          sm:p-6
        "
      >
        <div
          aria-hidden="true"
          className="
            absolute -bottom-16 -right-16
            h-40 w-40
            rounded-full
            bg-[#00B0F1]/10
            blur-3xl
          "
        />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div
              className={`
                min-w-0
                rounded-2xl
                border
                p-4
                ${selectedBlingItem
                  ? `
                      border-amber-200
                      bg-amber-50/70
                    `
                  : `
                      border-slate-200
                      bg-white/80
                    `
                }
              `}
            >
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-amber-700">
                Selecionado no Bling
              </span>

              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                {selectedBlingItem
                  ? selectedBlingItem.name
                  : "Nenhum item selecionado"}
              </p>

              <p className="mt-1 truncate text-xs text-slate-500">
                {selectedBlingItem
                  ? `ID: ${selectedBlingItem.id}`
                  : "Selecione um registro na tabela Bling"}
              </p>
            </div>

            <div
              className="
                mx-auto flex h-9 w-9
                items-center justify-center
                rounded-full
                border border-slate-200
                bg-white
                text-slate-400
                shadow-sm
              "
            >
              <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" />
            </div>

            <div
              className={`
                min-w-0
                rounded-2xl
                border
                p-4
                ${selectedCigamItem
                  ? `
                      border-[#00B0F1]/25
                      bg-[#00B0F1]/[0.06]
                    `
                  : `
                      border-slate-200
                      bg-white/80
                    `
                }
              `}
            >
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#008FC7]">
                Selecionado no CIGAM
              </span>

              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                {selectedCigamItem
                  ? selectedCigamItem.name
                  : "Nenhum item selecionado"}
              </p>

              <p className="mt-1 truncate text-xs text-slate-500">
                {selectedCigamItem
                  ? `Código: ${selectedCigamItem.id}`
                  : "Selecione um registro na tabela CIGAM"}
              </p>
            </div>
          </div>
          <div className='flex justify-center items-center gap-4 px-4'>
            <img
              src={logoBling}
              alt="Logo Bling"
              className="h-9 w-auto object-contain"
            />

            <img
              src={logoCigam}
              alt="Logo ERP CIGAM"
              className="h-9 w-auto object-contain"
            />
          </div>

          <button
            type="button"
            onClick={handleLink}
            disabled={
              !selectedBlingId ||
              !selectedCigamId ||
              isSaving
            }
            className="
              inline-flex min-h-12
              w-full shrink-0
              items-center justify-center gap-2
              rounded-xl
              border border-slate-950/20
              bg-gradient-to-b
              from-slate-700
              to-slate-950
              px-6
              text-sm font-semibold
              text-white
              shadow-[0_10px_22px_-12px_rgba(15,23,42,0.85),inset_0_1px_1px_rgba(255,255,255,0.22)]
              transition-all duration-200
              hover:-translate-y-0.5
              hover:from-slate-600
              hover:to-slate-900
              focus:outline-none
              focus:ring-4
              focus:ring-[#00B0F1]/20
              disabled:cursor-not-allowed
              disabled:opacity-45
              disabled:hover:translate-y-0
              xl:w-auto
            "
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                Salvando...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Salvar associação
              </>
            )}
          </button>
        </div>
      </section>

      {/* Modal de detalhes - renderizado via portal */}
      {modalItem && modalSource &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            role="button"
            tabIndex={0}
            aria-label="Fechar detalhes"
            className="absolute inset-0"
            onClick={() => {
              setModalItem(null);
              setModalSource(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setModalItem(null);
                setModalSource(null);
              }
            }}
          />

          <div
            className="
              relative
              flex max-h-[85vh] w-full max-w-2xl
              flex-col overflow-hidden
              rounded-[28px]
              border border-white/70
              bg-white
              shadow-[0_35px_100px_-30px_rgba(2,6,23,0.85)]
            "
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="min-w-0">
                <span
                  className={`
                    inline-flex
                    rounded-full
                    border
                    px-2.5 py-1
                    text-[0.62rem] font-bold
                    uppercase tracking-[0.1em]
                    ${modalSource === "bling"
                      ? `
                          border-amber-200
                          bg-amber-50
                          text-amber-700
                        `
                      : `
                          border-[#00B0F1]/20
                          bg-[#00B0F1]/10
                          text-[#008FC7]
                        `
                    }
                  `}
                >
                  {modalSource === "bling"
                    ? "Bling"
                    : "CIGAM"}
                </span>

                <h3 className="mt-3 truncate text-xl font-bold tracking-tight text-slate-900">
                  {itemDetails.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalItem(null);
                  setModalSource(null);
                }}
                aria-label="Fechar detalhes"
                className="
                  inline-flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl
                  border border-slate-200
                  bg-white
                  text-slate-500
                  shadow-sm
                  transition
                  hover:border-red-200
                  hover:bg-red-50
                  hover:text-red-500
                "
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/60 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                    ID
                  </span>

                  <p className="mt-1 break-all font-mono text-sm text-slate-800">
                    {itemDetails.id}
                  </p>
                </div>

                {itemDetails.codigo && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Código
                    </span>

                    <p className="mt-1 break-all font-mono text-sm text-slate-800">
                      {itemDetails.codigo}
                    </p>
                  </div>
                )}

                {itemDetails.preco !== undefined &&
                  itemDetails.preco !== null && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-emerald-600">
                        Preço
                      </span>

                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(
                          Number(itemDetails.preco),
                        )}
                      </p>
                    </div>
                  )}

                {itemDetails.tipo && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Tipo
                    </span>

                    <p className="mt-1 text-sm text-slate-800">
                      {itemDetails.tipo}
                    </p>
                  </div>
                )}

                {itemDetails.situacao && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Situação
                    </span>

                    <p className="mt-1 text-sm text-slate-800">
                      {itemDetails.situacao}
                    </p>
                  </div>
                )}

                {itemDetails.formato && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Formato
                    </span>

                    <p className="mt-1 text-sm text-slate-800">
                      {itemDetails.formato}
                    </p>
                  </div>
                )}

                {itemDetails.unidade && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Unidade
                    </span>

                    <p className="mt-1 text-sm text-slate-800">
                      {itemDetails.unidade}
                    </p>
                  </div>
                )}

                {itemDetails.tipoProduto && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Tipo do produto
                    </span>

                    <p className="mt-1 text-sm text-slate-800">
                      {itemDetails.tipoProduto}
                    </p>
                  </div>
                )}

                {itemDetails.condicao !== undefined &&
                  itemDetails.condicao !== null && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Condição
                      </span>

                      <p className="mt-1 text-sm text-slate-800">
                        {itemDetails.condicao === 0
                          ? "Novo"
                          : itemDetails.condicao === 1
                            ? "Usado"
                            : `Código ${itemDetails.condicao}`}
                      </p>
                    </div>
                  )}

                {itemDetails.marca && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Marca
                    </span>

                    <p className="mt-1 text-sm text-slate-800">
                      {itemDetails.marca}
                    </p>
                  </div>
                )}

                {itemDetails.ncm && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      NCM
                    </span>

                    <p className="mt-1 font-mono text-sm text-slate-800">
                      {itemDetails.ncm}
                    </p>
                  </div>
                )}

                {itemDetails.quantidade_estoque !==
                  undefined &&
                  itemDetails.quantidade_estoque !== null && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Estoque
                      </span>

                      <p className="mt-1 text-sm text-slate-800">
                        {itemDetails.quantidade_estoque} unidades
                      </p>
                    </div>
                  )}

                {itemDetails.temVariacoes !== undefined &&
                  itemDetails.temVariacoes !== null && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Variações
                      </span>

                      <p className="mt-1 text-sm text-slate-800">
                        {itemDetails.temVariacoes
                          ? "Sim"
                          : "Não"}
                      </p>
                    </div>
                  )}

                {itemDetails.ativo !== undefined &&
                  itemDetails.ativo !== null && (
                    <div
                      className={`
                        rounded-xl
                        border
                        p-3.5
                        ${itemDetails.ativo
                          ? `
                              border-emerald-200
                              bg-emerald-50/70
                            `
                          : `
                              border-red-200
                              bg-red-50/70
                            `
                        }
                      `}
                    >
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Status
                      </span>

                      <p
                        className={`mt-1 text-sm font-semibold ${itemDetails.ativo
                            ? "text-emerald-700"
                            : "text-red-600"
                          }`}
                      >
                        {itemDetails.ativo
                          ? "Ativo"
                          : "Inativo"}
                      </p>
                    </div>
                  )}

                {itemDetails.fornecedor_nome && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Fornecedor
                    </span>

                    <p className="mt-1 text-sm text-slate-800">
                      {itemDetails.fornecedor_nome}
                    </p>

                    {itemDetails.fornecedor_codigo && (
                      <p className="mt-1 text-xs text-slate-500">
                        Código:{" "}
                        {itemDetails.fornecedor_codigo}
                      </p>
                    )}

                    {itemDetails.fornecedor_precoCusto !==
                      undefined &&
                      itemDetails.fornecedor_precoCusto !==
                      null && (
                        <p className="mt-1 text-xs text-slate-500">
                          Custo:{" "}
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(
                            Number(
                              itemDetails.fornecedor_precoCusto,
                            ),
                          )}
                        </p>
                      )}
                  </div>
                )}

                {itemDetails.extra && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Documento
                    </span>

                    <p className="mt-1 break-all font-mono text-sm text-slate-800">
                      {itemDetails.extra}
                    </p>
                  </div>
                )}
              </div>

              {itemDetails.descricaoCurta && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Descrição
                  </span>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {itemDetails.descricaoCurta}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4">
              <p className="text-center text-xs text-slate-400">
                {modalSource === "bling"
                  ? "Dados recebidos do Bling"
                  : "Dados recebidos do CIGAM"}{" "}
                • Última atualização via API
              </p>
            </div>
          </div>
        </div>,
          document.body,
        )}

      {/* Toast de alerta */}
      {alertConfig?.show && (
        <div className="fixed right-4 top-4 z-[100] w-full max-w-sm animate-slideIn">
          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              bg-white
              p-4
              shadow-[0_20px_60px_-15px_rgba(2,6,23,0.45)]
              ${alertConfig.type === 'success'
                ? 'border-emerald-200'
                : alertConfig.type === 'error'
                  ? 'border-red-200'
                  : 'border-[#00B0F1]/30'
              }
            "
          >
            <div className="flex items-start gap-3">
              <div
                className={`
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl
                  border
                  ${alertConfig.type === "success"
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : alertConfig.type === "error"
                      ? 'border-red-200 bg-red-50 text-red-500'
                      : 'border-[#00B0F1]/20 bg-[#00B0F1]/10 text-[#008FC7]'
                  }
                `}
              >
                {alertConfig.type === "success" && <CheckCircle className="h-5 w-5" />}
                {alertConfig.type === "error" && <AlertCircle className="h-5 w-5" />}
                {alertConfig.type === "info" && <Sparkles className="h-5 w-5" />}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {alertConfig.title}
                </h3>
                <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-500">
                  {alertConfig.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAlertConfig(null)}
                className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};