import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Loader2, Trash2, Edit, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('clients') // 'clients' table is used for accounts
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao buscar contas', description: error.message, variant: 'destructive' });
    } else {
      setAccounts(data);
    }
    setIsLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenDialog = (account = null) => {
    setEditingAccount(account);
    setFormData(account ? { name: account.name, description: account.description || '' } : { name: '', description: '' });
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Nome inválido', description: 'O nome da conta é obrigatório.', variant: 'destructive' });
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    let error;
    if (editingAccount) {
      ({ error } = await supabase.from('clients').update(formData).eq('id', editingAccount.id));
    } else {
      ({ error } = await supabase.from('clients').insert({ ...formData, user_id: user.id }));
    }
    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Erro ao salvar conta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Conta ${editingAccount ? 'atualizada' : 'criada'}!`, description: 'Operação realizada com sucesso.' });
      setIsDialogOpen(false);
      fetchAccounts();
    }
  };

  const handleDeleteAccount = async (accountId) => {
    const { error } = await supabase.from('clients').delete().eq('id', accountId);
    if (error) {
      toast({ title: 'Erro ao excluir conta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Conta excluída', description: 'A conta foi removida com sucesso.' });
      fetchAccounts();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Contas</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas contas e as campanhas associadas.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Conta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : accounts.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {accounts.map((account) => (
            <motion.div key={account.id} variants={itemVariants}>
              <Card className="h-full flex flex-col hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300 bg-card text-card-foreground border">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-card-foreground">{account.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(account)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Você tem certeza?</DialogTitle>
                              <DialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta "{account.name}" e suas campanhas associadas.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button onClick={() => handleDeleteAccount(account.id)} variant="destructive">Sim, excluir</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="text-muted-foreground pt-2">{account.description || 'Sem descrição'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow" />
                <div className="p-4 border-t">
                  <Button className="w-full" onClick={() => navigate(`/contas/${account.id}/campanhas`)}>
                    Ver Campanhas
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
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhuma conta encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece adicionando sua primeira conta para vê-la aqui.
          </p>
        </motion.div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
              <DialogDescription>
                Preencha as informações da conta abaixo.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label htmlFor="account-name" className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                <Input
                  id="account-name"
                  placeholder="Ex: Minha Loja Online"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="account-description" className="block text-sm font-medium text-gray-700 mb-1">Descrição (Opcional)</label>
                <Textarea
                  id="account-description"
                  placeholder="Ex: Loja de produtos artesanais para pets."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;