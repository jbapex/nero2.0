import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Youtube, CheckCircle } from 'lucide-react'; // Using Youtube as a stand-in for Google
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const availableChannels = [
  { id: 'meta', name: 'Meta', icon: Facebook, description: 'Facebook & Instagram' },
  { id: 'google', name: 'Google', icon: Youtube, description: 'Pesquisa, Display & YouTube' },
  { id: 'tiktok', name: 'TikTok', icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.8 6.2c-1 .3-1.8.8-2.5 1.7-.7 1-1.1 2.1-1.1 3.2V17c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-7.3c0-1.8.6-3.4 1.7-4.8 1.1-1.3 2.6-2.2 4.3-2.2h.1c.3 0 .5.2.5.5s-.2.5-.5.5h-.1c-1.4 0-2.7.7-3.6 1.8z"></path><path d="M12.5 8.7c.3-1.1.9-2.1 1.8-2.9.9-.8 2-1.3 3.2-1.3h.1c.3 0 .5.2.5.5s-.2.5-.5.5h-.1c-.9 0-1.8.4-2.5 1.1-.7.7-1.1 1.6-1.3 2.5-.1.3-.4.5-.4-.7z"></path></svg>, description: 'Anúncios em vídeo' },
];

const ChannelsStep = ({ data, updateData }) => {
  const toggleChannel = (channelId) => {
    const currentChannels = Array.isArray(data.channels) ? data.channels : [];
    const newChannels = currentChannels.some(c => c.id === channelId)
      ? currentChannels.filter(c => c.id !== channelId)
      : [...currentChannels, { id: channelId, settings: {} }];
    updateData('channels', newChannels);
  };

  const updateChannelSettings = (channelId, setting, value) => {
    const newChannels = data.channels.map(c =>
      c.id === channelId ? { ...c, settings: { ...c.settings, [setting]: value } } : c
    );
    updateData('channels', newChannels);
  };

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Seleção de Plataformas</h3>
      <p className="text-sm text-muted-foreground">Escolha onde sua campanha será veiculada. As configurações salvas aqui ajudarão a IA a gerar conteúdo mais específico.</p>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {availableChannels.map(channel => {
          const isSelected = data.channels?.some(c => c.id === channel.id);
          return (
            <motion.div key={channel.id} variants={itemVariants} className="flex">
              <Card
                onClick={() => toggleChannel(channel.id)}
                className={cn(
                  'cursor-pointer transition-all duration-300 relative border-2 w-full',
                  isSelected ? 'border-primary shadow-lg' : 'hover:border-primary/50'
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </motion.div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <channel.icon className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle>{channel.name}</CardTitle>
                      <CardDescription>{channel.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {data.channels && data.channels.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold pt-4 border-t">Configurações por Canal</h3>
          {data.channels.map(channel => (
            <Card key={channel.id}>
              <CardHeader>
                <CardTitle className="capitalize">{channel.id}</CardTitle>
                <CardDescription>Configurações específicas para esta plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {channel.id === 'meta' && (
                  <>
                    <div>
                      <Label htmlFor="meta-objective">Objetivo da Campanha no Meta</Label>
                      <Input 
                        id="meta-objective"
                        placeholder="Ex: Conversões, Engajamento, Alcance"
                        value={channel.settings?.objective || ''}
                        onChange={(e) => updateChannelSettings(channel.id, 'objective', e.target.value)}
                      />
                    </div>
                  </>
                )}
                {channel.id === 'google' && (
                   <>
                    <div>
                      <Label htmlFor="google-type">Tipo de Campanha no Google</Label>
                      <Input 
                        id="google-type"
                        placeholder="Ex: Pesquisa, Performance Max, Display"
                        value={channel.settings?.type || ''}
                        onChange={(e) => updateChannelSettings(channel.id, 'type', e.target.value)}
                      />
                    </div>
                   </>
                )}
                {/* Add more channel-specific settings as needed */}
                <div>
                  <Label htmlFor={`${channel.id}-notes`}>Outras Notas</Label>
                   <Input 
                    id={`${channel.id}-notes`}
                    placeholder="Qualquer detalhe adicional para este canal"
                    value={channel.settings?.notes || ''}
                    onChange={(e) => updateChannelSettings(channel.id, 'notes', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChannelsStep;