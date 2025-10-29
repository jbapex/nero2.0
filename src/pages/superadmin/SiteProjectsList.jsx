import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Globe, Loader2, Trash2, Edit, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Helmet } from 'react-helmet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SiteProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('site_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'Erro ao buscar projetos',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setProjects(data);
      }
      setIsLoading(false);
    };

    fetchProjects();
  }, [toast]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: 'Nome inválido',
        description: 'Por favor, insira um nome para o projeto.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    const { data, error } = await supabase
      .from('site_projects')
      .insert({
        name: newProjectName,
        user_id: user.id,
        html_content: '<!-- Comece a construir seu site incrível aqui! -->',
        chat_history: [{ role: 'assistant', content: "Olá! Sou Horizons, seu assistente de criação de sites. O que vamos construir hoje?" }],
      })
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      toast({
        title: 'Erro ao criar projeto',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Projeto criado!',
        description: `O projeto "${newProjectName}" foi criado com sucesso.`,
      });
      navigate(`/superadmin/criar-site/${data.id}`);
    }
  };
  
  const handleDeleteProject = async (projectId) => {
    const { error } = await supabase
      .from('site_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast({
        title: 'Erro ao excluir projeto',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setProjects(projects.filter(p => p.id !== projectId));
      toast({
        title: 'Projeto excluído',
        description: 'O projeto foi removido com sucesso.',
      });
    }
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
    <>
      <Helmet>
        <title>Projetos de Site - Super Admin</title>
        <meta name="description" content="Gerencie e crie novos projetos de site com o assistente de IA." />
      </Helmet>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projetos de Site</h1>
            <p className="text-muted-foreground mt-1">Crie e gerencie seus sites gerados por IA.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="mt-4 sm:mt-0">
                <Plus className="mr-2 h-4 w-4" /> Criar Novo Projeto
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Criar um novo projeto de site</AlertDialogTitle>
                <AlertDialogDescription>
                  Dê um nome ao seu novo projeto para começar. Você poderá alterá-lo mais tarde.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Ex: Landing Page para App de Fitness"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isCreating}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateProject} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Projeto
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence>
            {projects.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {projects.map((project) => (
                  <motion.div key={project.id} variants={itemVariants}>
                    <Card className="h-full flex flex-col hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300 bg-card text-card-foreground border">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-bold text-card-foreground">{project.name}</CardTitle>
                            <CardDescription className="text-muted-foreground">
                              Atualizado em: {new Date(project.updated_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/superadmin/criar-site/${project.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto "{project.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteProject(project.id)} className="bg-destructive hover:bg-destructive/90">
                                      Sim, excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <div className="p-4 pt-0 mt-auto">
                        <Button className="w-full" onClick={() => navigate(`/superadmin/criar-site/${project.id}`)}>
                          <Edit className="mr-2 h-4 w-4" /> Abrir Editor
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 border-2 border-dashed rounded-lg"
              >
                <img  alt="Ícone de um site em construção" src="https://images.unsplash.com/photo-1572891458752-1fde7b8074b6" className="mx-auto h-12 w-12 text-muted-foreground" src="https://images.unsplash.com/photo-1558798516-8f5a6bbfab8c" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum projeto de site encontrado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comece criando seu primeiro projeto para vê-lo aqui.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
};

export default SiteProjectsList;