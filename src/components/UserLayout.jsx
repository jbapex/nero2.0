import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Settings, Menu, Target, Users, BarChart, SlidersHorizontal, GitFork, Lock } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
const mainNavItems = [{
  to: '/campanhas',
  icon: Target,
  label: 'Campanhas',
  permissionKey: null
}, {
  to: '/clientes',
  icon: Users,
  label: 'Clientes',
  permissionKey: 'publication_calendar'
}, {
  to: '/ferramentas',
  icon: SlidersHorizontal,
  label: 'Ferramentas',
  permissionKey: null
}, {
  to: '/chat-ia',
  icon: Bot,
  label: 'Chat IA',
  permissionKey: 'ai_chat'
}, {
  to: '/performance',
  icon: BarChart,
  label: 'Performance',
  permissionKey: null
}, {
  to: '/fluxo-criativo',
  icon: GitFork,
  label: 'Fluxo Criativo',
  permissionKey: 'creative_flow'
}];
const NavItem = ({
  to,
  icon: Icon,
  label,
  isCollapsed,
  isAllowed
}) => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const handleClick = e => {
    if (!isAllowed) {
      e.preventDefault();
      toast({
        title: "Acesso Restrito",
        description: `O recurso "${label}" não está disponível no seu plano.`,
        variant: "destructive"
      });
    } else {
      navigate(to);
    }
  };
  return <div onClick={handleClick} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 transition-all", isAllowed ? "cursor-pointer hover:bg-muted" : "cursor-not-allowed opacity-60", location.pathname.startsWith(to) && to !== '/' && isAllowed ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>
      <Icon className="h-5 w-5" />
      {!isCollapsed && <span className="font-medium flex-1">{label}</span>}
      {!isAllowed && <Lock className="h-4 w-4" />}
    </div>;
};
const UserLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const {
    user,
    profile,
    signOut,
    hasPermission
  } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const location = useLocation();
  const isToolsSection = location.pathname.startsWith('/ferramentas');
  const pageTitleData = {
    '/campanhas': 'Campanhas',
    '/clientes': 'Clientes',
    '/ferramentas': 'Ferramentas',
    '/chat-ia': 'Chat IA',
    '/performance': 'Performance',
    '/fluxo-criativo': 'Fluxo Criativo',
    '/settings/profile': 'Configurações'
  };
  const getPageTitle = pathname => {
    if (isToolsSection) return 'Ferramentas';
    for (const path in pageTitleData) {
      if (pathname.startsWith(path)) {
        return pageTitleData[path];
      }
    }
    return 'Neuro Ápice';
  };
  const pageTitle = getPageTitle(location.pathname);
  const getInitials = name => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const toggleSidebar = () => {
    if (isDesktop) {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };
  const SidebarContent = () => <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <NavLink to="/campanhas" className="flex items-center gap-2 font-semibold">
          <Bot className="h-6 w-6 text-primary" />
          {!isSidebarCollapsed && <span>Neuro Ápice</span>}
        </NavLink>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className={`grid items-start px-2 text-sm font-medium lg:px-4 ${isSidebarCollapsed ? 'gap-2' : ''}`}>
          {mainNavItems.map(item => <NavItem key={item.to} {...item} isCollapsed={isSidebarCollapsed} isAllowed={hasPermission(item.permissionKey)} />)}
        </nav>
      </div>
       <div className="mt-auto p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                  <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(profile?.name || user?.email)}</AvatarFallback>
                  </Avatar>
                  {!isSidebarCollapsed && <div className="flex flex-col truncate">
                          <span className="font-semibold text-sm text-foreground truncate">{profile?.name || user?.email}</span>
                          <span className="text-xs text-muted-foreground">{profile?.plans?.name || 'Plano Básico'}</span>
                      </div>}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>{profile?.name || 'Minha Conta'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </div>;
  return <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      {isDesktop ? <motion.div animate={{
      width: isSidebarCollapsed ? '4.5rem' : '16rem'
    }} transition={{
      duration: 0.3,
      ease: 'easeInOut'
    }} className="hidden border-r bg-card md:block">
            <SidebarContent />
        </motion.div> : <AnimatePresence>
            {isSidebarOpen && <>
                    <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="fixed inset-0 bg-black/60 z-40" onClick={toggleSidebar} />
                    <motion.div initial={{
          x: '-100%'
        }} animate={{
          x: 0
        }} exit={{
          x: '-100%'
        }} transition={{
          duration: 0.3,
          ease: 'easeInOut'
        }} className="fixed top-0 left-0 h-full w-64 bg-card z-50 border-r">
                        <SidebarContent />
                    </motion.div>
                </>}
        </AnimatePresence>}

      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="w-full flex-1">
            <h1 className="text-xl font-semibold hidden md:block">{pageTitle}</h1>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 flex-col gap-4 bg-muted/40">
          <Outlet />
        </main>
      </div>
    </div>;
};
export default UserLayout;