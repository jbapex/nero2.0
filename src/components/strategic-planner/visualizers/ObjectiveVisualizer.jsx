import React from 'react';
import { Target, CheckCircle } from 'lucide-react';

const ObjectiveVisualizer = ({ content }) => {
  if (!content) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-primary flex items-center">
          <Target className="w-6 h-6 mr-3" />
          {content.objetivo_principal || 'Objetivo Principal Não Definido'}
        </h2>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Metas Secundárias</h3>
        <ul className="space-y-2 pl-2">
          {content.metas_secundarias && content.metas_secundarias.map((meta, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{meta}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ObjectiveVisualizer;