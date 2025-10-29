import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const typeColors = {
  video: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  arte: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ads: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  evento: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const ScheduleVisualizer = ({ content }) => {
  if (!content || !content.itens) return null;

  const formatDate = (dateString) => {
    // Add time to avoid timezone issues with `new Date()`
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Data</TableHead>
          <TableHead className="w-[120px]">Tipo</TableHead>
          <TableHead className="w-[150px]">Fase Ref.</TableHead>
          <TableHead>Descrição</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {content.itens.map((item, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{formatDate(item.data)}</TableCell>
            <TableCell>
              <Badge variant="outline" className={typeColors[item.tipo] || 'bg-gray-100 text-gray-800'}>
                {item.tipo}
              </Badge>
            </TableCell>
            <TableCell>{item.fase_ref}</TableCell>
            <TableCell className="text-muted-foreground">{item.descricao}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ScheduleVisualizer;