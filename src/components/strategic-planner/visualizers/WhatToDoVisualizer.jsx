import React from 'react';
import { ListChecks, Lightbulb } from 'lucide-react';

const WhatToDoVisualizer = ({ content }) => {
  if (!content) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center mb-2">
          <ListChecks className="w-5 h-5 mr-2 text-primary" />
          Frentes de Ação
        </h3>
        <ul className="space-y-2 pl-4">
          {content.frente_de_acao && content.frente_de_acao.map((item, index) => (
            <li key={index} className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {content.slogan_opcional && (
        <div className="p-3 bg-primary/10 rounded-lg">
          <h4 className="text-md font-semibold flex items-center mb-1 text-primary/90">
            <Lightbulb className="w-4 h-4 mr-2" />
            Slogan da Campanha
          </h4>
          <p className="text-muted-foreground italic">"{content.slogan_opcional}"</p>
        </div>
      )}
    </div>
  );
};

export default WhatToDoVisualizer;