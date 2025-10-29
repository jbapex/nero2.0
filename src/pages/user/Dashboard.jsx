import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, FileText, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const shortcuts = [
    {
      title: 'Agentes IA',
      description: 'Acesse todos os seus assistentes de IA para gerar conteúdo.',
      icon: Bot,
      path: '/dashboard/agentes-ia',
      color: 'text-primary'
    },
    {
      title: 'Campanhas',
      description: 'Crie e gerencie as suas campanhas de marketing.',
      icon: FileText,
      path: '/dashboard/campanhas',
      color: 'text-green-500'
    },
    {
      title: 'Histórico',
      description: 'Revise todas as gerações de conteúdo anteriores.',
      icon: History,
      path: '/dashboard/historico',
      color: 'text-purple-500'
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Seu Painel</h1>
        <p className="text-lg text-muted-foreground">
          Olá, <span className="font-semibold text-primary">{user?.user_metadata?.name || 'usuário'}</span>! Bem-vindo(a) de volta.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8"
        initial="hidden"
        animate="visible"
      >
        {shortcuts.map((shortcut, index) => (
          <motion.div key={shortcut.title} custom={index} variants={cardVariants}>
            <Card className="h-full flex flex-col hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <shortcut.icon className={`w-6 h-6 ${shortcut.color}`} />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-card-foreground">{shortcut.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="text-muted-foreground">{shortcut.description}</CardDescription>
              </CardContent>
              <div className="p-6 pt-0">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(shortcut.path)}
                >
                  Acessar
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default UserDashboard;