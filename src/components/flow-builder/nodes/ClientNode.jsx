import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

const ClientNode = memo(({ data, id }) => {
  const { onUpdateNodeData, clients, selectedClientId } = data;

  const handleClientChange = (clientId) => {
    const selectedClientData = clients.find(c => c.id.toString() === clientId);
    onUpdateNodeData(id, { 
      selectedClientId: clientId, 
      output: { 
        id: clientId,
        data: selectedClientData 
      }
    });
  };

  return (
    <Card className="w-64 border-2 border-primary/50 shadow-lg">
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <CardHeader className="flex-row items-center space-x-2 p-3 bg-primary/10">
        <Users className="w-5 h-5 text-primary" />
        <CardTitle className="text-base">Cliente</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Select onValueChange={handleClientChange} value={selectedClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente..." />
          </SelectTrigger>
          <SelectContent>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </Card>
  );
});

export default ClientNode;