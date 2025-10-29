import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, Eye as Bullseye, Zap } from 'lucide-react';

const PhasesVisualizer = ({ content }) => {
  if (!content || !content.fases) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      {content.fases.map((fase, index) => (
        <AccordionItem value={`item-${index}`} key={index}>
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <span className="text-primary font-bold">Fase {index + 1}:</span>
              <span className="font-semibold text-foreground">{fase.nome}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pl-2 space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2 text-primary/80" />
                <strong>Período:</strong><span className="ml-2">{fase.periodo}</span>
              </div>
              <div className="flex items-start text-sm text-muted-foreground">
                <Bullseye className="w-4 h-4 mr-2 mt-0.5 text-primary/80 flex-shrink-0" />
                <div>
                  <strong>Objetivo:</strong>
                  <p className="italic ml-2">{fase.objetivo}</p>
                </div>
              </div>
               <div className="flex items-start text-sm text-muted-foreground">
                <Zap className="w-4 h-4 mr-2 mt-0.5 text-primary/80 flex-shrink-0" />
                <div>
                  <strong>Ações:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {fase.acoes.map((acao, i) => (
                      <li key={i}>{acao}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default PhasesVisualizer;