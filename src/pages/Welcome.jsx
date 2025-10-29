import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Welcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigation = () => {
    if (user) {
      if (user.user_metadata?.user_type === 'super_admin') {
        navigate('/superadmin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -100, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-48 h-48 bg-gray-500/10 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 100, 0], rotate: [360, 180, 0] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gray-500/10 rounded-full blur-2xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="relative z-10 text-center max-w-3xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-8 w-24 h-24 bg-gradient-to-r from-gray-700 to-gray-900 rounded-3xl flex items-center justify-center glow-effect shadow-2xl"
        >
          <Brain className="w-12 h-12 text-white" />
        </motion.div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold gradient-text mb-6">
          Bem-vindo ao Neuro Ápice
        </h1>
        
        <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Sua plataforma completa para gestão inteligente, com módulos de IA personalizados e controle total sobre planos e usuários.
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleNavigation}
            size="lg"
            className="text-lg font-semibold px-8 py-6 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white rounded-xl transition-all duration-300 glow-effect shadow-lg"
          >
            {user ? 'Acessar Painel' : 'Começar Agora'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Welcome;