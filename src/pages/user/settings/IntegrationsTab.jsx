import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, CheckCircle, Loader2 } from 'lucide-react';

const IntegrationsTab = () => {
  const { user } = useAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasIntegration, setHasIntegration] = useState(false);

  const checkIntegration = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('meta_ads_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    setHasIntegration(!!data);
  }, [user?.id]);

  useEffect(() => {
    checkIntegration();
  }, [checkIntegration]);

  const handleSaveToken = async () => {
    const token = (tokenInput || '').trim();
    if (!token) {
      toast.error('Informe o token do Graph API');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-ads-save-token', {
        body: { access_token: token },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Token salvo. Use Sincronizar na página Performance para buscar campanhas.');
      setTokenInput('');
      await checkIntegration();
    } catch (e) {
      toast.error('Erro ao salvar token', { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Meta Ads (Facebook / Instagram)
          </CardTitle>
          <CardDescription>
            Cole o token de acesso do Graph API Explorer para conectar suas contas de anúncio. Em Configurações do Graph API Explorer, gere um token com permissões ads_read e ads_management.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasIntegration && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Conectado (token salvo). Use a página Performance para sincronizar e ver dados.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="meta-token">Token do Graph API</Label>
            <Input
              id="meta-token"
              type="password"
              placeholder="Cole seu token aqui"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Button onClick={handleSaveToken} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar token
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsTab;
