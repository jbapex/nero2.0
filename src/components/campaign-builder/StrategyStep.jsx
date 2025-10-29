import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const biddingStrategies = [
    { value: 'cpc', label: 'CPC (Custo por Clique)' },
    { value: 'cpm', label: 'CPM (Custo por Mil Impressões)' },
    { value: 'cpa', label: 'CPA (Custo por Aquisição)' },
    { value: 'roas', label: 'ROAS (Retorno sobre Gasto com Anúncios)' },
    { value: 'maximize_clicks', label: 'Maximizar Cliques' },
    { value: 'maximize_conversions', label: 'Maximizar Conversões' },
    { value: 'manual', label: 'Manual' },
];

const StrategyStep = ({ data, updateData }) => {
    return (
        <div className="grid grid-cols-1 gap-6">
             <div className="space-y-2">
                <Label htmlFor="bidding_strategy">Estratégia de Lances (Bidding)</Label>
                <Select value={data.bidding_strategy || ''} onValueChange={value => updateData('bidding_strategy', value)}>
                    <SelectTrigger id="bidding_strategy" className="w-full">
                        <SelectValue placeholder="Selecione a principal estratégia..." />
                    </SelectTrigger>
                    <SelectContent>
                        {biddingStrategies.map(strategy => (
                            <SelectItem key={strategy.value} value={strategy.value}>
                                {strategy.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="kpis">Métricas de Sucesso (KPIs)</Label>
                <Textarea 
                    id="kpis" 
                    value={data.kpis || ''} 
                    onChange={e => updateData('kpis', e.target.value)} 
                    placeholder="Defina as metas quantitativas. Ex: CTR > 2%, CPA < R$50, ROAS > 4" 
                    rows={3}
                    className="w-full"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="personas">Personas Detalhadas</Label>
                <Textarea 
                    id="personas" 
                    value={data.personas || ''} 
                    onChange={e => updateData('personas', e.target.value)} 
                    placeholder="Descreva as personas da sua campanha em formato de lista ou JSON. Inclua dores, desejos, motivações e como seu produto/serviço os ajuda." 
                    rows={6}
                    className="w-full"
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="content_strategy">Estratégia de Conteúdo e Remarketing</Label>
                <Textarea 
                    id="content_strategy" 
                    value={data.content_strategy || ''} 
                    onChange={e => updateData('content_strategy', e.target.value)} 
                    placeholder="Quais tipos de conteúdo serão criados (Ex: vídeos, blogs)? Haverá uma estratégia de remarketing para quem interagiu com a campanha?" 
                    rows={4}
                    className="w-full"
                />
            </div>
        </div>
    );
};

export default StrategyStep;