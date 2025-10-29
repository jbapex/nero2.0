import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Sparkles, ChevronsUpDown } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
    import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

    const LlmIntegrationCombobox = ({ integrations, selectedId, onSelect }) => {
        const [open, setOpen] = useState(false);
        const selectedIntegration = integrations.find(i => i.id === selectedId);

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                        {selectedIntegration ? `${selectedIntegration.name} (${selectedIntegration.default_model})` : "Selecione uma conexão de IA..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Procurar conexão..." />
                        <CommandList>
                            <CommandEmpty>Nenhuma conexão encontrada.</CommandEmpty>
                            <CommandGroup>
                                {integrations.map((integration) => (
                                    <CommandItem
                                        key={integration.id}
                                        value={integration.name}
                                        onSelect={() => {
                                            onSelect(integration.id);
                                            setOpen(false);
                                        }}
                                    >
                                        {integration.name} ({integration.default_model})
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    };

    const AiChatWelcome = ({ integrations, selectedId, onSelect, showSelector = true }) => {
      return (
        <div className="flex flex-col items-center justify-center p-4 h-[calc(100vh-14rem)]">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-center mb-8 p-6 rounded-full bg-primary/5"
            >
                <Sparkles className="w-16 h-16 text-primary mx-auto" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">Converse com a IA</h2>
            {showSelector ? (
                <>
                    <p className="text-muted-foreground mb-6">Selecione uma conexão para começar.</p>
                    <div className="w-full max-w-sm">
                        <LlmIntegrationCombobox integrations={integrations} selectedId={selectedId} onSelect={onSelect} />
                    </div>
                </>
            ) : (
                <p className="text-muted-foreground mb-6">Sua conexão de IA pessoal está ativa. Comece a conversar!</p>
            )}
        </div>
      );
    };

    export default AiChatWelcome;