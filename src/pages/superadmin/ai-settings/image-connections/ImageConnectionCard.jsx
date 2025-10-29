import React from 'react';
    import { motion } from 'framer-motion';
    import { Edit, Trash2, Key, Image as ImageIcon, Plus, Power, PowerOff } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Switch } from '@/components/ui/switch';
    import { Label } from '@/components/ui/label';
    import { supabase } from '@/lib/customSupabaseClient';
    import { toast } from '@/components/ui/use-toast';

    const ImageConnectionCard = ({ connection, index, onEditConnection, onDeleteConnection, onAddModel, onEditModel, onDeleteModel, onUpdate }) => {
      const maskApiKey = (key) => {
        if (!key) return '';
        return key.slice(0, 4) + '...'.repeat(Math.min(3, key.length - 8)) + key.slice(-4);
      };

      const handleToggleActive = async (shouldBeActive) => {
        if (shouldBeActive) {
          const { error: deactivateError } = await supabase
            .from('ai_connections')
            .update({ is_active: false })
            .eq('capabilities->>image_generation', 'true')
            .neq('id', connection.id);

          if (deactivateError) {
            toast({ title: "Erro ao desativar outras conexões", description: deactivateError.message, variant: "destructive" });
            return;
          }
        }

        const { error: activateError } = await supabase
          .from('ai_connections')
          .update({ is_active: shouldBeActive })
          .eq('id', connection.id);

        if (activateError) {
          toast({ title: "Erro ao alterar status", description: activateError.message, variant: "destructive" });
        } else {
          toast({ title: `Conexão ${shouldBeActive ? 'ativada' : 'desativada'}!`, description: `A conexão ${connection.name} está agora ${shouldBeActive ? 'ativa' : 'inativa'}.` });
          onUpdate();
        }
      };


      return (
        <motion.div
          key={connection.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
        >
          <Card className={`glass-effect border-white/20 card-hover h-full flex flex-col ${connection.is_active ? 'border-purple-500' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">{connection.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{connection.provider}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onEditConnection(connection)} className="text-muted-foreground hover:text-foreground">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteConnection(connection.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-mono">{maskApiKey(connection.api_key)}</span>
              </div>
              {connection.api_base_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">URL Base da API:</p>
                  <p className="text-sm text-foreground truncate">{connection.api_base_url}</p>
                </div>
              )}
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold mb-2">Modelos:</h4>
                {connection.ai_models.length > 0 ? (
                  <ul className="space-y-1">
                    {connection.ai_models.map(model => (
                      <li key={model.id} className="flex justify-between items-center text-sm text-foreground">
                        <span>{model.model_name} ({model.status === 'active' ? 'Ativo' : 'Inativo'})</span>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => onEditModel(model, connection)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDeleteModel(model.id)} className="text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum modelo configurado.</p>
                )}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => onAddModel(connection)}>
                  <Plus className="w-3 h-3 mr-1" /> Adicionar Modelo
                </Button>
              </div>
            </CardContent>
            <div className="p-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {connection.is_active ? <Power className="h-4 w-4 text-green-400" /> : <PowerOff className="h-4 w-4 text-red-500" />}
                    <Label htmlFor={`active-switch-${connection.id}`} className={connection.is_active ? 'text-green-400' : 'text-red-500'}>
                    {connection.is_active ? 'Conexão Ativa' : 'Inativa'}
                    </Label>
                </div>
                <Switch
                    id={`active-switch-${connection.id}`}
                    checked={connection.is_active}
                    onCheckedChange={handleToggleActive}
                />
            </div>
          </Card>
        </motion.div>
      );
    };

    export default ImageConnectionCard;