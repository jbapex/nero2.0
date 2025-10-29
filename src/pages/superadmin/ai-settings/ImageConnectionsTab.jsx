import React, { useState, useEffect, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { Plus, Image as ImageIcon } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import ImageConnectionCard from '@/pages/superadmin/ai-settings/image-connections/ImageConnectionCard';
    import ImageConnectionDialog from '@/pages/superadmin/ai-settings/image-connections/ImageConnectionDialog';
    import ImageModelDialog from '@/pages/superadmin/ai-settings/image-connections/ImageModelDialog';

    const ImageConnectionsTab = () => {
      const [connections, setConnections] = useState([]);
      const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
      const [editingConnection, setEditingConnection] = useState(null);
      const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
      const [editingModel, setEditingModel] = useState(null);
      const [connectionForModel, setConnectionForModel] = useState(null);

      const fetchConnections = useCallback(async () => {
        const { data, error } = await supabase
          .from('ai_connections')
          .select('*, ai_models(*)')
          .eq('capabilities->>image_generation', 'true')
          .order('created_at', { ascending: false });

        if (error) {
          toast({ title: "Erro ao carregar conexões de imagem", description: error.message, variant: "destructive" });
        } else {
          setConnections(data);
        }
      }, []);

      useEffect(() => {
        fetchConnections();
      }, [fetchConnections]);

      const handleEditConnection = (connection) => {
        setEditingConnection(connection);
        setIsConnectionDialogOpen(true);
      };

      const handleDeleteConnection = async (connectionId) => {
        const { error } = await supabase.from('ai_connections').delete().eq('id', connectionId);
        if (error) {
          toast({ title: "Erro ao remover conexão", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Conexão removida!", description: "A configuração foi removida com sucesso." });
          fetchConnections();
        }
      };

      const handleAddModel = (connection) => {
        setEditingModel(null);
        setConnectionForModel(connection);
        setIsModelDialogOpen(true);
      };

      const handleEditModel = (model, connection) => {
        setEditingModel(model);
        setConnectionForModel(connection);
        setIsModelDialogOpen(true);
      };

      const handleDeleteModel = async (modelId) => {
        const { error } = await supabase.from('ai_models').delete().eq('id', modelId);
        if (error) {
          toast({ title: "Erro ao remover modelo", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Modelo removido!", description: "O modelo foi removido com sucesso." });
          fetchConnections();
        }
      };

      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <p className="text-muted-foreground mb-4 sm:mb-0">Gerencie as chaves de API e modelos para provedores de IA de imagem.</p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground glow-effect" onClick={() => { setEditingConnection(null); setIsConnectionDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Conexão de Imagem
            </Button>
          </div>

          <ImageConnectionDialog
            isOpen={isConnectionDialogOpen}
            setIsOpen={setIsConnectionDialogOpen}
            editingConnection={editingConnection}
            onFinished={fetchConnections}
          />

          <ImageModelDialog
            isOpen={isModelDialogOpen}
            setIsOpen={setIsModelDialogOpen}
            editingModel={editingModel}
            connection={connectionForModel}
            onFinished={() => {
              fetchConnections();
              setConnectionForModel(null);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((connection, index) => (
              <ImageConnectionCard
                key={connection.id}
                connection={connection}
                index={index}
                onEditConnection={handleEditConnection}
                onDeleteConnection={handleDeleteConnection}
                onAddModel={handleAddModel}
                onEditModel={handleEditModel}
                onDeleteModel={handleDeleteModel}
                onUpdate={fetchConnections}
              />
            ))}
          </div>

          {connections.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma conexão de imagem</h3>
              <p className="text-muted-foreground mb-6">Comece configurando sua primeira conexão com um provedor de IA de imagem.</p>
              <Button onClick={() => { setEditingConnection(null); setIsConnectionDialogOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Configurar Conexão
              </Button>
            </motion.div>
          )}
        </div>
      );
    };

    export default ImageConnectionsTab;