import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { GripVertical, PlusCircle, Trash2, Edit, Check, X, PanelRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

const SortableModuleItem = ({ module, activeModule, setActiveModule, onUpdate, onDelete, isCollapsed }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id });
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(module.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleUpdateName = () => {
    if (newName.trim()) {
      onUpdate(module.id, { name: newName });
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between p-2 rounded-md cursor-pointer group',
        activeModule?.id === module.id ? 'bg-primary/10' : 'hover:bg-accent',
        isCollapsed && 'justify-center'
      )}
      onClick={() => setActiveModule(module)}
    >
      <div className={cn("flex items-center gap-2 flex-grow", isCollapsed && "flex-grow-0")}>
        <div {...attributes} {...listeners} className="cursor-grab p-1">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        {!isCollapsed && (
          isEditing ? (
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
              className="h-8"
            />
          ) : (
            <span className="font-medium text-sm truncate">{module.name}</span>
          )
        )}
      </div>
      {!isCollapsed && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleUpdateName}><Check className="w-4 h-4 text-green-500" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(module.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ModulePanel = ({ isCollapsed, modules, setModules, activeModule, setActiveModule }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');

  const handleAddModule = () => {
    if (!newModuleName.trim()) return;
    const newModule = {
      id: uuidv4(),
      name: newModuleName,
      html: `<!-- ${newModuleName} -->\n<section id="${newModuleName.toLowerCase().replace(/\s+/g, '-')}" class="p-8 bg-gray-100 dark:bg-gray-800">\n  <h2 class="text-2xl font-bold text-center" data-id="${uuidv4()}" data-type="heading">${newModuleName}</h2>\n</section>`,
    };
    const newStructure = [...modules, newModule];
    setModules(newStructure);
    setActiveModule(newModule);
    setIsAddModalOpen(false);
    setNewModuleName('');
  };

  const handleUpdateModule = (moduleId, updates) => {
    const newStructure = modules.map(m => m.id === moduleId ? { ...m, ...updates } : m);
    setModules(newStructure);
  };

  const handleDeleteModule = (moduleId) => {
    const newStructure = modules.filter(m => m.id !== moduleId);
    setModules(newStructure);
    if (activeModule?.id === moduleId) {
      setActiveModule(newStructure.length > 0 ? newStructure[0] : null);
    }
  };
  
  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full bg-card border-r items-center justify-center p-2">
          <PanelRight className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <header className="p-4 border-b">
        <h2 className="text-lg font-bold">Módulos do Site</h2>
      </header>
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {modules.map(module => (
          <SortableModuleItem
            key={module.id}
            module={module}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            onUpdate={handleUpdateModule}
            onDelete={handleDeleteModule}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>
      <div className="p-4 border-t">
        <Button className="w-full" onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Módulo
        </Button>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Módulo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ex: Seção de Herói, Contato..."
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddModule}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModulePanel;