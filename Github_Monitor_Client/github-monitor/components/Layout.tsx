import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderGit2, Activity, AlertTriangle, Users, Settings, LogOut, Bell, Menu, X, Search, Plus, Camera, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../services/authContext';
import { useLanguage } from '../services/languageContext';
import { Button, Input } from './ui'; 
import { api } from '../services/api'; 
import { AvatarEditor } from './AvatarEditor';
import { API_BASE_URL } from '../constants';

const GithubLogo = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className} 
        aria-hidden="true"
    >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" stroke="#C9D1D9" fill="none" strokeWidth="2px" className="svg-elem-1"></path>
        <path d="M9 18c-4.51 2-5-2-7-2" stroke="#C9D1D9" fill="none" strokeWidth="2px" className="svg-elem-2"></path>
    </svg>
);

// Extract NavItemProps and Component to avoid re-creation on render and fix key prop type issue
interface NavItemProps {
  item: {
    label: string;
    path: string;
    icon: React.ElementType;
    badge?: string;
  };
  isActive: boolean;
  onClick: () => void;
  isExpanded: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, onClick, isExpanded }) => {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={`flex items-center relative group transition-all duration-300 mb-1 rounded-md
        ${isExpanded 
          ? 'justify-between px-3 py-2.5' 
          : 'justify-center px-2 py-3'
        }
        ${isActive 
          ? 'bg-background border border-border text-txt-main shadow-sm' 
          : 'text-txt-sec hover:text-txt-main hover:bg-background/50'
        }
      `}
      title={!isExpanded ? item.label : undefined}
    >
      <div className={`flex items-center transition-all duration-300 ${isExpanded ? 'gap-3' : 'gap-0'}`}>
          <div className={`transition-transform duration-300 ${!isExpanded && 'group-hover:scale-110'}`}>
            <item.icon size={20} />
          </div>
          
          <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded 
              ? 'w-auto opacity-100 ml-0 translate-x-0 delay-100' 
              : 'w-0 opacity-0 -ml-2 -translate-x-4 absolute pointer-events-none delay-0'
            }
          `}>
            {item.label}
          </span>
      </div>
      
      {item.badge && (
          isExpanded ? (
            <span className="bg-red-500/10 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/20 whitespace-nowrap animate-in fade-in zoom-in duration-300">
                {item.badge}
            </span>
          ) : (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-surface animate-in zoom-in duration-300"></span>
          )
      )}
    </NavLink>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const fetchAlerts = async () => {
    try {
        const alerts = await api.alerts.list();
        const openAlerts = alerts.filter((a: any) => a.status === 'OPEN').length;
        setAlertCount(openAlerts);
    } catch (error) {
        console.error('Failed to fetch alerts count:', error);
    }
  };

  // Global SSE Listener for Sound Notification
  React.useEffect(() => {
    // Initial fetch
    fetchAlerts();

    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(`${API_BASE_URL}/events/stream?token=${token}`);

    eventSource.addEventListener('event-update', (event: any) => {
        try {
            const audio = new Audio('/sounds/mixkit-clear-announce-tones-2861.wav');
            audio.volume = 0.5;
            audio.play().catch(e => console.warn('Audio play prevented by browser policy', e));
            
            // Refresh alert count on new event
            fetchAlerts();
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    });

    eventSource.onerror = (error) => {
        eventSource.close();
    };

    return () => {
        eventSource.close();
    };
  }, []);

  // New Repo Modal State
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [newRepo, setNewRepo] = useState({ owner: '', name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await api.repositories.create({
            owner: newRepo.owner,
            name: newRepo.name,
            url: `https://github.com/${newRepo.owner}/${newRepo.name}`,
            githubRepoId: Math.floor(Math.random() * 10000).toString()
        });
        
        setNewRepo({ owner: '', name: '' });
        setIsRepoModalOpen(false);
        
        if (location.pathname === '/repositories') {
           window.location.reload(); 
        } else {
           navigate('/repositories');
        }

    } catch (error) {
        alert('Failed to add repository');
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSaveAvatar = (base64Image: string) => {
      updateUser({ avatarUrl: base64Image });
  };

  const mainNavItems = [
    { label: t('dashboard'), path: '/', icon: LayoutDashboard },
    { label: t('repositories'), path: '/repositories', icon: FolderGit2 },
    { label: t('events'), path: '/events', icon: Activity },
    { label: t('alerts'), path: '/alerts', icon: AlertTriangle, badge: alertCount > 0 ? alertCount.toString() : undefined },
  ];

  const settingsNavItems = [
    { label: t('contributors'), path: '/contributors', icon: Users },
    { label: t('export'), path: '/export', icon: FileSpreadsheet },
    { label: t('settings'), path: '/settings', icon: Settings },
  ];

  const SidebarContent = ({ isExpanded = true }: { isExpanded?: boolean }) => (
    <div className={`flex flex-col h-full bg-surface border-r border-border transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'w-64' : 'w-20'}`}>
      <div className={`h-16 flex items-center shrink-0 transition-all duration-300 ${isExpanded ? 'px-6 gap-3' : 'justify-center px-0'}`}>
        <GithubLogo className="w-8 h-8 text-txt-main shrink-0 transition-transform duration-300 hover:scale-110" />
        <span className={`text-xl font-bold text-txt-main tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            Monitor
        </span>
      </div>
      
      <div className="flex-1 px-3 overflow-y-auto py-4 overflow-x-hidden scrollbar-hide">
        <nav className="space-y-6">
            <div>
                {mainNavItems.map((item) => (
                    <NavItem 
                        key={item.path} 
                        item={item} 
                        isActive={location.pathname === item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        isExpanded={isExpanded}
                    />
                ))}
            </div>

            <div>
                <p className={`px-3 text-xs font-semibold text-txt-sec uppercase tracking-wider mb-2 transition-opacity duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                    {t('settings')}
                </p>
                {settingsNavItems.map((item) => (
                    <NavItem 
                        key={item.path} 
                        item={item} 
                        isActive={location.pathname === item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        isExpanded={isExpanded}
                    />
                ))}
            </div>
        </nav>
      </div>

      <div className={`p-4 border-t border-border shrink-0 transition-all duration-300 ${isExpanded ? '' : 'flex justify-center'}`}>
        <div className={`flex items-center transition-all duration-300 ${isExpanded ? 'gap-3' : 'gap-0 justify-center'}`}>
            <button 
                onClick={() => setIsAvatarModalOpen(true)}
                className="group relative w-10 h-10 rounded-full bg-background flex items-center justify-center text-txt-main font-bold border border-border overflow-hidden shrink-0 hover:ring-2 hover:ring-primary transition-all"
                title={!isExpanded ? (user?.name || 'DevAdmin') : undefined}
            >
                {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span>{user?.name?.charAt(0) || 'D'}</span>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={14} className="text-white" />
                </div>
            </button>
            
            <div 
                className={`overflow-hidden cursor-pointer hover:opacity-80 transition-all duration-300 ease-in-out ${isExpanded ? 'flex-1 opacity-100 w-auto ml-0' : 'w-0 opacity-0 ml-0'}`}
                onClick={() => setIsAvatarModalOpen(true)}
            >
                <p className="text-sm font-bold text-txt-main truncate">{user?.name || 'DevAdmin'}</p>
            </div>
            
             <button 
                onClick={handleLogout} 
                className={`text-txt-sec hover:text-txt-main transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'w-0 opacity-0 overflow-hidden'}`} 
                title={t('logout')}
             >
                <LogOut size={18} />
             </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex font-sans text-txt-main transition-colors duration-300">
      {/* Sidebar Desktop */}
      <aside 
          className={`hidden md:block fixed h-full z-20 transition-all duration-300 ease-in-out ${isSidebarHovered ? 'w-64 shadow-xl' : 'w-20'}`}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          onClick={() => !isSidebarHovered && setIsSidebarHovered(true)}
      >
        <SidebarContent isExpanded={isSidebarHovered} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-surface z-50 flex items-center justify-between p-4 shadow-sm border-b border-border">
        <div className="flex items-center gap-2">
            <GithubLogo className="w-6 h-6 text-txt-main" />
            <span className="font-bold text-txt-main">Monitor</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-txt-main">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div 
          className={`fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
              mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
      >
          <div 
              className={`absolute left-0 top-0 h-full bg-surface shadow-2xl w-64 transform transition-transform duration-300 ease-in-out ${
                  mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              onClick={e => e.stopPropagation()}
          >
              <SidebarContent isExpanded={true} />
          </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isSidebarHovered ? 'md:ml-64' : 'md:ml-20'}`}>
        
        {/* Top Header Bar */}
        <header className="h-16 bg-background flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300">
            {/* Search */}
            <div className="relative w-96 hidden md:block">
                <Search className="absolute left-3 top-2.5 text-txt-sec" size={16} />
                <input 
                    type="text" 
                    placeholder={t('search_placeholder')}
                    className="w-full bg-surface border border-border rounded-md pl-10 pr-10 py-2 text-sm text-txt-main focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                <div className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] text-txt-sec">
                    /
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <Button 
                    onClick={() => setIsRepoModalOpen(true)}
                    variant="ghost"
                    className="gap-2 text-txt-main hover:bg-surface"
                >
                    <Plus size={16} /> {t('new_repo')}
                </Button>
                <div className="w-px h-6 bg-border"></div>
                <button className="text-txt-sec hover:text-txt-main relative">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                </button>
            </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8 overflow-y-auto flex-1">
            {children}
        </main>
      </div>

      {/* Global New Repo Modal */}
      {isRepoModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-surface border border-border rounded-lg w-full max-w-md p-6 shadow-2xl relative">
                <button 
                    onClick={() => setIsRepoModalOpen(false)} 
                    className="absolute top-4 right-4 text-txt-sec hover:text-txt-main"
                >
                    <X size={20} />
                </button>
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-txt-main">{t('add_repo_title')}</h3>
                    <p className="text-sm text-txt-sec">{t('add_repo_desc')}</p>
                </div>
                
                <form onSubmit={handleAddRepo} className="space-y-4">
                    <Input 
                        label={t('owner')} 
                        placeholder="e.g. facebook" 
                        value={newRepo.owner}
                        onChange={e => setNewRepo({...newRepo, owner: e.target.value})}
                        required
                    />
                    <Input 
                        label={t('repo_name')}
                        placeholder="e.g. react" 
                        value={newRepo.name}
                        onChange={e => setNewRepo({...newRepo, name: e.target.value})}
                        required
                    />
                    
                    <div className="pt-4 flex justify-end gap-3">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsRepoModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            {t('cancel')}
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            variant="ghost"
                            className="text-txt-main hover:bg-surface"
                        >
                            {isSubmitting ? t('adding') : t('add')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Avatar Editor Modal */}
      <AvatarEditor 
          isOpen={isAvatarModalOpen} 
          onClose={() => setIsAvatarModalOpen(false)} 
          onSave={handleSaveAvatar} 
      />
    </div>
  );
};