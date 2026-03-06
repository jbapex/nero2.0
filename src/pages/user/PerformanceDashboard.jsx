import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Target, BarChart, TrendingUp, MousePointerClick, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

const formatCurrency = (v) => {
  if (v == null || isNaN(v)) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};
const formatPercent = (v) => {
  if (v == null || isNaN(v)) return '0%';
  return `${Number(v).toFixed(1)}%`;
};

const PerformanceDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [integration, setIntegration] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [adsets, setAdsets] = useState([]);
  const [ads, setAds] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedAdsetId, setSelectedAdsetId] = useState('');
  const [selectedAdId, setSelectedAdId] = useState('');
  const [viewLevel, setViewLevel] = useState('campaign'); // account | campaign | adset | ad

  const hasAccess = useMemo(() => {
    if (!profile) return false;
    if (profile.user_type === 'super_admin') return true;
    return !!profile.plans?.has_ads_access || !!profile.has_ads_access;
  }, [profile]);

  const fetchData = useCallback(async () => {
    if (!user || !profile || !hasAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: intList, error: intErr } = await supabase
        .from('meta_ads_integrations')
        .select('id, is_active, last_sync')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (intErr) throw intErr;
      const activeInt = intList?.[0] ?? null;
      setIntegration(activeInt);

      if (!activeInt) {
        setAccounts([]);
        setCampaigns([]);
        setAdsets([]);
        setAds([]);
        setMetrics([]);
        setLoading(false);
        return;
      }

      const intId = activeInt.id;

      const [accRes, campRes, asetRes, adRes, metRes] = await Promise.all([
        supabase.from('meta_ads_accounts').select('id, meta_account_id, name').eq('integration_id', intId),
        supabase.from('meta_ads_campaigns').select('id, meta_campaign_id, meta_account_id, name').eq('integration_id', intId),
        supabase.from('meta_ads_adsets').select('id, meta_campaign_id, meta_adset_id, name').eq('integration_id', intId),
        supabase.from('meta_ads_ads').select('id, meta_adset_id, meta_ad_id, name').eq('integration_id', intId),
        supabase.from('meta_ads_metrics').select('level, meta_entity_id, spend, impressions, clicks, conversions, revenue').eq('integration_id', intId),
      ]);

      if (accRes.data != null) setAccounts(accRes.data);
      if (campRes.data != null) setCampaigns(campRes.data);
      if (asetRes.data != null) setAdsets(asetRes.data);
      if (adRes.data != null) setAds(adRes.data);
      if (metRes.data != null) setMetrics(metRes.data ?? []);
    } catch (e) {
      toast({ title: 'Erro ao carregar dados', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, profile, hasAccess, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-ads-sync');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Sincronização concluída', description: data?.message });
      fetchData();
    } catch (e) {
      toast({ title: 'Erro ao sincronizar', description: e?.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const campaignsForAccount = useMemo(() => {
    if (!selectedAccountId) return campaigns;
    return campaigns.filter((c) => String(c.meta_account_id) === String(selectedAccountId));
  }, [campaigns, selectedAccountId]);

  const adsetsForCampaign = useMemo(() => {
    if (!selectedCampaignId) return adsets;
    return adsets.filter((a) => String(a.meta_campaign_id) === String(selectedCampaignId));
  }, [adsets, selectedCampaignId]);

  const adsForAdset = useMemo(() => {
    if (!selectedAdsetId) return ads;
    return ads.filter((a) => String(a.meta_adset_id) === String(selectedAdsetId));
  }, [ads, selectedAdsetId]);

  const aggregatedByEntity = useMemo(() => {
    const map = {};
    for (const m of metrics) {
      const id = m.meta_entity_id ?? m.meta_campaign_id;
      if (!id) continue;
      const key = `${m.level ?? 'campaign'}:${id}`;
      if (!map[key]) {
        map[key] = { id, level: m.level ?? 'campaign', spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
      }
      map[key].spend += Number(m.spend) || 0;
      map[key].impressions += Number(m.impressions) || 0;
      map[key].clicks += Number(m.clicks) || 0;
      map[key].conversions += Number(m.conversions) || 0;
      map[key].revenue += Number(m.revenue) || 0;
    }
    return map;
  }, [metrics]);

  const tableRows = useMemo(() => {
    const nameById = {};
    campaigns.forEach((c) => { nameById[`campaign:${c.meta_campaign_id}`] = c.name ?? c.meta_campaign_id; });
    adsets.forEach((a) => { nameById[`adset:${a.meta_adset_id}`] = a.name ?? a.meta_adset_id; });
    ads.forEach((a) => { nameById[`ad:${a.meta_ad_id}`] = a.name ?? a.meta_ad_id; });
    accounts.forEach((a) => { nameById[`account:${a.meta_account_id}`] = a.name ?? a.meta_account_id; });

    if (viewLevel === 'account') {
      return accounts.map((acc) => {
        const campIds = campaigns.filter((c) => String(c.meta_account_id) === String(acc.meta_account_id)).map((c) => c.meta_campaign_id);
        const agg = campIds.reduce(
          (sum, cid) => {
            const k = `campaign:${cid}`;
            const a = aggregatedByEntity[k];
            if (a) {
              sum.spend += a.spend;
              sum.impressions += a.impressions;
              sum.clicks += a.clicks;
              sum.conversions += a.conversions;
              sum.revenue += a.revenue;
            }
            return sum;
          },
          { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
        );
        return { id: acc.meta_account_id, name: acc.name ?? acc.meta_account_id, ...agg };
      });
    }
    if (viewLevel === 'campaign') {
      let list = campaignsForAccount;
      return list.map((c) => {
        const a = aggregatedByEntity[`campaign:${c.meta_campaign_id}`] ?? {};
        return {
          id: c.meta_campaign_id,
          name: c.name ?? c.meta_campaign_id,
          spend: a.spend ?? 0,
          impressions: a.impressions ?? 0,
          clicks: a.clicks ?? 0,
          conversions: a.conversions ?? 0,
          revenue: a.revenue ?? 0,
        };
      });
    }
    if (viewLevel === 'adset') {
      let list = adsetsForCampaign;
      return list.map((a) => {
        const agg = aggregatedByEntity[`adset:${a.meta_adset_id}`] ?? {};
        return {
          id: a.meta_adset_id,
          name: a.name ?? a.meta_adset_id,
          spend: agg.spend ?? 0,
          impressions: agg.impressions ?? 0,
          clicks: agg.clicks ?? 0,
          conversions: agg.conversions ?? 0,
          revenue: agg.revenue ?? 0,
        };
      });
    }
    if (viewLevel === 'ad') {
      return adsForAdset.map((a) => {
        const agg = aggregatedByEntity[`ad:${a.meta_ad_id}`] ?? {};
        return {
          id: a.meta_ad_id,
          name: a.name ?? a.meta_ad_id,
          spend: agg.spend ?? 0,
          impressions: agg.impressions ?? 0,
          clicks: agg.clicks ?? 0,
          conversions: agg.conversions ?? 0,
          revenue: agg.revenue ?? 0,
        };
      });
    }
    return [];
  }, [viewLevel, accounts, campaignsForAccount, adsetsForCampaign, adsForAdset, aggregatedByEntity, campaigns]);

  const stats = useMemo(() => {
    const rows = tableRows;
    const totalRevenue = rows.reduce((s, r) => s + (r.revenue ?? 0), 0);
    const totalSpend = rows.reduce((s, r) => s + (r.spend ?? 0), 0);
    const totalImpressions = rows.reduce((s, r) => s + (r.impressions ?? 0), 0);
    const totalClicks = rows.reduce((s, r) => s + (r.clicks ?? 0), 0);
    const totalConversions = rows.reduce((s, r) => s + (r.conversions ?? 0), 0);
    const overallRoi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const overallCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    return {
      totalRevenue,
      totalSpend,
      totalCampaigns: rows.length,
      overallRoi,
      overallCtr,
      overallCpa,
    };
  }, [tableRows]);

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Você não tem acesso ao dashboard de performance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard de Performance</h1>
        <p className="text-lg text-muted-foreground mt-1">Analise o desempenho das suas campanhas Meta Ads.</p>
      </motion.div>

      {!integration && !loading && (
        <Card className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50">
          <CardHeader className="flex flex-row items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div>
              <CardTitle className="text-yellow-800 dark:text-yellow-300">Conecte sua conta para ver dados reais</CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-400">
                Em Configurações &gt; Integrações, salve um token do Graph API Explorer (Meta). Depois use Sincronizar para buscar campanhas e métricas.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/settings/integrations')}>Ir para Integrações</Button>
          </CardContent>
        </Card>
      )}

      {integration && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>Conta de anúncio, campanha, conjunto e anúncio</CardDescription>
              </div>
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Sincronizar
              </Button>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Conta de anúncio</label>
                <Select value={selectedAccountId || 'all'} onValueChange={(v) => { setSelectedAccountId(v === 'all' ? '' : v); setSelectedCampaignId(''); setSelectedAdsetId(''); setSelectedAdId(''); setViewLevel('campaign'); }}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.meta_account_id}>{a.name || a.meta_account_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Campanha</label>
                <Select value={selectedCampaignId || 'all'} onValueChange={(v) => { setSelectedCampaignId(v === 'all' ? '' : v); setSelectedAdsetId(''); setSelectedAdId(''); setViewLevel(v === 'all' ? 'campaign' : 'campaign'); }}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {campaignsForAccount.map((c) => (
                      <SelectItem key={c.id} value={c.meta_campaign_id}>{c.name || c.meta_campaign_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Conjunto de anúncios</label>
                <Select value={selectedAdsetId || 'all'} onValueChange={(v) => { setSelectedAdsetId(v === 'all' ? '' : v); setSelectedAdId(''); setViewLevel(v === 'all' ? 'adset' : 'adset'); }}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {adsetsForCampaign.map((a) => (
                      <SelectItem key={a.id} value={a.meta_adset_id}>{a.name || a.meta_adset_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Anúncio</label>
                <Select value={selectedAdId || 'all'} onValueChange={(v) => { setSelectedAdId(v === 'all' ? '' : v); setViewLevel(v === 'all' ? 'ad' : 'ad'); }}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {adsForAdset.map((a) => (
                      <SelectItem key={a.id} value={a.meta_ad_id}>{a.name || a.meta_ad_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Ver por</label>
                <Select value={viewLevel} onValueChange={setViewLevel}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">Conta</SelectItem>
                    <SelectItem value="campaign">Campanha</SelectItem>
                    <SelectItem value="adset">Conjunto</SelectItem>
                    <SelectItem value="ad">Anúncio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            {integration?.last_sync && (
              <p className="text-xs text-muted-foreground px-6 pb-4">Última sincronização: {new Date(integration.last_sync).toLocaleString('pt-BR')}</p>
            )}
          </Card>

          <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita total</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(stats.overallRoi)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investimento total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalSpend)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CTR médio</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(stats.overallCtr)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total (nível)</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
              </CardContent>
            </Card>
          </motion.div>

          <Card>
            <CardHeader>
              <CardTitle>Performance por {viewLevel === 'account' ? 'conta' : viewLevel === 'campaign' ? 'campanha' : viewLevel === 'adset' ? 'conjunto' : 'anúncio'}</CardTitle>
              <CardDescription>Métricas agregadas (últimos 30 dias)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Gasto</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                      <TableHead className="text-right">Impressões</TableHead>
                      <TableHead className="text-right">Cliques</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row, i) => {
                      const roi = row.spend > 0 ? ((row.revenue - row.spend) / row.spend) * 100 : 0;
                      const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
                      return (
                        <TableRow key={row.id || i}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.spend)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                          <TableCell className={`text-right font-semibold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(roi)}</TableCell>
                          <TableCell className="text-right">{Number(row.impressions).toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right">{Number(row.clicks).toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right">{formatPercent(ctr)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {!loading && tableRows.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">Nenhum dado para exibir. Sincronize os dados do Meta Ads.</div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PerformanceDashboard;
