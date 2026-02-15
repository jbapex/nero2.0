import React from 'react';
    import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { Copy, CopyCheck } from 'lucide-react';
    
    const VariableCard = ({ title, description, variable, onCopy }) => (
      <Card className="bg-card/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex-grow">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <code className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md mt-2 inline-block">
              {variable}
            </code>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onCopy(variable)}>
            <Copy className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
    
    const generalVariables = [
        { title: "Dados da Campanha", description: "Objeto JSON com todos os dados da campanha atual.", variable: "{{dados_campanha}}" },
        { title: "Nome da Campanha", description: "O nome da campanha.", variable: "{{dados_campanha.name}}" },
        { title: "Objetivo da Campanha", description: "O objetivo principal da campanha.", variable: "{{dados_campanha.objective}}" },
        { title: "Foco Mensal", description: "O foco definido para o mês da campanha.", variable: "{{dados_campanha.monthly_focus}}" },
        { title: "Diferencial da Marca", description: "O que torna a marca única.", variable: "{{dados_campanha.brand_differential}}" },
        { title: "Público-alvo", description: "Descrição do público-alvo da campanha.", variable: "{{dados_campanha.target_audience}}" },
        { title: "Tom de Voz", description: "O tom de voz a ser usado na comunicação.", variable: "{{dados_campanha.tone_of_voice}}" },
        { title: "Notas Estratégicas", description: "Observações e notas sobre a estratégia.", variable: "{{dados_campanha.strategic_notes}}" },
        { title: "Data Atual", description: "Data atual no formato AAAA-MM-DD.", variable: "{{data_atual}}" },
        { title: "Mês Atual", description: "Nome do mês atual por extenso.", variable: "{{mes_atual}}" },
        { title: "Ano Atual", description: "Ano atual com 4 dígitos.", variable: "{{ano_atual}}" },
    ];
    
    const clientVariables = [
        { title: "Dados do Cliente", description: "Objeto JSON com todos os dados do cliente.", variable: "{{cliente}}" },
        { title: "Nome do Cliente", description: "O nome da empresa/cliente.", variable: "{{cliente.name}}" },
        { title: "Sobre o Cliente", description: "Descrição sobre o cliente.", variable: "{{cliente.about}}" },
        { title: "Telefone do Cliente", description: "Telefone de contato do cliente.", variable: "{{cliente.phone}}" },
        { title: "Nome do Criador", description: "Nome do criador de conteúdo associado ao cliente.", variable: "{{cliente.creator_name}}" },
        { title: "Nicho do Cliente", description: "Nicho de mercado do cliente.", variable: "{{cliente.niche}}" },
        { title: "Estilo em 3 Palavras", description: "O estilo do cliente/criador em três palavras.", variable: "{{cliente.style_in_3_words}}" },
        { title: "Produto a Promover", description: "Produto ou serviço principal a ser promovido.", variable: "{{cliente.product_to_promote}}" },
        { title: "Público-alvo do Cliente", description: "Descrição do público-alvo principal do cliente.", variable: "{{cliente.target_audience}}" },
        { title: "Casos de Sucesso", description: "Exemplos de sucesso do cliente.", variable: "{{cliente.success_cases}}" },
        { title: "Visualizações do Perfil", description: "Número de visualizações do perfil do cliente/criador.", variable: "{{cliente.profile_views}}" },
        { title: "Seguidores", description: "Número de seguidores do cliente/criador.", variable: "{{cliente.followers}}" },
        { title: "Formato de Aparição", description: "Como o criador aparece nos conteúdos (vídeo, voz, etc.).", variable: "{{cliente.appearance_format}}" },
        { title: "Bordões", description: "Frases de efeito ou bordões utilizados pelo criador.", variable: "{{cliente.catchphrases}}" },
    ];
    
    const planningVariables = [
        { title: "Dados do Planejamento", description: "Objeto JSON com o planejamento estratégico completo.", variable: "{{dados_planejamento}}" },
        { title: "Objetivo do Planejamento", description: "Conteúdo da etapa 'Objetivo' do planejamento.", variable: "{{dados_planejamento.planning_steps.objetivo.content}}" },
        { title: "Fases do Planejamento", description: "Conteúdo da etapa 'Fases' do planejamento.", variable: "{{dados_planejamento.planning_steps.fases.content}}" },
    ];
    
    const analysisVariables = [
        { title: "Dados da Análise", description: "Objeto JSON com os resultados da análise de campanha.", variable: "{{dados_analise}}" },
        { title: "KPIs da Análise", description: "Objeto com os KPIs calculados na análise.", variable: "{{dados_analise.kpis}}" },
        { title: "Resumo da Análise", description: "Resumo executivo da análise de campanha.", variable: "{{dados_analise.resumo_executivo}}" },
        { title: "Plano de Ação da Análise", description: "Plano de ação sugerido na análise.", variable: "{{dados_analise.plano_de_acao}}" },
    ];

    const contextBlockVariables = [
        { title: "Bloco [CONTEXTO]", description: "Bloco injetado automaticamente na mensagem do usuário no Gerador de Conteúdo (ex.: Arte Estática). Contém nome do módulo, cliente, campanha e documentos de contexto selecionados. A IA já é instruída a usar; no prompt base do módulo você pode reforçar: \"use as informações em [CONTEXTO]\".", variable: "[CONTEXTO]" },
    ];

    const agentResultVariables = [
        { title: "Resultado de um agente", description: "Substitua NOME_DO_AGENTE pelo nome exato do agente. Injeta o último resultado gerado por esse agente na mesma campanha ou fluxo. Use para encadear agentes (ex.: títulos → descrição).", variable: "{{resultado_agente:NOME_DO_AGENTE}}" },
        { title: "Resultado favorito de um agente", description: "Substitua NOME_DO_AGENTE pelo nome do agente. Injeta o último resultado marcado como favorito desse agente. Útil para fixar uma versão e reutilizá-la em outro agente.", variable: "{{resultado_favorito_agente:NOME_DO_AGENTE}}" },
    ];

    const userTextVariables = [
        { title: "Texto complementar do usuário", description: "Texto livre que o usuário digitou no campo \"Informações para a IA\" ou equivalente no Gerador de Conteúdo e em fluxos.", variable: "{{texto_usuario}}" },
    ];

    const campaignAliasVariables = [
        { title: "Nome da Campanha (alias)", description: "Nome da campanha. Forma alternativa usada em fluxos e agentes de campanha.", variable: "{{nome_campanha}}" },
        { title: "Objetivo da Campanha (alias)", description: "Objetivo principal da campanha.", variable: "{{objetivo_campanha}}" },
        { title: "Público-alvo (alias)", description: "Público-alvo da campanha.", variable: "{{publico_alvo}}" },
        { title: "Diferencial da Marca (alias)", description: "Diferencial da marca na campanha.", variable: "{{diferencial_marca}}" },
        { title: "Tom de Voz (alias)", description: "Tom de voz da campanha.", variable: "{{tom_de_voz}}" },
        { title: "Orçamento da Campanha", description: "Orçamento definido para a campanha.", variable: "{{orcamento_campanha}}" },
        { title: "Período da Campanha", description: "Período de vigência da campanha.", variable: "{{periodo_campanha}}" },
        { title: "Canais Selecionados", description: "Canais de divulgação selecionados na campanha.", variable: "{{canais_selecionados}}" },
        { title: "Estratégia de Lances", description: "Estratégia de lances (ex.: Meta Ads).", variable: "{{estrategia_lances}}" },
        { title: "KPIs de Sucesso", description: "KPIs definidos para sucesso da campanha.", variable: "{{kpis_sucesso}}" },
        { title: "Personas Detalhadas", description: "Personas definidas na estratégia.", variable: "{{personas_detalhadas}}" },
        { title: "Estratégia de Conteúdo", description: "Estratégia de conteúdo da campanha.", variable: "{{estrategia_conteudo}}" },
    ];

    const clientAliasVariables = [
        { title: "Dados do Cliente (alias)", description: "Objeto com todos os dados do cliente. Usado em fluxos e agentes.", variable: "{{dados_cliente}}" },
        { title: "Nome do Cliente (alias)", description: "Nome do cliente/empresa. Forma alternativa a {{cliente.name}}.", variable: "{{nome_cliente}}" },
    ];

    const imageBriefingVariables = [
        { title: "Objetivo do briefing (imagem)", description: "Objetivo extraído do briefing para uso em templates de geração de imagem.", variable: "{{briefing_objetivo}}" },
        { title: "Público-alvo do briefing (imagem)", description: "Público-alvo do briefing para prompts de imagem.", variable: "{{briefing_publico_alvo}}" },
        { title: "Tom de voz do briefing (imagem)", description: "Tom de voz do briefing para estilizar a geração de imagem.", variable: "{{briefing_tom_de_voz}}" },
    ];

    const SystemVariables = () => {
      const { toast } = useToast();
    
      const handleCopy = (variable) => {
        navigator.clipboard.writeText(variable);
        toast({
          title: "Copiado!",
          description: `A variável ${variable} foi copiada para a área de transferência.`,
        });
      };
    
      const handleCopyAll = (variables, sectionTitle) => {
        const allVariablesText = variables.map(v => v.variable).join('\n');
        navigator.clipboard.writeText(allVariablesText);
        toast({
          title: "Tudo Copiado!",
          description: `Todas as variáveis da seção "${sectionTitle}" foram copiadas.`,
        });
      };
    
      const renderVariableSection = (title, description, variables) => (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                <p className="text-muted-foreground mt-1">{description}</p>
              </div>
              <Button variant="outline" onClick={() => handleCopyAll(variables, title)}>
                <CopyCheck className="h-4 w-4 mr-2" />
                Copiar Todas
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {variables.map((v, index) => (
                <VariableCard key={index} {...v} onCopy={handleCopy} />
              ))}
            </div>
          </div>
      );
    
      return (
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Variáveis de Sistema</CardTitle>
              <CardDescription>
                Use estas variáveis nos blocos de conteúdo, prompts de módulos, agentes e templates de imagem. Elas são substituídas pelos dados da campanha, cliente, planejamento, análise, resultados de agentes e texto do usuário.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderVariableSection(
                "Variáveis Gerais e de Campanha",
                "Dados principais da campanha e informações de data.",
                generalVariables
              )}
              {renderVariableSection(
                "Variáveis do Cliente",
                "Dados específicos do cliente associado à campanha.",
                clientVariables
              )}
              {renderVariableSection(
                "Variáveis do Planejamento",
                "Informações extraídas do Planejador Estratégico.",
                planningVariables
              )}
               {renderVariableSection(
                "Variáveis da Análise",
                "Resultados e insights do Analisador de Campanhas.",
                analysisVariables
              )}
              {renderVariableSection(
                "Bloco de contexto (Gerador de Conteúdo / Módulos)",
                "Bloco injetado automaticamente na tela de módulos (ex.: Arte Estática). Use no prompt base do módulo para referenciar dados do cliente, campanha e documentos de contexto.",
                contextBlockVariables
              )}
              {renderVariableSection(
                "Variáveis de resultado de agentes",
                "Reutilize o output de um agente no prompt de outro. Substitua NOME_DO_AGENTE pelo nome exato do agente.",
                agentResultVariables
              )}
              {renderVariableSection(
                "Variáveis de texto e usuário",
                "Texto livre inserido pelo usuário nos formulários de geração.",
                userTextVariables
              )}
              {renderVariableSection(
                "Variáveis de campanha (alias para fluxos e agentes)",
                "Formas alternativas usadas em fluxos criativos e agentes de campanha.",
                campaignAliasVariables
              )}
              {renderVariableSection(
                "Variáveis de cliente (alias)",
                "Formas alternativas para dados do cliente em fluxos e agentes.",
                clientAliasVariables
              )}
              {renderVariableSection(
                "Variáveis de briefing para imagem",
                "Usadas em templates de geração de imagem (presets) para injetar dados da campanha.",
                imageBriefingVariables
              )}
            </CardContent>
          </Card>
        </div>
      );
    };
    
    export default SystemVariables;