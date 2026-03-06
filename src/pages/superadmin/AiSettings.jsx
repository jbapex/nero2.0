import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Image as ImageIcon, Settings } from 'lucide-react';
import ConnectionsTab from '@/pages/superadmin/ai-settings/ConnectionsTab';
import ImagePresetsTab from '@/pages/superadmin/ai-settings/ImagePresetsTab';
import ImageConnectionsTab from '@/pages/superadmin/ai-settings/ImageConnectionsTab';

const AiSettings = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">Configurações de IA</h1>
    <Tabs defaultValue="connections" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="connections"><Bot className="w-4 h-4 mr-2" />Conexões LLM</TabsTrigger>
        <TabsTrigger value="presets"><Settings className="w-4 h-4 mr-2" />Presets de Imagem</TabsTrigger>
        <TabsTrigger value="image_connections"><ImageIcon className="w-4 h-4 mr-2" />Conexões de Imagem</TabsTrigger>
      </TabsList>
      <TabsContent value="connections" className="mt-6"><ConnectionsTab /></TabsContent>
      <TabsContent value="presets" className="mt-6"><ImagePresetsTab /></TabsContent>
      <TabsContent value="image_connections" className="mt-6"><ImageConnectionsTab /></TabsContent>
    </Tabs>
  </div>
);

export default AiSettings;
