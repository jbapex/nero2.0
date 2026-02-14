import React, { memo, useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const ALL_CONTEXTS_ID = '__all__';

const ContextNode = memo(({ data, id }) => {
  const { onUpdateNodeData, clients, inputData, selectedClientId, selectedContextId } = data;
  const [contexts, setContexts] = useState(data.contextsList || []);
  const [loadingContexts, setLoadingContexts] = useState(false);

  // Cliente vindo do nó Cliente conectado à entrada
  const clientFromUpstream = inputData?.client?.data;
  const hasClientNode = !!clientFromUpstream;
  const upstreamContexts = clientFromUpstream?.client_contexts || [];

  const effectiveContexts = hasClientNode ? upstreamContexts : contexts;
  const selectedClientData = hasClientNode
    ? { id: clientFromUpstream.id, name: clientFromUpstream.name }
    : clients?.find(c => c.id.toString() === selectedClientId);

  // Só buscar contextos quando NÃO há nó Cliente: usuário escolhe cliente manualmente
  useEffect(() => {
    if (hasClientNode) return;
    if (!selectedClientId || !clients?.length) {
      setContexts([]);
      onUpdateNodeData(id, { contextsList: [], selectedContextId: null, output: null });
      return;
    }
    const selectedClientDataLocal = clients.find(c => c.id.toString() === selectedClientId);
    if (!selectedClientDataLocal) return;
    let cancelled = false;
    setLoadingContexts(true);
    (async () => {
      const { data: list } = await supabase
        .from('client_contexts')
        .select('id, name, content')
        .eq('client_id', selectedClientDataLocal.id)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      const listSafe = list || [];
      setContexts(listSafe);
      setLoadingContexts(false);
      const currentSelected = data.selectedContextId;
      const validSelection = currentSelected && (currentSelected === ALL_CONTEXTS_ID || listSafe.some(c => c.id.toString() === currentSelected));
      const defaultSelection = listSafe.length === 1
        ? listSafe[0].id.toString()
        : listSafe.length > 1
          ? ALL_CONTEXTS_ID
          : null;
      onUpdateNodeData(id, {
        contextsList: listSafe,
        selectedContextId: validSelection ? currentSelected : defaultSelection,
      });
    })();
    return () => { cancelled = true; };
  }, [hasClientNode, selectedClientId, clients, id, onUpdateNodeData]);

  // Quando passa a ter cliente do upstream, definir seleção padrão de contexto
  useEffect(() => {
    if (!hasClientNode || !onUpdateNodeData) return;
    const list = upstreamContexts;
    const currentSelected = data.selectedContextId;
    const validSelection = currentSelected && (currentSelected === ALL_CONTEXTS_ID || list.some(c => c.id.toString() === currentSelected));
    const defaultSelection = list.length === 1
      ? list[0].id.toString()
      : list.length > 1
        ? ALL_CONTEXTS_ID
        : null;
    if (!validSelection && defaultSelection !== null) {
      onUpdateNodeData(id, { selectedContextId: defaultSelection });
    }
  }, [hasClientNode, upstreamContexts.length, id, onUpdateNodeData]);

  const handleClientChange = (clientId) => {
    if (!clientId) {
      onUpdateNodeData(id, { selectedClientId: null, selectedContextId: null, contextsList: [], output: null });
      return;
    }
    onUpdateNodeData(id, { selectedClientId: clientId, selectedContextId: null, output: null });
  };

  const handleContextChange = (contextId) => {
    onUpdateNodeData(id, { selectedContextId: contextId || null });
  };

  // Atualizar output quando cliente + seleção de contexto mudam
  useEffect(() => {
    if (!selectedClientData || !onUpdateNodeData) return;
    const ctxId = data.selectedContextId;
    const list = effectiveContexts;
    let selectedContexts = [];
    if (ctxId === ALL_CONTEXTS_ID) {
      selectedContexts = list;
    } else if (ctxId && list.length) {
      const one = list.find(c => c.id.toString() === ctxId);
      if (one) selectedContexts = [one];
    }
    onUpdateNodeData(id, {
      output: {
        id: 'context',
        data: {
          client_id: selectedClientData.id,
          client_name: selectedClientData.name,
          contexts: selectedContexts,
        },
      },
    });
  }, [selectedClientData, data.selectedContextId, effectiveContexts, id, onUpdateNodeData]);

  const showClientSelector = !hasClientNode;
  const contextDisabled = !selectedClientData || loadingContexts || effectiveContexts.length === 0;

  return (
    <Card className="w-64 border-2 border-violet-500/50 shadow-lg">
      <Handle type="target" position={Position.Left} className="!bg-violet-500" />
      <CardHeader className="flex-row items-center space-x-2 p-3 bg-violet-500/10">
        <FileText className="w-5 h-5 text-violet-500" />
        <CardTitle className="text-base">Contexto</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {showClientSelector && (
          <Select onValueChange={handleClientChange} value={selectedClientId || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasClientNode && (
          <p className="text-xs text-muted-foreground">
            Cliente: <strong>{clientFromUpstream.name}</strong>
          </p>
        )}
        <Select
          onValueChange={handleContextChange}
          value={data.selectedContextId || ''}
          disabled={contextDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingContexts ? 'Carregando...' : effectiveContexts.length === 0 ? 'Nenhum contexto' : 'Qual contexto?'} />
          </SelectTrigger>
          <SelectContent>
            {effectiveContexts.length > 1 && (
              <SelectItem value={ALL_CONTEXTS_ID}>Todos os contextos</SelectItem>
            )}
            {effectiveContexts.map((ctx) => (
              <SelectItem key={ctx.id} value={ctx.id.toString()}>
                {ctx.name || `Contexto ${ctx.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
      <Handle type="source" position={Position.Right} className="!bg-violet-500" />
    </Card>
  );
});

export default ContextNode;
