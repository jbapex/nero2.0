import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, Layers, DollarSign, Activity } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    plans: 0,
    modules: 0,
    revenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [usersRes, plansRes, modulesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('plans').select('id', { count: 'exact', head: true }),
        supabase.from('modules').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        users: usersRes.count ?? 0,
        plans: plansRes.count ?? 0,
        modules: modulesRes.count ?? 0,
        revenue: 0,
      });
    } catch (_e) {
      setStats({ users: 0, plans: 0, modules: 0, revenue: 0 });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetchStats();
      try {
        const { data } = await supabase.from('profiles').select('name, created_at').order('created_at', { ascending: false }).limit(10);
        if (mounted) setRecentActivities(data || []);
      } catch (_e) {
        if (mounted) setRecentActivities([]);
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard do Super Admin</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema Neuro Ápice.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.plans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulos Criados</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.modules}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {Number(stats.revenue).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade do Sistema
            </CardTitle>
            <CardDescription>Últimas 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Gráfico de atividades em desenvolvimento.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {recentActivities.length === 0 ? (
                <li className="text-muted-foreground">Nenhuma atividade recente.</li>
              ) : (
                recentActivities.map((a, i) => (
                  <li key={i} className="flex justify-between">
                    <span>Novo usuário cadastrado — {a.name || 'Sem nome'}</span>
                    <span className="text-muted-foreground text-xs">há pouco</span>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
