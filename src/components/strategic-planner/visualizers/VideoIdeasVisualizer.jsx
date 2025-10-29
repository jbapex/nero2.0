import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Film, Clock } from 'lucide-react';

const VideoIdeasVisualizer = ({ content }) => {
  if (!content || !content.videos) return null;

  return (
    <div className="space-y-4">
      {content.videos.map((video, index) => (
        <Card key={index} className="bg-muted/50 overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg flex items-center">
                <Film className="w-5 h-5 mr-2 text-primary" />
                {video.titulo}
              </CardTitle>
              <Badge variant="default">
                <Clock className="w-3 h-3 mr-1" />
                {video.duracao}s
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Gancho:</strong> {video.gancho}</p>
            <p><strong>Contexto:</strong> {video.contexto}</p>
            <p><strong>Clímax:</strong> {video.climax}</p>
            <p><strong>CTA:</strong> {video.cta}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VideoIdeasVisualizer;