import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Target, Braces, Zap, Clipboard, Copy } from 'lucide-react';
import { Helmet } from 'react-helmet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const VariantRow = ({ label, variant, onCopy }) => (
  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40">
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <code className="text-sm font-semibold text-foreground">{variant}</code>
    </div>
    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => onCopy(variant)}>
      <Clipboard className="w-4 h-4" />
    </Button>
  </div>
);

const VariantTable = ({ title, variants, onCopyAll }) => (
  <div>
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-semibold text-md">{title}</h3>
      <Button variant="outline" size="sm" onClick={onCopyAll}>
        <Copy className="w-3 h-3 mr-2" />
        Copiar Todas
      </Button>
    </div>
    <div className="border rounded-lg bg-muted/20 divide-y">
      {variants.map((v) => (
        <VariantRow key={v.variant} label={v.label} variant={v.variant} onCopy={v.onCopy} />
      ))}
    </div>
  </div>
);

const SystemVariants = () => {
  const { toast } = useToast();

  const handleCopy = (text, message) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: message || `A variante ${text} foi copiada.`,
    });
  };

  const campaignBriefingVariants = [
    { label: 'Nome da Campanha', variant: '{{nome_campanha}}' },
    { label: 'Objetivo da Campanha', variant: '{{objetivo_campanha}}' },
    { label: 'Público-Alvo', variant: '{{publico_alvo}}' },
    { label: 'Diferencial da Marca', variant: '{{diferencial_marca}}' },
    { label: 'Tom de Voz', variant: '{{tom_de_voz}}' },
    { label: 'Orçamento da Campanha', variant: '{{orcamento_campanha}}' },
    { label: 'Período da Campanha', variant: '{{periodo_campanha}}' },
  ];

  const campaignChannelsVariants = [
    { label: 'Canais Selecionados', variant: '{{canais_selecionados}}' },
  ];

  const campaignStrategyVariants = [
    { label: 'Estratégia de Lances', variant: '{{estrategia_lances}}' },
    { label: 'KPIs de Sucesso', variant: '{{kpis_sucesso}}' },
    { label: 'Personas Detalhadas', variant: '{{personas_detalhadas}}' },
    { label: 'Estratégia de Conteúdo', variant: '{{estrategia_conteudo}}' },
  ];
  
  const allCampaignVariants = [
    { label: 'Contexto Completo da Campanha', variant: '{{dados_campanha}}' },
    ...campaignBriefingVariants,
    ...campaignChannelsVariants,
    ...campaignStrategyVariants,
  ];

  const copyAll = (variants, title) => {
    const textToCopy = variants.map(v => v.variant).join('\n');
    handleCopy(textToCopy, `Todas as variantes de "${title}" foram copiadas.`);
  };

  const clientVariants = [
    { label: 'Dados Completos do Cliente', variant: '{{dados_cliente}}' },
    { label: 'Nome do Cliente', variant: '{{nome_cliente}}' },
  ];

  const genericVariants = [
    { label: 'Texto Complementar do Usuário', variant: '{{texto_usuario}}' },
  ];
  
  const resultsVariants = [
    { label: 'Último resultado de um agente', variant: '{{resultado_agente:NOME_DO_AGENTE}}', description: 'Injeta o último resultado gerado por um agente específico dentro da mesma campanha.', example: 'Com base nos títulos gerados ({{resultado_agente:Gerador de Títulos}}), crie uma descrição para o anúncio.' },
    { label: 'Último resultado favorito de um agente', variant: '{{resultado_favorito_agente:NOME_DO_AGENTE}}', description: 'Injeta o último resultado FAVORITADO de um agente específico na mesma campanha.', example: 'Traduza para o inglês o seguinte texto favoritado: {{resultado_favorito_agente:Criador de Copy}}.' },
  ];

  const ResultVariantCard = ({ label, variant, description, example }) => (
     <div className="border p-4 rounded-lg bg-muted/20">
      <div className="flex justify-between items-start">
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <code className="text-sm font-semibold text-foreground">{variant}</code>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleCopy(variant)}>
          <Clipboard className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
      {example && (
        <div className="mt-3 p-3 bg-background/50 rounded-md">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Exemplo de uso no prompt:</p>
          <code className="text-xs text-foreground whitespace-pre-wrap">{example}</code>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Variantes do Sistema - Super Admin</title>
      </Helmet>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
            Variantes do Sistema
          </h1>
          <p className="text-muted-foreground">
            Um guia de todas as variáveis dinâmicas que você pode usar nos prompts dos agentes de IA.
          </p>
        </motion.div>

        <Accordion type="multiple" defaultValue={['campaigns', 'clients', 'generic', 'results']} className="w-full space-y-4">
          <AccordionItem value="campaigns" className="border rounded-lg bg-card">
            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                Variantes de Campanhas
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <div className="space-y-6">
                <VariantTable 
                  title="Contexto Completo"
                  variants={[{ label: 'Todos os dados da campanha', variant: '{{dados_campanha}}', onCopy: (v) => handleCopy(v) }]}
                  onCopyAll={() => copyAll([{ variant: '{{dados_campanha}}' }], 'Contexto Completo')}
                />
                <VariantTable 
                  title="Etapa 1: Briefing"
                  variants={campaignBriefingVariants.map(v => ({ ...v, onCopy: (text) => handleCopy(text) }))}
                  onCopyAll={() => copyAll(campaignBriefingVariants, 'Briefing')}
                />
                <VariantTable 
                  title="Etapa 2: Canais"
                  variants={campaignChannelsVariants.map(v => ({ ...v, onCopy: (text) => handleCopy(text) }))}
                  onCopyAll={() => copyAll(campaignChannelsVariants, 'Canais')}
                />
                <VariantTable 
                  title="Etapa 3: Estratégia"
                  variants={campaignStrategyVariants.map(v => ({ ...v, onCopy: (text) => handleCopy(text) }))}
                  onCopyAll={() => copyAll(campaignStrategyVariants, 'Estratégia')}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="clients" className="border rounded-lg bg-card">
            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    </div>
                    Variantes de Clientes
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <VariantTable 
                  title="Dados do Cliente"
                  variants={clientVariants.map(v => ({ ...v, onCopy: (text) => handleCopy(text) }))}
                  onCopyAll={() => copyAll(clientVariants, 'Clientes')}
                />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="generic" className="border rounded-lg bg-card">
            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-500/10 rounded-lg flex items-center justify-center">
                    <Braces className="w-5 h-5 text-gray-500" />
                    </div>
                    Variantes Genéricas
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <VariantTable 
                  title="Entrada do Usuário"
                  variants={genericVariants.map(v => ({ ...v, onCopy: (text) => handleCopy(text) }))}
                  onCopyAll={() => copyAll(genericVariants, 'Genéricas')}
                />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="results" className="border rounded-lg bg-card">
            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-500" />
                    </div>
                    Variantes de Resultados (Avançado)
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground mb-4">Use estas variantes para criar prompts encadeados, onde o resultado de um agente alimenta o próximo. <span className="font-semibold text-foreground">Nota: Esta funcionalidade está em desenvolvimento ativo.</span></p>
              <div className="space-y-4">
                {resultsVariants.map(variant => <ResultVariantCard key={variant.variant} {...variant} />)}
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </>
  );
};

export default SystemVariants;