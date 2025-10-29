import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, Bot, Sparkles, Facebook, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';

const AdsInteligente = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ads_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar agentes', description: error.message, variant: 'destructive' });
    } else {
      setAgents(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleUseAgent = (agentId) => {
    navigate(`/ferramentas/criador-de-anuncios/chat/${agentId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2 flex items-center">
          <Megaphone className="w-7 h-7 mr-2" />
          ADS Inteligente
        </h1>
        <p className="text-base text-muted-foreground">
          Sua central de comando para criar campanhas de anúncios de alta performance.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center mt-8 h-[calc(100vh-200px)]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {agents.map((agent) => (
            <motion.div key={agent.id} variants={itemVariants}>
              <Card className={cn("h-full flex flex-col hover:shadow-lg transition-all duration-300", agent.agent_type === 'specialized' ? 'border-primary/50 hover:border-primary' : 'hover:border-muted-foreground/30')}>
                <CardHeader className="flex flex-row items-start gap-3 p-4 pb-2">
                  <div className={cn("p-2 rounded-lg", agent.agent_type === 'specialized' ? 'bg-primary/10' : 'bg-muted')}>
                    {agent.platform === 'meta_ads' ? <Facebook className="w-5 h-5 text-blue-600" /> : <Bot className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-1 text-base">
                      {agent.name}
                      {agent.agent_type === 'specialized' && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    </CardTitle>
                    <CardDescription className="text-xs">{agent.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between p-4 pt-0">
                  <div>
                    {agent.agent_type === 'specialized' && agent.capabilities && agent.capabilities.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Capacidades:</p>
                        <div className="flex flex-wrap gap-1">
                            {agent.capabilities.map((capability, index) => (
                                <span key={index} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                    {capability}
                                </span>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                  <Button onClick={() => handleUseAgent(agent.id)} className="w-full mt-4 text-sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Usar Agente
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && agents.length === 0 && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
            <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-1">Nenhum Agente de ADS Encontrado</h3>
            <p className="text-sm text-muted-foreground">O administrador ainda não configurou nenhum agente para este módulo.</p>
        </motion.div>
      )}
    </div>
  );
};

export default AdsInteligente;