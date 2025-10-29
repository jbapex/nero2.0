import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Rocket, X } from 'lucide-react';

function PwaUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [updateCallback, setUpdateCallback] = useState(null);

  const handleUpdateAvailable = useCallback((event) => {
    setShowNotification(true);
    setUpdateCallback(() => event.detail.onUpdate);
  }, []);

  useEffect(() => {
    window.addEventListener('new-pwa-update-available', handleUpdateAvailable);
    return () => {
      window.removeEventListener('new-pwa-update-available', handleUpdateAvailable);
    };
  }, [handleUpdateAvailable]);

  const handleUpdateClick = () => {
    if (updateCallback) {
      updateCallback();
    }
    setShowNotification(false);
  };

  const close = () => {
    setShowNotification(false);
  };

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-[100]"
        >
          <Alert className="max-w-md shadow-lg bg-card">
            <Rocket className="h-4 w-4" />
            <AlertTitle className="font-bold">
              Nova versão disponível!
            </AlertTitle>
            <AlertDescription className="mt-2">
              Uma nova versão do aplicativo está disponível. Recarregue para aplicar as atualizações.
            </AlertDescription>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleUpdateClick}>
                Recarregar
              </Button>
              <Button variant="outline" onClick={close}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PwaUpdateNotification;