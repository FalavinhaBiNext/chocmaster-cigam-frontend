import React, { useState, useMemo, useEffect } from 'react';
import { calculateSimilarity, calculateCodeSimilarity } from '../utils/similarity';
import { CheckCircle, AlertCircle, ArrowRight, Search, Link2, Sparkles, ChevronDown, RefreshCw, SlidersHorizontal, Download } from 'lucide-react';

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
  onDeleteMapping?: (idBling: string) => Promise<void>;
  loading: boolean;
  onSync?: () => Promise<void>;
  syncing?: boolean;
  logs?: string[];
  onRefresh?: () => Promise<void>;
}

export const DeParaSection: React.FC<DeParaSectionProps> = ({
  entity,
  title,
  blingData,
  cigamData,
  mappings,
  onSaveMapping,
  onDeleteMapping,
  loading,
  onSync,
  syncing,
  logs,
  onRefresh,
}) => {
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
  const [mappingsPage, setMappingsPage] = useState(1);
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
    setMappingsPage(1);
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

  const itemsPerPage = 40;
  const totalMappingsPages = Math.ceil(mappings.length / itemsPerPage);

  const displayedMappings = useMemo(() => {
    const start = (mappingsPage - 1) * itemsPerPage;
    return mappings.slice(start, start + itemsPerPage);
  }, [mappings, mappingsPage]);
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
      unmapped: 0, mapped: 0, hasNcm: 0, noNcm: 0, hasPrice: 0, noPrice: 0, hasStock: 0, noStock: 0, formatS: 0, formatE: 0, formatV: 0, validSku: 0
    };

    let unmappedCount = 0;
    let mappedCount = 0;
    let hasNcm = 0;
    let noNcm = 0;
    let hasPrice = 0;
    let noPrice = 0;
    let hasStock = 0;
    let noStock = 0;
    let formatS = 0;
    let formatE = 0;
    let formatV = 0;
    let validSku = 0;

    blingData.forEach(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchBling.toLowerCase()) || 
                            item.id.includes(searchBling) ||
                            (item.codigo && item.codigo.toLowerCase().includes(searchBling.toLowerCase()));
      const isUnmapped = !mappedBlingIds.has(item.id);

      if (matchesSearch) {
        if (isUnmapped) unmappedCount++;
        else mappedCount++;

        if (item.ncm && item.ncm.trim() !== '') hasNcm++;
        else noNcm++;

        if (item.preco && item.preco > 0) hasPrice++;
        else noPrice++;

        if (item.quantidade_estoque && item.quantidade_estoque > 0) hasStock++;
        else noStock++;

        if (item.formato === 'S') formatS++;
        else if (item.formato === 'E') formatE++;
        else if (item.formato === 'V') formatV++;

        const isStandardSku = item.codigo ? /^\d{4}[a-zA-Z0-9]{0,2}$/.test(item.codigo) : false;
        if (isStandardSku) validSku++;
      }
    });

    return { 
      unmapped: unmappedCount, 
      mapped: mappedCount, 
      hasNcm, 
      noNcm, 
      hasPrice, 
      noPrice, 
      hasStock, 
      noStock, 
      formatS, 
      formatE, 
      formatV,
      validSku
    };
  }, [blingData, entity, searchBling, mappedBlingIds]);

  // Filtering Bling Items
  const filteredBlingData = useMemo(() => {
    return blingData.filter((item) => {
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
          if (tag === 'no_ncm' && item.ncm && item.ncm.trim() !== '') return false;
          if (tag === 'has_price' && (!item.preco || item.preco <= 0)) return false;
          if (tag === 'no_price' && item.preco && item.preco > 0) return false;
          if (tag === 'has_stock' && (!item.quantidade_estoque || item.quantidade_estoque <= 0)) return false;
          if (tag === 'no_stock' && item.quantidade_estoque && item.quantidade_estoque > 0) return false;
          if (tag === 'format_s' && item.formato !== 'S') return false;
          if (tag === 'format_e' && item.formato !== 'E') return false;
          if (tag === 'format_v' && item.formato !== 'V') return false;
          if (tag === 'valid_sku') {
            const isStandardSku = item.codigo ? /^\d{4}[a-zA-Z0-9]{0,2}$/.test(item.codigo) : false;
            if (!isStandardSku) return false;
          }
        }
      }

      return true;
    });
  }, [blingData, searchBling, mappedBlingIds, activeTags, blingFilter, entity]);

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

  const handleDelete = async (idBling: string) => {
    if (!onDeleteMapping) return;
    setIsSaving(true);
    try {
      await onDeleteMapping(idBling);
      showAlert('Associação Excluída', 'O mapeamento De-Para foi excluído com sucesso.', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Erro ao Excluir', 'Não foi possível excluir a associação.', 'error');
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
      const response = await fetch(`http://localhost:3333/api/v1/produtos/export-excel`);
      
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
        `http://localhost:3333/api/v1/depara/formas-pagamento/export-excel?source=${source}&association=${filter}`,
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
      const response = await fetch(`http://localhost:3333/api/v1/cigam/sync/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Falha ao sincronizar ${entityLabel} do CIGAM.`);
      }

      const resData = await response.json();
      const extractionErrors = resData.data?.errors || [];
      if (extractionErrors.length > 0) {
        throw new Error(extractionErrors.join('\n'));
      }

      showAlert(
        'Sincronização CIGAM',
        `A sincronização de ${entityLabel} foi finalizada com sucesso!\n\n• Total encontrado: ${resData.data?.total || 0}\n• Novos registros: ${resData.data?.created || 0}\n• Registros atualizados: ${resData.data?.updated || 0}`,
        'success'
      );
      
      if (onRefresh) {
        await onRefresh();
      }
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
        // Conflitos de Associação
        if (tagId === 'unmapped') next = next.filter(id => id !== 'mapped');
        if (tagId === 'mapped') next = next.filter(id => id !== 'unmapped');

        // Conflitos de NCM
        if (tagId === 'has_ncm') next = next.filter(id => id !== 'no_ncm');
        if (tagId === 'no_ncm') next = next.filter(id => id !== 'has_ncm');
        
        // Conflitos de Preço
        if (tagId === 'has_price') next = next.filter(id => id !== 'no_price');
        if (tagId === 'no_price') next = next.filter(id => id !== 'has_price');
        
        // Conflitos de Estoque
        if (tagId === 'has_stock') next = next.filter(id => id !== 'no_stock');
        if (tagId === 'no_stock') next = next.filter(id => id !== 'has_stock');
        
        // Exclusividade de Formato
        if (tagId === 'format_s') next = next.filter(id => id !== 'format_e' && id !== 'format_v');
        if (tagId === 'format_e') next = next.filter(id => id !== 'format_s' && id !== 'format_v');
        if (tagId === 'format_v') next = next.filter(id => id !== 'format_s' && id !== 'format_e');
        
        next.push(tagId);
      }
      return next;
    });
  };

  const itemDetails = modalItem as any;
  const hasBlingFilters = entity === 'produtos' ? activeTags.length > 0 : blingFilter !== 'all';
  const hasSeparateSourceSync = entity === 'formas_pagamento' || entity === 'transportadoras';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse">Carregando dados e mapeamentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with Title and Sync Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="text-left">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-xs text-slate-400">Associe cadastros da Bling com códigos equivalentes no CIGAM</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onSync && (
            <button
              type="button"
              onClick={onSync}
              disabled={syncing || isSyncingCigam || loading}
              className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition duration-200 flex items-center space-x-2 cursor-pointer shadow-lg hover:shadow-indigo-500/10 ${
                syncing ? 'cursor-not-allowed opacity-55' : ''
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>
                {syncing
                  ? hasSeparateSourceSync ? 'Sincronizando Bling...' : 'Sincronizando...'
                  : hasSeparateSourceSync ? 'Sincronizar Bling' : `Sincronizar ${title}`}
              </span>
            </button>
          )}
          {hasSeparateSourceSync && (
            <button
              type="button"
              onClick={handleSyncCigam}
              disabled={isSyncingCigam || syncing || loading}
              className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition duration-200 flex items-center space-x-2 cursor-pointer shadow-lg hover:shadow-emerald-500/10 ${
                isSyncingCigam ? 'cursor-not-allowed opacity-55' : ''
              }`}
              title={`Sincronizar ${title.toLowerCase()} do CIGAM`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCigam ? 'animate-spin' : ''}`} />
              <span>{isSyncingCigam ? 'Sincronizando CIGAM...' : 'Sincronizar CIGAM'}</span>
            </button>
          )}
          {smartMatches.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSmartMatches(true)}
              className="px-4 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-650 text-indigo-400 hover:text-indigo-300 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition active:scale-[0.98] shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{`Sugestões Inteligentes (${smartMatches.length})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Terminal Log Console */}
      {((logs && logs.length > 0) || syncing) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-inner flex flex-col space-y-2 h-64 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="text-[11px] font-mono text-slate-500 ml-2">bling-sync-console.sh</span>
            </div>
            {syncing && (
              <span className="flex items-center space-x-1.5 text-indigo-400 text-[10px] font-semibold tracking-wider uppercase animate-pulse">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                <span>Sincronizando em tempo real...</span>
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-xs text-left text-slate-300 space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-slate-850">
            {logs && logs.map((log, idx) => {
              let color = 'text-slate-300';
              if (log.startsWith('Erro') || log.includes('Erro') || log.startsWith('[ERRO]')) color = 'text-red-400';
              else if (log.includes('sucesso') || log.includes('finalizada') || log.includes('finalizado') || log.includes('completa finalizada')) color = 'text-emerald-400';
              else if (log.startsWith('[PRODUTO]') || log.startsWith('[CLIENTE]') || log.startsWith('[FORMA PAGAMENTO]') || log.startsWith('[TRANSPORTADORA]')) color = 'text-indigo-300';

              return (
                <div key={idx} className={`${color} leading-relaxed`}>
                  <span className="text-slate-600 mr-2">&gt;</span>
                  {log}
                </div>
              );
            })}
            <div id="console-bottom"></div>
          </div>
        </div>
      )}
      {showSmartMatches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-bounce" />
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-100">Sugestões de Associação Inteligente (Smart Match)</h3>
                  <p className="text-xs text-slate-400">Associe múltiplos produtos de forma compacta e ágil</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {smartMatches.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleSelectAllSuggestions}
                      disabled={isBulkSaving}
                      className="px-3 py-1.5 bg-slate-800/85 hover:bg-slate-800 border border-slate-750 hover:border-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition cursor-pointer active:scale-95 flex items-center space-x-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.size === smartMatches.length && smartMatches.length > 0}
                        onChange={() => {}} // handled by button click
                        className="mr-1.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                      />
                      <span>
                        {selectedSuggestions.size === smartMatches.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </span>
                    </button>
                    {selectedSuggestions.size > 0 && (
                      <button
                        type="button"
                        onClick={handleBulkAssociate}
                        disabled={isBulkSaving}
                        className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-lg text-xs shadow-lg hover:shadow-indigo-500/20 transition active:scale-[0.98] cursor-pointer flex items-center space-x-1"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{isBulkSaving ? 'Associando...' : `Associar Selecionados (${selectedSuggestions.size})`}</span>
                      </button>
                    )}
                  </>
                )}
                
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowSmartMatches(false)}
                  disabled={isBulkSaving}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
              {smartMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                  <Sparkles className="w-8 h-8 text-slate-600 animate-pulse" />
                  <p className="text-sm">Nenhuma nova sugestão de similaridade encontrada.</p>
                </div>
              ) : (
                smartMatches.map((match, idx) => {
                  const isChecked = selectedSuggestions.has(match.bling.id);
                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col sm:flex-row items-center justify-between p-3 border rounded-xl transition duration-200 gap-4 ${
                        isChecked 
                          ? 'bg-indigo-950/20 border-indigo-500/40' 
                          : 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800/60'
                      }`}
                    >
                      <div className="flex-1 flex flex-col sm:flex-row items-center justify-start gap-4 w-full">
                        {/* Checkbox */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isBulkSaving}
                            onChange={() => toggleSuggestionSelection(match.bling.id)}
                            className="w-4 h-4 rounded border-slate-750 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                          />
                        </div>
                        <div className="text-left w-full sm:w-auto flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 bg-amber-950/40 border border-amber-500/20 rounded-md">Bling</span>
                            <span className="text-slate-200 font-semibold text-xs">{match.bling.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            ID Bling: {match.bling.id}{match.bling.codigo && ` • SKU: ${match.bling.codigo}`}
                          </span>
                        </div>
                        <ArrowRight className="hidden sm:block w-3.5 h-3.5 text-slate-700" />
                        <div className="text-left w-full sm:w-auto flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-indigo-400 font-bold px-1.5 py-0.5 bg-indigo-950/40 border border-indigo-500/20 rounded-md">CIGAM</span>
                            <span className="text-slate-200 font-semibold text-xs">{match.cigam.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">ID CIGAM: {match.cigam.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/60 pt-2.5 sm:pt-0">
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            match.score >= 80 
                              ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-500/20' 
                              : 'text-sky-400 bg-sky-955/30 border border-sky-500/20'
                          }`}>
                            {match.score}% match
                          </span>
                        </div>
                        <button
                          onClick={() => handleApplySuggestion(match.bling.id, match.cigam.id, match.bling.name)}
                          disabled={isSaving}
                          className={`px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-indigo-500/10 transition duration-200 flex items-center space-x-1 ${
                            isSaving ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>{isSaving ? 'Aceitando...' : 'Aceitar'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 bg-slate-900/60 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setShowSmartMatches(false)}
                disabled={isBulkSaving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-750 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition duration-200 cursor-pointer shadow-md"
              >
                Fechar
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Main Grid mapping side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bling Panel */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-lg flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Tabela Bling</h3>
              <p className="text-xs text-slate-400">Total filtrado: {filteredBlingData.length}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar no Bling por nome ou ID..."
                value={searchBling}
                onChange={(e) => setSearchBling(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            </div>
            {(entity === 'produtos' || entity === 'formas_pagamento') && (
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 px-3 h-[38px] rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer active:scale-95 ${
                  showFilters
                    ? 'bg-indigo-650/20 border-indigo-500/40 text-indigo-300'
                    : hasBlingFilters
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-650 hover:text-slate-300'
                }`}
                title={showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showFilters ? 'Ocultar' : 'Filtros'}</span>
                {hasBlingFilters && (
                  <span className={`text-[9px] px-1.5 py-0.1 rounded-full ${
                    showFilters 
                      ? 'bg-indigo-500/20 text-indigo-200' 
                      : 'bg-amber-500/20 text-amber-200'
                  }`}>
                    {entity === 'produtos' ? activeTags.length : 1}
                  </span>
                )}
              </button>
            )}
            {entity === 'produtos' && (
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="p-2 px-3 h-[38px] bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition duration-200 flex items-center space-x-1.5 cursor-pointer shadow-md hover:shadow-emerald-500/10 active:scale-95 border border-emerald-500/30"
                title="Exportar produtos sem associação com NCM preenchido para ESMATERI"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exportando...' : 'Exportar ESMATERI'}</span>
              </button>
            )}
            {entity === 'formas_pagamento' && (
              <button
                type="button"
                onClick={() => handleExportPaymentMethods('bling', blingFilter)}
                disabled={exportingPaymentSource !== null}
                className="p-2 px-3 h-[38px] bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition duration-200 flex items-center space-x-1.5 cursor-pointer shadow-md hover:shadow-emerald-500/10 active:scale-95 border border-emerald-500/30"
                title="Exportar formas de pagamento da Bling com o filtro selecionado"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingPaymentSource === 'bling' ? 'Exportando...' : 'Exportar Excel'}</span>
              </button>
            )}
          </div>

          {entity === 'produtos' && showFilters && (
            <div className="flex flex-wrap gap-1.5 mb-4 animate-fadeIn">
              {[
                { id: 'unmapped', label: 'Não Associados', count: tagCounts.unmapped },
                { id: 'mapped', label: 'Associados', count: tagCounts.mapped },
                { id: 'valid_sku', label: 'SKU Padrão', count: tagCounts.validSku },
                { id: 'has_ncm', label: 'Possui NCM', count: tagCounts.hasNcm },
                { id: 'no_ncm', label: 'Sem NCM', count: tagCounts.noNcm },
                { id: 'has_price', label: 'Possui Preço', count: tagCounts.hasPrice },
                { id: 'no_price', label: 'Sem Preço', count: tagCounts.noPrice },
                { id: 'has_stock', label: 'Com Estoque', count: tagCounts.hasStock },
                { id: 'no_stock', label: 'Sem Estoque', count: tagCounts.noStock },
                { id: 'format_s', label: 'Formato: Simples', count: tagCounts.formatS },
                { id: 'format_e', label: 'Formato: Estrutura', count: tagCounts.formatE },
                { id: 'format_v', label: 'Formato: Variações', count: tagCounts.formatV },
              ].map(tag => {
                const isActive = activeTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer flex items-center space-x-1 active:scale-95 ${
                      isActive
                        ? 'bg-indigo-600/35 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-650/10'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-350'
                    }`}
                  >
                    <span>{tag.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.1 rounded-full ${
                      isActive 
                        ? 'bg-indigo-500/20 text-indigo-200' 
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {tag.count ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {entity === 'formas_pagamento' && showFilters && (
            <div className="flex flex-wrap gap-1.5 mb-4 animate-fadeIn">
              {[
                { id: 'all', label: 'Todos', count: blingCounts.all },
                { id: 'unmapped', label: 'Não Associados', count: blingCounts.unmapped },
                { id: 'mapped', label: 'Associados', count: blingCounts.mapped },
              ].map((tag) => {
                const isActive = blingFilter === tag.id;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setBlingFilter(tag.id as 'all' | 'mapped' | 'unmapped')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer flex items-center space-x-1 active:scale-95 ${
                      isActive
                        ? 'bg-indigo-600/35 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-650/10'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-350'
                    }`}
                  >
                    <span>{tag.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.1 rounded-full ${
                      isActive ? 'bg-indigo-500/20 text-indigo-200' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {tag.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {displayedBlingData.map((item) => {
              const isMapped = mappedBlingIds.has(item.id);
              const isSelected = selectedBlingId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => !isMapped && setSelectedBlingId(item.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    isMapped
                      ? 'bg-slate-900/30 border-slate-800 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'bg-indigo-600/20 border-indigo-500'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        ID: {item.id} {item.codigo && `• Cód: ${item.codigo}`} {item.ncm && `• NCM: ${item.ncm}`} {item.temVariacoes && `• Possui Variações`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalItem(item);
                          setModalSource('bling');
                        }}
                        className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-slate-200 transition"
                        title="Ver detalhes"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {isMapped ? (
                        <span className="flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          <span>CIGAM: {blingToCigamMap.get(item.id)}</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-xs text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20">
                          <AlertCircle className="w-3 h-3" />
                          <span>Sem Associação</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredBlingData.length > visibleBlingCount && (
              <button
                type="button"
                onClick={() => setVisibleBlingCount(prev => prev + 25)}
                className="w-full py-2.5 mt-2 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition active:scale-[0.98]"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Ver mais ({filteredBlingData.length - visibleBlingCount} itens restantes)</span>
              </button>
            )}
            {filteredBlingData.length === 0 && (
              <p className="text-slate-500 text-sm py-8">Nenhum item do Bling encontrado.</p>
            )}
          </div>
        </div>

        {/* CIGAM Panel */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-lg flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Tabela CIGAM</h3>
              <p className="text-xs text-slate-400">Total filtrado: {filteredCigamData.length}</p>
            </div>
            {entity === 'produtos' && (
              <button
                type="button"
                onClick={handleSyncCigam}
                disabled={isSyncingCigam}
                className="p-1.5 px-3 h-[38px] bg-indigo-750 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition duration-200 flex items-center space-x-1.5 cursor-pointer shadow-md hover:shadow-indigo-500/10 active:scale-95 border border-indigo-500/30"
                title="Sincronizar produtos com a plataforma CIGAM"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCigam ? 'animate-spin' : ''}`} />
                <span>{isSyncingCigam ? 'Sincronizando...' : 'Sincronizar CIGAM'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar no CIGAM por nome ou código..."
                value={searchCigam}
                onChange={(e) => setSearchCigam(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            </div>
            {entity === 'formas_pagamento' && (
              <button
                type="button"
                onClick={() => handleExportPaymentMethods('cigam', cigamFilter)}
                disabled={exportingPaymentSource !== null}
                className="p-2 px-3 h-[38px] bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition duration-200 flex items-center space-x-1.5 cursor-pointer shadow-md hover:shadow-emerald-500/10 active:scale-95 border border-emerald-500/30"
                title="Exportar formas de pagamento do CIGAM com o filtro selecionado"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingPaymentSource === 'cigam' ? 'Exportando...' : 'Exportar Excel'}</span>
              </button>
            )}
          </div>

          {(entity === 'produtos' || entity === 'formas_pagamento') && (
            <div className="flex flex-wrap gap-1.5 mb-4 animate-fadeIn">
              {[
                { id: 'all', label: 'Todos', count: cigamCounts.all },
                { id: 'unmapped', label: 'Não Associados', count: cigamCounts.unmapped },
                { id: 'mapped', label: 'Associados', count: cigamCounts.mapped },
              ].map(tag => {
                const isActive = cigamFilter === tag.id;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setCigamFilter(tag.id as any)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer flex items-center space-x-1 active:scale-95 ${
                      isActive
                        ? 'bg-indigo-600/35 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-650/10'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-350'
                    }`}
                  >
                    <span>{tag.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.1 rounded-full ${
                      isActive 
                        ? 'bg-indigo-500/20 text-indigo-200' 
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {tag.count ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {displayedCigamData.map((item) => {
              const isSelected = selectedCigamId === item.id;
              const associatedBlingItems = cigamToBlingMap.get(item.id);
              const isMapped = associatedBlingItems && associatedBlingItems.length > 0;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCigamId(item.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-200 truncate flex-1">{item.name}</p>
                        {isMapped && (
                          <span 
                            className="flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0"
                            title={`Associado a: ${associatedBlingItems.map(b => `${b.name} (ID: ${b.id})`).join(', ')}`}
                          >
                            <CheckCircle className="w-2.5 h-2.5" />
                            <span>Associado</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Código CIGAM: {item.id} {item.extra && `• Doc: ${item.extra}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalItem(item);
                        setModalSource('cigam');
                      }}
                      className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-slate-200 transition ml-2"
                      title="Ver detalhes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredCigamData.length > visibleCigamCount && (
              <button
                type="button"
                onClick={() => setVisibleCigamCount(prev => prev + 25)}
                className="w-full py-2.5 mt-2 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition active:scale-[0.98]"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Ver mais ({filteredCigamData.length - visibleCigamCount} itens restantes)</span>
              </button>
            )}
            {filteredCigamData.length === 0 && (
              <p className="text-slate-500 text-sm py-8">Nenhum item do CIGAM encontrado.</p>
            )}
          </div>
        </div>
      </div>

      {/* Linking Confirmation area */}
      <div 
        id="linking-panel"
        className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between"
      >
        <div className="flex flex-col md:flex-row items-center md:space-x-6 space-y-4 md:space-y-0 w-full md:w-auto">
          {/* Selected Bling */}
          <div className="bg-slate-900/60 px-4 py-3 rounded-xl border border-slate-700 w-full md:w-64 text-left">
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Selecionado Bling</span>
            <p className="text-sm font-semibold text-slate-200 truncate">
              {selectedBlingItem ? selectedBlingItem.name : 'Nenhum item selecionado'}
            </p>
            <p className="text-xs text-slate-500">
              {selectedBlingItem ? `ID: ${selectedBlingItem.id}` : 'Selecione na lista esquerda'}
            </p>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-500 rotate-90 md:rotate-0" />

          {/* Selected CIGAM */}
          <div className="bg-slate-900/60 px-4 py-3 rounded-xl border border-slate-700 w-full md:w-64 text-left">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Selecionado CIGAM</span>
            <p className="text-sm font-semibold text-slate-200 truncate">
              {selectedCigamItem ? selectedCigamItem.name : 'Nenhum item selecionado'}
            </p>
            <p className="text-xs text-slate-500">
              {selectedCigamItem ? `Código: ${selectedCigamItem.id}` : 'Selecione na lista direita'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLink}
          disabled={!selectedBlingId || !selectedCigamId || isSaving}
          className={`mt-6 md:mt-0 px-8 py-3.5 rounded-xl font-semibold shadow-lg transition duration-200 w-full md:w-auto ${
            selectedBlingId && selectedCigamId
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white hover:shadow-indigo-500/20 cursor-pointer'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Salvando...' : 'Salvar Associação (De-Para)'}
        </button>
      </div>

      {/* Existing Mappings Listing */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-200 mb-4 text-left">Associações Ativas ({mappings.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-3 px-4">Plataforma Bling</th>
                <th className="py-3 px-4">Plataforma CIGAM</th>
                {onDeleteMapping && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayedMappings.map((mapping, index) => {
                const blingItem = blingData.find(b => b.id === mapping.id_bling);
                const blingItemName = blingItem?.name || mapping.nome;
                const cigamItemName = cigamData.find(c => c.id === mapping.id_cigam)?.name || 'Cadastro não localizado';
                return (
                  <tr key={index} className="hover:bg-slate-900/30 transition">
                    <td className="py-3 px-4 text-slate-200">
                      <div className="font-medium">{blingItemName}</div>
                      <div className="text-xs text-amber-500 font-mono mt-0.5">
                        ID: {mapping.id_bling} {blingItem?.codigo && `• Cód: ${blingItem.codigo}`} {blingItem?.temVariacoes && `• Possui Variações`}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      <div className="font-medium">{cigamItemName}</div>
                      <div className="text-xs text-indigo-400 font-mono mt-0.5">Código CIGAM: {mapping.id_cigam}</div>
                    </td>
                    {onDeleteMapping && (
                      <td className="py-3 px-4 text-right animate-fadeIn">
                        <button
                          type="button"
                          onClick={() => handleDelete(mapping.id_bling)}
                          disabled={isSaving}
                          className="px-3 py-1.5 bg-red-950/45 border border-red-500/20 hover:bg-red-900/40 hover:border-red-400/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Excluir
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {mappings.length === 0 && (
                <tr>
                  <td colSpan={onDeleteMapping ? 3 : 2} className="text-center py-6 text-slate-500">
                    Nenhuma associação ativa para esta entidade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalMappingsPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-4 mt-4 gap-4">
            <div className="text-xs text-slate-400">
              Mostrando <span className="font-semibold text-slate-300">{Math.min(mappings.length, (mappingsPage - 1) * itemsPerPage + 1)}</span> a{' '}
              <span className="font-semibold text-slate-300">{Math.min(mappings.length, mappingsPage * itemsPerPage)}</span> de{' '}
              <span className="font-semibold text-slate-300">{mappings.length}</span> associações
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setMappingsPage(p => Math.max(1, p - 1))}
                disabled={mappingsPage === 1}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-semibold rounded-lg text-xs transition cursor-pointer active:scale-95"
              >
                Anterior
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalMappingsPages }, (_, i) => i + 1).map((pNum) => {
                  if (
                    pNum === 1 || 
                    pNum === totalMappingsPages || 
                    (pNum >= mappingsPage - 1 && pNum <= mappingsPage + 1)
                  ) {
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setMappingsPage(pNum)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95 ${
                          mappingsPage === pNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  }
                  if (
                    pNum === 2 || 
                    pNum === totalMappingsPages - 1
                  ) {
                    return <span key={pNum} className="text-slate-600 text-xs px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                type="button"
                onClick={() => setMappingsPage(p => Math.min(totalMappingsPages, p + 1))}
                disabled={mappingsPage === totalMappingsPages}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-semibold rounded-lg text-xs transition cursor-pointer active:scale-95"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {modalItem && modalSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setModalItem(null);
              setModalSource(null);
            }}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  modalSource === 'bling'
                    ? 'bg-amber-950/40 border border-amber-500/20 text-amber-400'
                    : 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-400'
                }`}>
                  {modalSource === 'bling' ? 'Bling' : 'CIGAM'}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">{itemDetails.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalItem(null);
                  setModalSource(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ID */}
                <div className="bg-slate-800/50 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">ID</span>
                  <p className="text-sm font-mono text-slate-200 mt-1">{itemDetails.id}</p>
                </div>

                {/* Codigo */}
                {itemDetails.codigo && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Código</span>
                    <p className="text-sm font-mono text-slate-200 mt-1">{itemDetails.codigo}</p>
                  </div>
                )}

                {/* Preco */}
                {itemDetails.preco !== undefined && itemDetails.preco !== null && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Preço</span>
                    <p className="text-sm text-emerald-400 font-semibold mt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(itemDetails.preco))}
                    </p>
                  </div>
                )}

                {/* Tipo */}
                {itemDetails.tipo && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tipo</span>
                    <p className="text-sm text-slate-200 mt-1">{itemDetails.tipo}</p>
                  </div>
                )}

                {/* Situacao */}
                {itemDetails.situacao && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Situação</span>
                    <p className="text-sm text-slate-200 mt-1">{itemDetails.situacao}</p>
                  </div>
                )}

                {/* Formato */}
                {itemDetails.formato && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Formato</span>
                    <p className="text-sm text-slate-200 mt-1">{itemDetails.formato}</p>
                  </div>
                )}

                {/* Unidade */}
                {itemDetails.unidade && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unidade</span>
                    <p className="text-sm text-slate-200 mt-1">{itemDetails.unidade}</p>
                  </div>
                )}

                {/* Tipo Produto */}
                {itemDetails.tipoProduto && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tipo Produto</span>
                    <p className="text-sm text-slate-200 mt-1">{itemDetails.tipoProduto}</p>
                  </div>
                )}

                {/* Condicao */}
                {itemDetails.condicao !== undefined && itemDetails.condicao !== null && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Condição</span>
                    <p className="text-sm text-slate-200 mt-1">{itemDetails.condicao === 0 ? 'Novo' : itemDetails.condicao === 1 ? 'Usado' : `Código ${itemDetails.condicao}`}</p>
                  </div>
                )}

                {/* Marca */}
                {itemDetails.marca && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Marca</span>
                    <p className="text-sm text-slate-200 mt-1">{itemDetails.marca}</p>
                  </div>
                )}

                {/* NCM */}
                {itemDetails.ncm && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">NCM</span>
                    <p className="text-sm font-mono text-slate-200 mt-1">{itemDetails.ncm}</p>
                  </div>
                )}

                {/* Quantidade Estoque */}
                {itemDetails.quantidade_estoque !== undefined && itemDetails.quantidade_estoque !== null && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estoque</span>
                    <p className="text-sm text-slate-200 mt-1">{itemDetails.quantidade_estoque} unidades</p>
                  </div>
                )}

                {/* Tem Variacoes */}
                {itemDetails.temVariacoes !== undefined && itemDetails.temVariacoes !== null && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Variações</span>
                    <p className="text-sm text-slate-200 mt-1">{itemDetails.temVariacoes ? 'Sim' : 'Não'}</p>
                  </div>
                )}

                {/* Ativo */}
                {itemDetails.ativo !== undefined && itemDetails.ativo !== null && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</span>
                    <p className={`text-sm font-semibold mt-1 ${itemDetails.ativo ? 'text-emerald-400' : 'text-red-400'}`}>
                      {itemDetails.ativo ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                )}

                {/* Fornecedor */}
                {itemDetails.fornecedor_nome && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fornecedor</span>
                    <p className="text-sm text-slate-200 mt-1">{itemDetails.fornecedor_nome}</p>
                    {itemDetails.fornecedor_codigo && (
                      <p className="text-xs text-slate-500 mt-0.5">Cód: {itemDetails.fornecedor_codigo}</p>
                    )}
                    {itemDetails.fornecedor_precoCusto !== undefined && itemDetails.fornecedor_precoCusto !== null && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Custo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(itemDetails.fornecedor_precoCusto))}
                      </p>
                    )}
                  </div>
                )}

                {/* Extra (documento) */}
                {itemDetails.extra && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Documento</span>
                    <p className="text-sm font-mono text-slate-200 mt-1">{itemDetails.extra}</p>
                  </div>
                )}
              </div>

              {/* Descricao Curta */}
              {itemDetails.descricaoCurta && (
                <div className="mt-4 bg-slate-800/50 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Descrição</span>
                  <p className="text-sm text-slate-200 mt-2 whitespace-pre-wrap">{itemDetails.descricaoCurta}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <p className="text-xs text-slate-500 text-center">
                {modalSource === 'bling' ? 'Dados do Bling' : 'Dados do CIGAM'} • Última atualização via API
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertConfig && alertConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setAlertConfig(null)}
          />
          <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 animate-scaleIn">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl ${
                alertConfig.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : alertConfig.type === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
              }`}>
                {alertConfig.type === 'success' && <CheckCircle className="w-6 h-6" />}
                {alertConfig.type === 'error' && <AlertCircle className="w-6 h-6" />}
                {alertConfig.type === 'info' && <Sparkles className="w-6 h-6" />}
              </div>
              
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-base font-bold text-slate-200 truncate">{alertConfig.title}</h3>
                <p className="text-sm text-slate-400 mt-2 whitespace-pre-line leading-relaxed">{alertConfig.message}</p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setAlertConfig(null)}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition duration-200 cursor-pointer active:scale-95 ${
                  alertConfig.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/10'
                    : alertConfig.type === 'error'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white hover:shadow-rose-500/10'
                    : 'bg-indigo-650 hover:bg-indigo-600 text-white hover:shadow-indigo-500/10'
                }`}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
