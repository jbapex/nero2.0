import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ColumnSelectDialog from './ColumnSelectDialog';

const REQUIRED_COLUMNS = {
  'Valor gasto (BRL)': 'Custo total da campanha.',
  'Resultados': 'Conversões, leads, etc.',
  'Alcance': 'Pessoas únicas alcançadas.',
  'Impressões': 'Total de visualizações.',
  'Cliques (todos)': 'Total de cliques no anúncio.',
};

const OPTIONAL_COLUMNS = {
  'CPC (Custo por Clique)': 'Custo médio por clique.',
  'CPM (Custo por Mil Impressões)': 'Custo a cada mil impressões.',
  'CTR (Taxa de Cliques no link)': 'Percentual de cliques.',
  'Taxa de conversão de resultado': 'Taxa de conversão.',
  'Nome da campanha': 'Nome da Campanha.',
  'Nome do conjunto de anúncios': 'Nome do Conjunto de Anúncios.',
  'Nome do anúncio': 'Nome do Anúncio.',
  'Identificação da campanha': 'ID da Campanha.',
  'Início': 'Data de início.',
  'Término': 'Data de término.',
  'Tipo de resultado': 'Tipo de conversão.',
};

const ALL_COLUMNS = { ...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS };

const ColumnMapper = ({ isOpen, onClose, csvData, onConfirm }) => {
  const [mappings, setMappings] = useState({});
  const [error, setError] = useState('');

  const autoMapColumns = (columns) => {
    const initialMappings = {};
    const lowercasedColumns = columns.map(c => c.toLowerCase());
    
    Object.keys(ALL_COLUMNS).forEach(targetCol => {
      const keywords = targetCol.toLowerCase().replace(/ \(.+?\)/, '').split(' ');
      
      let bestMatch = null;
      let highestScore = 0;

      lowercasedColumns.forEach((csvCol, index) => {
          let currentScore = 0;
          if (csvCol.includes(targetCol.toLowerCase())) currentScore += 5;
          keywords.forEach(kw => {
              if (csvCol.includes(kw)) currentScore++;
          });
          if (currentScore > highestScore) {
              highestScore = currentScore;
              bestMatch = csvData.columns[index];
          }
      });

      if (bestMatch) {
          initialMappings[targetCol] = bestMatch;
      }
    });
    return initialMappings;
  };


  useEffect(() => {
    if (csvData?.columns) {
      const initialMappings = autoMapColumns(csvData.columns);
      setMappings(initialMappings);
    }
  }, [csvData]);

  const handleMappingChange = (targetCol, csvCol) => {
    setMappings(prev => ({ ...prev, [targetCol]: csvCol }));
  };

  const handleConfirm = () => {
    const allRequiredMapped = Object.keys(REQUIRED_COLUMNS).every(key => mappings[key]);
    if (!allRequiredMapped) {
      setError('Por favor, mapeie todas as colunas obrigatórias.');
      return;
    }
    
    const mappedValues = Object.values(mappings).filter(Boolean);
    const hasDuplicates = new Set(mappedValues).size !== mappedValues.length;
     if (hasDuplicates) {
      setError('Uma mesma coluna do CSV não pode ser mapeada para múltiplos campos.');
      return;
    }

    setError('');

    const processedData = csvData.data.map(row => {
      const newRow = {};
      Object.entries(mappings).forEach(([targetCol, csvCol]) => {
        if(csvCol) newRow[targetCol] = row[csvCol];
      });
      return newRow;
    });

    onConfirm({
      columns: Object.keys(mappings).filter(key => mappings[key]),
      data: processedData,
      fileName: csvData.fileName,
    });
  };

  if (!csvData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Mapear Colunas do CSV</DialogTitle>
          <DialogDescription>
            Associe as colunas do seu arquivo com os campos que a IA precisa. A IA já tentou adivinhar, revise e confirme.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-lg mb-4">Colunas Obrigatórias</h4>
              <div className="grid gap-4">
              {Object.entries(REQUIRED_COLUMNS).map(([requiredCol, description]) => (
                <MappingRow 
                  key={requiredCol} 
                  targetCol={requiredCol} 
                  description={description} 
                  csvColumns={csvData.columns} 
                  value={mappings[requiredCol] || null}
                  onChange={handleMappingChange}
                />
              ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Colunas Opcionais (Recomendado)</h4>
               <div className="grid gap-4">
              {Object.entries(OPTIONAL_COLUMNS).map(([optionalCol, description]) => (
                <MappingRow 
                  key={optionalCol} 
                  targetCol={optionalCol} 
                  description={description} 
                  csvColumns={csvData.columns}
                  value={mappings[optionalCol] || null} 
                  onChange={handleMappingChange}
                />
              ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro de Mapeamento</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar Mapeamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MappingRow = ({ targetCol, description, csvColumns, value, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
    <Label htmlFor={targetCol} className="text-left md:text-right">
      {targetCol}
      <p className="text-xs text-muted-foreground font-normal">{description}</p>
    </Label>
    <ColumnSelectDialog
      columns={csvColumns}
      selectedValue={value}
      onValueChange={(val) => onChange(targetCol, val)}
    />
  </div>
);


export default ColumnMapper;