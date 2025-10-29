import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Papa from 'papaparse';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { motion } from 'framer-motion';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['text/csv'];

const schema = z.object({
  file: z.any()
    .refine(files => files?.length === 1, "É necessário carregar um arquivo.")
    .refine(files => files?.[0]?.size <= MAX_FILE_SIZE, `O tamanho máximo é 5MB.`)
    .refine(files => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type), "Apenas arquivos .csv são aceitos."),
});

const GenericFileUpload = ({ onFileParsed, onParsingError, disabled }) => {
  const { register, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(schema),
  });
  const { toast } = useToast();
  const fileName = watch('file')?.[0]?.name;

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setValue('file', event.target.files, { shouldValidate: true });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields;
        if (!columns || columns.length === 0) {
          onParsingError("Não foi possível identificar as colunas no arquivo CSV.");
          return;
        }
        onFileParsed({
          columns: columns,
          data: results.data,
          fileName: file.name
        });
        toast({
            title: "Arquivo Processado!",
            description: `Identificamos ${columns.length} colunas no arquivo ${file.name}.`,
        });
      },
      error: (error) => {
        console.error('CSV Parsing error:', error);
        onParsingError("Falha ao processar o arquivo CSV. Verifique o formato.");
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Label htmlFor="file-upload-input" className="font-bold flex items-center mb-2">
            <Upload className="w-5 h-5 mr-2" /> Upload da Planilha
        </Label>
        <p className="text-sm text-muted-foreground mb-4">Selecione o arquivo .csv exportado do Gerenciador de Anúncios do Meta.</p>
        <Input 
            id="file-upload-input" 
            type="file" 
            accept=".csv"
            onChange={handleFileChange}
            disabled={disabled}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
        />
        <input type="file" {...register('file')} className="hidden" />

        {fileName && <p className="text-sm text-muted-foreground mt-2">Arquivo selecionado: {fileName}</p>}
        {errors.file && <p className="text-sm text-destructive mt-1">{errors.file.message}</p>}
    </motion.div>
  );
};

export default GenericFileUpload;