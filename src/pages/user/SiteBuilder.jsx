import React from 'react';
import { useParams } from 'react-router-dom';

const UserSiteBuilder = () => {
  const { projectId } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Criador de Site</h1>
      <p className="text-muted-foreground mt-2">Projeto: {projectId || '—'}</p>
    </div>
  );
};

export default UserSiteBuilder;
