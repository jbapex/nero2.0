import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Facebook, Loader2, CheckCircle, XCircle, RefreshCw, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const IntegrationsTab = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [integration, setIntegration] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSavingUrls, setIsSavingUrls] = useState(false);
    const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');
    const [dataDeletionUrl, setDataDeletionUrl] = useState('');
    
    const fetchIntegration = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('meta_ads_integrations')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle to avoid error on 0 rows
            
        if (error) {
            toast({ title: "Erro ao buscar integração", description: error.message, variant: 'destructive' });
        } else {
            setIntegration(data);
            if (data) {
                setPrivacyPolicyUrl(data.privacy_policy_url || '');
                setDataDeletionUrl(data.data_deletion_instructions_url || '');
            }
        }
        setLoading(false);
    }, [user, toast]);
    
    useEffect(() => {
        fetchIntegration();
    }, [fetchIntegration]);
    
    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const { data, error } = await supabase.functions.invoke('meta-ads-auth');
            if (error) throw error;
            window.location.href = data.authUrl;
        } catch (error) {
            toast({ title: "Erro ao iniciar conexão", description: error.message, variant: 'destructive' });
            setIsConnecting(false);
        }
    };
    
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const { data, error } = await supabase.functions.invoke('meta-ads-sync');
            if (error) throw error;
            toast({ title: "Sincronização Concluída", description: data.message });
            fetchIntegration();
        } catch (error) {
            toast({ title: "Erro ao sincronizar dados", description: error.message, variant: 'destructive' });
        } finally {
            setIsSyncing(false);
        }
    }
    
    const handleDisconnect = async () => {
        if (!integration) return;
        const { error } = await supabase.from('meta_ads_integrations').delete().eq('id', integration.id);
        if (error) {
            toast({ title: "Erro ao desconectar", description: error.message, variant: 'destructive' });
        } else {
            toast({ title: "Desconectado", description: "A integração com o Meta Ads foi removida." });
            setIntegration(null);
            setPrivacyPolicyUrl('');
            setDataDeletionUrl('');
        }
    };

    const handleSaveUrls = async () => {
        if (!user || !integration) {
            toast({ title: "Ação necessária", description: "Conecte a integração com o Meta Ads antes de salvar as URLs.", variant: 'destructive' });
            return;
        };
        setIsSavingUrls(true);
        const { error } = await supabase
            .from('meta_ads_integrations')
            .update({ 
                privacy_policy_url: privacyPolicyUrl, 
                data_deletion_instructions_url: dataDeletionUrl 
            })
            .eq('user_id', user.id);
        
        if (error) {
            toast({ title: "Erro ao salvar URLs", description: error.message, variant: 'destructive' });
        } else {
            toast({ title: "URLs Salvas!", description: "As URLs foram atualizadas com sucesso." });
            fetchIntegration(); // Re-fetch to ensure state is consistent
        }
        setIsSavingUrls(false);
    };
    
    if (loading) {
        return <div className="flex justify-center items-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Integração com Meta Ads</CardTitle>
                    <CardDescription>
                        Conecte sua conta do Facebook Business para sincronizar campanhas e métricas automaticamente com o seu dashboard de performance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center justify-between p-6 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Facebook className="w-10 h-10 text-blue-600" />
                            <div>
                                <h3 className="font-semibold text-lg">Meta Ads (Facebook & Instagram)</h3>
                                {integration && integration.is_active ? (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Conectado</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <XCircle className="w-4 h-4" />
                                        <span>Não conectado</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4 sm:mt-0">
                        {integration && integration.is_active ? (
                            <>
                                <Button onClick={handleSync} disabled={isSyncing}>
                                    {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    Sincronizar
                                </Button>
                                <Button variant="destructive" onClick={handleDisconnect}>Desconectar</Button>
                            </>
                        ) : (
                            <Button onClick={handleConnect} disabled={isConnecting}>
                                {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Conectar com Facebook
                            </Button>
                        )}
                        </div>
                    </div>
                    {integration && integration.last_sync && (
                        <p className="text-xs text-muted-foreground mt-2 text-right">
                            Última sincronização: {new Date(integration.last_sync).toLocaleString('pt-BR')}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>URLs para Meta Ads</CardTitle>
                    <CardDescription>
                        Forneça as URLs da sua Política de Privacidade e das Instruções de Exclusão de Dados, conforme exigido pela Meta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="privacyPolicyUrl">URL da Política de Privacidade</Label>
                        <Input
                            id="privacyPolicyUrl"
                            type="url"
                            placeholder="https://seusite.com/politica-de-privacidade"
                            value={privacyPolicyUrl}
                            onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="dataDeletionUrl">URL de Instruções de Exclusão de Dados</Label>
                        <Input
                            id="dataDeletionUrl"
                            type="url"
                            placeholder="https://seusite.com/excluir-dados"
                            value={dataDeletionUrl}
                            onChange={(e) => setDataDeletionUrl(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <Button onClick={handleSaveUrls} disabled={isSavingUrls}>
                        {isSavingUrls ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar URLs
                    </Button>
                    {integration && privacyPolicyUrl && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Política de Privacidade atual: <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{privacyPolicyUrl}</a>
                        </p>
                    )}
                    {integration && dataDeletionUrl && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Instruções de Exclusão de Dados atual: <a href={dataDeletionUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{dataDeletionUrl}</a>
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default IntegrationsTab;