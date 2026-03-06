import React from 'react';
import { useParams } from 'react-router-dom';

const ModuleChat = () => {
  const { moduleId } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Chat do Módulo</h1>
      <p className="text-muted-foreground mt-2">Módulo: {moduleId || '—'}</p>
    </div>
  );
};

export default ModuleChat;
