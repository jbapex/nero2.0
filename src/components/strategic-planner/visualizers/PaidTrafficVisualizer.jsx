import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Goal, Image as ImageIcon } from 'lucide-react';

const PaidTrafficVisualizer = ({ content }) => {
  if (!content || !content.campanhas) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {content.campanhas.map((campanha, index) => (
        <Card key={index} className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">{campanha.nome}</CardTitle>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">
                <DollarSign className="w-3 h-3 mr-1" /> {campanha.orcamento}
              </Badge>
              <Badge variant="secondary">
                <Goal className="w-3 h-3 mr-1" /> {campanha.objetivo_ads}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold flex items-center text-sm mb-1">
                <Users className="w-4 h-4 mr-2 text-primary" /> Público
              </h4>
              <p className="text-sm text-muted-foreground pl-6">{campanha.publico}</p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center text-sm mb-1">
                <ImageIcon className="w-4 h-4 mr-2 text-primary" /> Criativos
              </h4>
              <ul className="list-disc list-inside pl-6 text-sm text-muted-foreground">
                {campanha.criativos.map((criativo, i) => (
                  <li key={i}>{criativo}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PaidTrafficVisualizer;