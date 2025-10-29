import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Target, BarChart, TrendingUp, MousePointerClick, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color }) => {
  const Icon = icon;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

const PerformanceDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [integrationActive, setIntegrationActive] = useState(false);

  const hasAccess = useMemo(() => {
    if (!profile) return false;
    if (profile.user_type === 'super_admin') return true;
    return !!profile.plans?.has_ads_access || !!profile.has_ads_access;
  }, [profile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !profile) return;
      
      if (!hasAccess) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: integrations, error: intError } = await supabase
        .from('meta_ads_integrations')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (intError) {
        toast({ title: 'Erro ao verificar integração', description: intError.message, variant: 'destructive' });
      }

      const isActive = integrations && integrations.length > 0;
      setIntegrationActive(isActive);

      if (isActive) {
        const integration = integrations[0];
        const { data: metricsData, error: metricsError } = await supabase
          .from('meta_ads_metrics')
          .select(`*, meta_ads_campaigns!inner(name)`)
          .in('meta_campaign_id', (await supabase.from('meta_ads_campaigns').select('meta_campaign_id').eq('integration_id', integration.id)).data.map(c => c.meta_campaign_id));
        
        if (metricsError) {
          toast({ title: 'Erro ao carregar métricas reais', description: metricsError.message, variant: 'destructive' });
        } else {
            const aggregated = metricsData.reduce((acc, metric) => {
                const id = metric.meta_campaign_id;
                if (!acc[id]) {
                    acc[id] = {
                        name: metric.meta_ads_campaigns.name,
                        investment: 0,
                        revenue: 0,
                        clicks: 0,
                        impressions: 0,
                        conversions: 0,
                    };
                }
                acc[id].investment += metric.spend || 0;
                acc[id].revenue += metric.revenue || 0;
                acc[id].clicks += metric.clicks || 0;
                acc[id].impressions += metric.impressions || 0;
                acc[id].conversions += metric.conversions || 0;
                return acc;
            }, {});
            setCampaigns(Object.values(aggregated));
        }

      } else {
        const { data, error } = await supabase.from('campaigns').select('*').eq('user_id', user.id);
        if (error) {
          toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
        } else {
          const campaignsWithMockData = data.map(c => ({
            ...c,
            investment: c.investment || Math.random() * 5000 + 1000,
            revenue: c.revenue || Math.random() * 20000 + 2000,
            clicks: c.clicks || Math.floor(Math.random() * 10000 + 500),
            impressions: c.impressions || Math.floor(Math.random() * 200000 + 10000),
            conversions: c.conversions || Math.floor(Math.random() * 500 + 50),
          }));
          setCampaigns(campaignsWithMockData);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user, profile, toast, hasAccess]);

  const stats = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const totalInvestment = campaigns.reduce((acc, c) => acc + (c.investment || 0), 0);
    const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
    const totalConversions = campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);

    const overallRoi = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0;
    const overallCpa = totalConversions > 0 ? totalInvestment / totalConversions : 0;
    const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return { totalCampaigns, totalInvestment, totalRevenue, overallRoi, overallCpa, overallCtr };
  }, [campaigns]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatPercent = (value) => `${value.toFixed(2)}%`;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground mt-2">Este dashboard de performance não está incluído no seu plano atual.</p>
        <Button className="mt-6" onClick={() => navigate('/ferramentas')}>Voltar para Ferramentas</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard de Performance</h1>
        <p className="text-lg text-muted-foreground mt-1">Analise o desempenho geral das suas campanhas.</p>
      </motion.div>

      {!integrationActive && !loading && (
        <Card className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50">
            <CardHeader className="flex flex-row items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <div>
                    <CardTitle className="text-yellow-800 dark:text-yellow-300">Conecte sua conta para ver dados reais</CardTitle>
                    <CardDescription className="text-yellow-700 dark:text-yellow-400">
                        Os dados abaixo são apenas exemplos. Conecte sua conta do Meta Ads para visualizar a performance real das suas campanhas.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Button onClick={() => navigate('/settings/integrations')}>Conectar Meta Ads</Button>
            </CardContent>
        </Card>
      )}

      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
      >
        <StatCard title="Receita Total" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="text-green-500" />
        <StatCard title="ROI Médio" value={formatPercent(stats.overallRoi)} icon={TrendingUp} color="text-blue-500" />
        <StatCard title="CPA Médio" value={formatCurrency(stats.overallCpa)} icon={Target} color="text-red-500" />
        <StatCard title="Investimento Total" value={formatCurrency(stats.totalInvestment)} icon={DollarSign} />
        <StatCard title="CTR Médio" value={formatPercent(stats.overallCtr)} icon={MousePointerClick} />
        <StatCard title="Total de Campanhas" value={stats.totalCampaigns} icon={BarChart} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Performance por Campanha {integrationActive && "(Dados Reais - Meta Ads)"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c, i) => {
                  const roi = c.investment > 0 ? ((c.revenue - c.investment) / c.investment) * 100 : 0;
                  const cpa = c.conversions > 0 ? c.investment / c.conversions : 0;
                  const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
                  return (
                    <TableRow key={c.id || i}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.investment)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.revenue)}</TableCell>
                      <TableCell className={`text-right font-semibold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(roi)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cpa)}</TableCell>
                      <TableCell className="text-right">{formatPercent(ctr)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
             {campaigns.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Nenhuma campanha encontrada para exibir os dados.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PerformanceDashboard;