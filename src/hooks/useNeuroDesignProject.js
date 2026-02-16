import { useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

/**
 * Retorna getOrCreateProject para usar em nós do fluxo que fazem upload de imagem (Neuro Design).
 * O projeto é o último do usuário ou um novo "Meu projeto".
 */
export function useNeuroDesignProject() {
  const { user } = useAuth();
  const { toast } = useToast();

  const getOrCreateProject = useCallback(async () => {
    if (!user) return null;
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('neurodesign_projects')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fetchError) {
        toast({ title: 'Erro ao carregar projeto', description: fetchError.message, variant: 'destructive' });
        return null;
      }
      if (existing) return existing;
      const { data: created, error: insertError } = await supabase
        .from('neurodesign_projects')
        .insert({ name: 'Meu projeto', owner_user_id: user.id })
        .select()
        .single();
      if (insertError) {
        toast({ title: 'Erro ao criar projeto', description: insertError.message, variant: 'destructive' });
        return null;
      }
      return created;
    } catch (e) {
      toast({ title: 'Erro', description: e?.message || 'Tabela pode não existir.', variant: 'destructive' });
      return null;
    }
  }, [user, toast]);

  return { getOrCreateProject };
}
