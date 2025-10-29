import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronsUpDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ColumnSelectDialog = ({ columns, selectedValue, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredColumns = columns.filter(col =>
    col.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (value) => {
    onValueChange(value);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {selectedValue || <span className="text-muted-foreground">Selecione ou deixe em branco...</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 max-w-[500px]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Selecione uma Coluna</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar coluna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="h-72">
          <div className="p-4 pt-0">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                !selectedValue && "bg-accent"
              )}
              onClick={() => handleSelect(null)}
            >
              Não Mapear
            </Button>
            {filteredColumns.map((col) => (
              <Button
                key={col}
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  selectedValue === col && "bg-accent"
                )}
                onClick={() => handleSelect(col)}
              >
                 <Check className={cn("mr-2 h-4 w-4", selectedValue === col ? "opacity-100" : "opacity-0")} />
                {col}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnSelectDialog;