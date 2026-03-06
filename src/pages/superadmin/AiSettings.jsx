import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConnectionsTab from '@/pages/superadmin/ai-settings/ConnectionsTab';
import ImageConnectionsTab from '@/pages/superadmin/ai-settings/ImageConnectionsTab';
import ImagePresetsTab from '@/pages/superadmin/ai-settings/ImagePresetsTab';
import { Bot, Image, Palette } from 'lucide-react';

const AiSettings = () => {
  const [activeTab, setActiveTab] = useState('connections');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações de IA</h1>
        <p className="text-muted-foreground mt-1">Gerencie conexões e modelos de IA do sistema.</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Conexões
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Imagem
          </TabsTrigger>
          <TabsTrigger value="presets" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Presets
          </TabsTrigger>
        </TabsList>
        <TabsContent value="connections">
          <ConnectionsTab />
        </TabsContent>
        <TabsContent value="image">
          <ImageConnectionsTab />
        </TabsContent>
        <TabsContent value="presets">
          <ImagePresetsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AiSettings;
