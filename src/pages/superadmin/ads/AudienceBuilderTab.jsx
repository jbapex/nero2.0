import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Users, FileText, Tag, Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const AudienceBuilderTab = () => {
    const [templates, setTemplates] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('audience_templates').select('*').order('created_at', { ascending: false });
        if (error) {
            toast({ title: 'Erro ao buscar templates', description: error.message, variant: 'destructive' });
        } else {
            setTemplates(data);
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleOpenModal = (template = null) => {
        setCurrentTemplate(template ? { ...template } : { name: '', description: '', niche: '', config: {} });
        setIsModalOpen(true);
    };

    const handleSaveTemplate = async () => {
        if (!currentTemplate.name) {
            toast({ title: 'Nome é obrigatório', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        const { id, ...templateData } = currentTemplate;

        let error;
        if (id) {
            ({ error } = await supabase.from('audience_templates').update(templateData).eq('id', id));
        } else {
            ({ error } = await supabase.from('audience_templates').insert(templateData));
        }

        if (error) {
            toast({ title: 'Erro ao salvar template', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: `Template ${id ? 'atualizado' : 'criado'} com sucesso!` });
            setIsModalOpen(false);
            fetchTemplates();
        }
        setIsLoading(false);
    };

    const handleDeleteTemplate = async (templateId) => {
        setIsLoading(true);
        const { error } = await supabase.from('audience_templates').delete().eq('id', templateId);
        if (error) {
            toast({ title: 'Erro ao deletar template', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Template deletado com sucesso!' });
            fetchTemplates();
        }
        setIsLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentTemplate(prev => ({ ...prev, [name]: value }));
    };
    
    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setCurrentTemplate(prev => ({
            ...prev,
            config: {
                ...prev.config,
                [name]: value
            }
        }));
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center"><Users className="mr-2" /> Templates de Público</CardTitle>
                        <CardDescription>Crie e gerencie templates de público para agilizar a criação de campanhas.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Novo Template
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading && templates.length === 0 ? (
                        <p>Carregando templates...</p>
                    ) : templates.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Nenhum template de público encontrado. Crie o primeiro!</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {templates.map(template => (
                                <Card key={template.id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            {template.name}
                                            <div className="flex items-center space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(template)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        </CardTitle>
                                        <CardDescription>{template.description || 'Sem descrição'}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground"><Tag className="inline-block mr-2 h-4 w-4" />Nicho: {template.niche || 'N/A'}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{currentTemplate?.id ? 'Editar' : 'Criar'} Template de Público</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Template</Label>
                            <Input id="name" name="name" value={currentTemplate?.name || ''} onChange={handleInputChange} placeholder="Ex: Empreendedores Digitais (Iniciantes)" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea id="description" name="description" value={currentTemplate?.description || ''} onChange={handleInputChange} placeholder="Descreva para quem este público se destina." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="niche">Nicho</Label>
                            <Input id="niche" name="niche" value={currentTemplate?.niche || ''} onChange={handleInputChange} placeholder="Ex: E-commerce de Moda" />
                        </div>
                        
                        <h3 className="text-lg font-semibold mt-4 border-t pt-4 flex items-center"><Settings className="mr-2" /> Configuração (JSON)</h3>
                        <div className="space-y-2">
                            <Label htmlFor="config">Configurações do Público</Label>
                            <Textarea 
                                id="config" 
                                name="config" 
                                value={currentTemplate?.config ? JSON.stringify(currentTemplate.config, null, 2) : '{}'} 
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setCurrentTemplate(prev => ({ ...prev, config: parsed }));
                                    } catch (err) {
                                        // Ignore JSON parsing errors while typing
                                    }
                                }}
                                placeholder='{ "location": { "countries": ["BR"] }, "age_range": [25, 45] }'
                                rows={10}
                                className="font-mono"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSaveTemplate} disabled={isLoading}>
                            <Save className="mr-2 h-4 w-4" /> {isLoading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default AudienceBuilderTab;