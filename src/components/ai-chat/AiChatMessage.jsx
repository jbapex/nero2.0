import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import ReactMarkdown from 'react-markdown';
    import { Bot, User, Loader2 } from 'lucide-react';
    import { Avatar, AvatarFallback } from '@/components/ui/avatar';
    import { cn } from '@/lib/utils';

    const StreamingMessage = ({ content, onFinished }) => {
      const [displayedContent, setDisplayedContent] = useState('');
    
      useEffect(() => {
        setDisplayedContent('');
        if (content) {
          let i = 0;
          const interval = setInterval(() => {
            if (i < content.length) {
              setDisplayedContent(prev => prev + content[i]);
              i++;
            } else {
              clearInterval(interval);
              if (onFinished) onFinished();
            }
          }, 20);
          return () => clearInterval(interval);
        }
      }, [content, onFinished]);
    
      return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
    };
    
    const AiChatMessage = ({ message, className, isStreaming, onStreamingFinished }) => {
      const { role, content } = message;
      const isUser = role === 'user';
    
      let renderableContent;
      if (typeof content === 'string') {
          renderableContent = content;
      } else if (content && typeof content === 'object') {
          if (content.type === 'chat' && typeof content.content === 'string') {
              renderableContent = content.content;
          } else if (content.type === 'suggestion' && typeof content.explanation === 'string') {
              renderableContent = content.explanation;
              if (content.updates) {
                renderableContent += `\n\n**Sugestão de Alterações:**\n\`\`\`json\n${JSON.stringify(content.updates, null, 2)}\n\`\`\``;
              }
          } else {
              renderableContent = `\`\`\`json\n${JSON.stringify(content, null, 2)}\n\`\`\``;
          }
      } else {
          renderableContent = String(content);
      }
    
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex items-start gap-4', 
            isUser ? 'justify-end' : '',
            className
          )}
        >
          {!isUser && (
            <Avatar className="w-9 h-9 border-2 border-primary/50 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20} /></AvatarFallback>
            </Avatar>
          )}
          <div 
            className={cn(
                'max-w-2xl p-4 rounded-2xl shadow-sm prose dark:prose-invert prose-sm max-w-none break-words select-text',
                isUser ? 'bg-primary text-white rounded-br-none' : 'bg-input text-foreground rounded-bl-none border'
            )}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {isStreaming ? (
              <StreamingMessage content={renderableContent} onFinished={onStreamingFinished} />
            ) : (
              <ReactMarkdown
                  components={{
                      p: ({node, ...props}) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="my-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="my-2" {...props} />,
                      li: ({node, ...props}) => <li className="my-1" {...props} />,
                  }}
              >
                  {renderableContent}
              </ReactMarkdown>
            )}
          </div>
          {isUser && (
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarFallback><User size={20} /></AvatarFallback>
            </Avatar>
          )}
        </motion.div>
      );
    };
    
    AiChatMessage.Loading = () => (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-4"
      >
        <Avatar className="w-9 h-9 border-2 border-primary/50">
          <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20} /></AvatarFallback>
        </Avatar>
        <div className="p-4 rounded-2xl bg-input border flex items-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Pensando...</span>
        </div>
      </motion.div>
    );
    
    export default AiChatMessage;