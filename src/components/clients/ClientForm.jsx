import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

const clientSchema = z.object({
  name: z.string().min(2, { message: "O nome do cliente deve ter pelo menos 2 caracteres." }),
  creator_name: z.string().max(50, "Máximo de 50 caracteres").optional().nullable(),
  niche: z.string().max(50, "Máximo de 50 caracteres").optional().nullable(),
  style_in_3_words: z.string().max(100, "Máximo de 100 caracteres").optional().nullable(),
  product_to_promote: z.string().max(140, "Máximo de 140 caracteres").optional().nullable(),
  target_audience: z.string().max(100, "Máximo de 100 caracteres").optional().nullable(),
  success_cases: z.string().max(200, "Máximo de 200 caracteres").optional().nullable(),
  profile_views: z.string().max(100, "Máximo de 100 caracteres").optional().nullable(),
  followers: z.string().max(100, "Máximo de 100 caracteres").optional().nullable(),
  appearance_format: z.string().max(100, "Máximo de 100 caracteres").optional().nullable(),
  catchphrases: z.string().max(100, "Máximo de 100 caracteres").optional().nullable(),
  phone: z.string().optional().nullable(),
  about: z.string().optional().nullable(),
});

const ClientForm = ({ client, onSave, onCancel }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: client || {},
  });

  useEffect(() => {
    const defaultValues = {
      name: '',
      creator_name: '',
      niche: '',
      style_in_3_words: '',
      product_to_promote: '',
      target_audience: '',
      success_cases: '',
      profile_views: '',
      followers: '',
      appearance_format: '',
      catchphrases: '',
      phone: '',
      about: '',
    };
    reset(client ? { ...defaultValues, ...client } : defaultValues);
  }, [client, reset]);

  const onSubmit = async (data) => {
    if (!user) return;
    setIsSubmitting(true);

    const dataToSave = {
      ...data,
      user_id: user.id,
    };

    let error;
    if (client && client.id) {
      ({ error } = await supabase.from('clients').update(dataToSave).eq('id', client.id));
    } else {
      ({ error } = await supabase.from('clients').insert(dataToSave));
    }

    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Erro ao salvar cliente', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Cliente ${client && client.id ? 'atualizado' : 'criado'}!`, description: 'Operação realizada com sucesso.' });
      onSave();
    }
  };

  return (
    <div className="flex flex-col h-full">
        <DrawerHeader>
            <DrawerTitle>{client ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DrawerTitle>
            <DrawerDescription>
                Preencha as informações abaixo para {client ? 'atualizar o' : 'criar um novo'} cliente.
            </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-grow overflow-hidden px-4">
            <ScrollArea className="flex-grow pr-4 -mr-4">
                <div className="space-y-6 pb-6">
                    <div className="space-y-1">
                        <Label htmlFor="name" className="font-bold text-lg">Nome do Cliente</Label>
                        <Input id="name" {...register('name')} placeholder="Ex: Empresa do Josias" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="creator_name">Seu nome ou nome do criador</Label>
                        <Input id="creator_name" {...register('creator_name')} placeholder="Ex: Josias Bonfim" />
                        {errors.creator_name && <p className="text-sm text-destructive">{errors.creator_name.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="niche">Seu nicho</Label>
                        <Input id="niche" {...register('niche')} placeholder="Ex: Marketing Digital" />
                        {errors.niche && <p className="text-sm text-destructive">{errors.niche.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="style_in_3_words">Defina seu estilo em 3 palavras</Label>
                        <Input id="style_in_3_words" {...register('style_in_3_words')} placeholder="Ex: Divertido, direto, inspirador" />
                        {errors.style_in_3_words && <p className="text-sm text-destructive">{errors.style_in_3_words.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="product_to_promote">Você tem algum produto/serviço específico para promover? Qual?</Label>
                        <Input id="product_to_promote" {...register('product_to_promote')} placeholder="Ex: Consultoria de Marketing" />
                        {errors.product_to_promote && <p className="text-sm text-destructive">{errors.product_to_promote.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="target_audience">Público-alvo principal</Label>
                        <Textarea id="target_audience" {...register('target_audience')} placeholder="Ex: Mulheres de 18-35 anos interessadas em maquiagem acessível..." />
                        {errors.target_audience && <p className="text-sm text-destructive">{errors.target_audience.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="success_cases">Casos de sucesso</Label>
                        <Textarea id="success_cases" {...register('success_cases')} placeholder="Quais são grandes feitos que você possui para o seu mercado, comente sobre sua experiência no nicho" />
                        {errors.success_cases && <p className="text-sm text-destructive">{errors.success_cases.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                        <Label htmlFor="profile_views">Total de visualizações do perfil</Label>
                        <Input id="profile_views" {...register('profile_views')} placeholder="Ex: 100 Mil de views" />
                        {errors.profile_views && <p className="text-sm text-destructive">{errors.profile_views.message}</p>}
                        </div>
                        <div className="space-y-1">
                        <Label htmlFor="followers">Total de seguidores</Label>
                        <Input id="followers" {...register('followers')} placeholder="Ex: 10k de seguidores" />
                        {errors.followers && <p className="text-sm text-destructive">{errors.followers.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="appearance_format">Formato de aparição</Label>
                        <Input id="appearance_format" {...register('appearance_format')} placeholder="Ex: Apareço falando / voz em off / só texto e imagens" />
                        {errors.appearance_format && <p className="text-sm text-destructive">{errors.appearance_format.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="catchphrases">Bordões ou frases-chave que usa sempre</Label>
                        <Input id="catchphrases" {...register('catchphrases')} placeholder="Ex: “Anota essa!”" />
                        {errors.catchphrases && <p className="text-sm text-destructive">{errors.catchphrases.message}</p>}
                    </div>
                    
                    <div className="space-y-1">
                        <Label htmlFor="phone">Telefone (Opcional)</Label>
                        <Input id="phone" {...register('phone')} placeholder="(11) 99999-9999" />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="about">Sobre o Cliente (Opcional)</Label>
                        <Textarea id="about" {...register('about')} placeholder="Descreva o que o cliente vende, um pouco sobre a empresa, etc." rows={3} />
                    </div>
                </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
                <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
                </Button>
            </div>
        </form>
    </div>
  );
};

export default ClientForm;