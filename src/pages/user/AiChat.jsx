import React from 'react';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import AiChat from '@/components/ai-chat/AiChat';

    const AiChatPage = () => {
      const auth = useAuth();

      if (auth.loading) {
        return (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
      }

      return <AiChat auth={auth} />;
    };

    export default AiChatPage;