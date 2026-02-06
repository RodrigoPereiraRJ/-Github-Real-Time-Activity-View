import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { api } from '../services/api';
import { API_BASE_URL } from '../constants';
import { useLanguage } from '../services/languageContext';
import { Repository } from '../types';
import { Search, MoreVertical, CheckCircle2, AlertCircle, RefreshCw, PauseCircle, Folder, FileCode, AppWindow, Trash2 } from 'lucide-react';

export const Repositories: React.FC = () => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();
  
  // Dropdown & Delete states
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [repoToDelete, setRepoToDelete] = useState<Repository | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRepos();
  }, []);

  // SSE Listener
  useEffect(() => {
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(`${API_BASE_URL}/events/stream?token=${token}`);

    eventSource.addEventListener('event-update', () => {
        loadRepos(true); // Silent reload
    });

    eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
    };

    return () => {
        eventSource.close();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const loadRepos = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.repositories.list();
      setRepos(data);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleDeleteRepo = async () => {
      if (!repoToDelete) return;
      try {
          await api.repositories.delete(repoToDelete.id);
          setRepoToDelete(null);
          loadRepos();
      } catch (error) {
          alert('Failed to delete repository');
      }
  };

  const filteredRepos = repos.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status?: string) => {
      switch(status) {
          case 'synced':
              return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                      <CheckCircle2 size={12} /> {t('synced')}
                  </span>
              );
          case 'failed':
              return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      <AlertCircle size={12} /> {t('failed')}
                  </span>
              );
          case 'syncing':
              return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <RefreshCw size={12} className="animate-spin" /> {t('syncing')}
                  </span>
              );
          case 'paused':
              return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
                      <PauseCircle size={12} /> {t('paused')}
                  </span>
              );
          default:
              return null;
      }
  };

  // Helper to pick a random-ish icon based on repo content logic mock
  const getRepoIcon = (name: string) => {
      if (name.includes('monitor')) return <Folder size={20} className="text-blue-500" />;
      if (name.includes('api')) return <AppWindow size={20} className="text-blue-500" />;
      if (name.includes('core')) return <Folder size={20} className="text-txt-sec" />;
      return <FileCode size={20} className="text-txt-sec" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-txt-main">{t('repos_title')}</h2>
            <p className="text-txt-sec text-sm">{t('repos_desc')}</p>
        </div>
      </div>

      <div className="bg-surface rounded-lg overflow-hidden shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 text-txt-sec" size={16} />
                <input 
                    type="text" 
                    placeholder={t('search_repos')}
                    className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-2 text-sm text-txt-main focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                 <Button variant="secondary" onClick={loadRepos} size="sm"><RefreshCw size={14} /></Button>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm">
                <thead className="bg-surface text-txt-sec font-medium">
                    <tr>
                        <th className="px-6 py-4">{t('repo_name')}</th>
                        <th className="px-6 py-4">{t('owner')}</th>
                        <th className="px-6 py-4">{t('last_sync')}</th>
                        <th className="px-6 py-4">{t('status')}</th>
                        <th className="px-6 py-4 text-right">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody className="bg-background">
                    {loading ? (
                        <tr><td colSpan={5} className="p-6 text-center text-txt-sec">{t('loading_repos')}</td></tr>
                    ) : filteredRepos.length === 0 ? (
                        <tr><td colSpan={5} className="p-6 text-center text-txt-sec">{t('no_repos')}</td></tr>
                    ) : (
                        filteredRepos.map((repo) => (
                            <tr 
                                key={repo.id} 
                                className="group hover:bg-surface transition-all duration-300 ease-out relative hover:z-20 hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-0.5 dark:hover:shadow-none dark:hover:scale-100 dark:hover:translate-y-0"
                            >
                                {/* Name Column */}
                                <td className="px-6 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-2 bg-surface rounded-md border border-border">
                                            {getRepoIcon(repo.name)}
                                        </div>
                                        <div>
                                            <p 
                                                className="text-base font-semibold text-primary hover:underline cursor-pointer"
                                                onClick={() => {
                                                    const today = new Date();
                                                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                                    navigate(`/events?repoId=${repo.id}&date=${dateStr}`);
                                                }}
                                            >
                                                {repo.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-txt-sec">
                                                <span>{repo.visibility || 'Public'}</span>
                                                <span>•</span>
                                                <span>{repo.language || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                
                                {/* Owner Column */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <img 
                                            src={`https://github.com/${repo.owner}.png`} 
                                            alt={repo.owner}
                                            className="w-6 h-6 rounded-full border border-border"
                                        />
                                        <span className="text-txt-main font-medium">{repo.owner}</span>
                                    </div>
                                </td>

                                {/* Last Sync */}
                                <td className="px-6 py-4 text-txt-sec">
                                    {repo.lastSyncedAt ? new Date(repo.lastSyncedAt).toLocaleString() : '-'}
                                </td>

                                {/* Status */}
                                <td className="px-6 py-4">
                                    {getStatusBadge(repo.status)}
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right relative">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="px-3 py-1.5 rounded-md border border-border text-xs font-medium text-txt-sec hover:bg-border hover:text-txt-main transition-colors">
                                            {t('view_details')}
                                        </button>
                                        <div className="relative">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdownId(activeDropdownId === repo.id ? null : repo.id);
                                                }}
                                                className={`p-1.5 text-txt-sec hover:text-txt-main rounded-md hover:bg-border transition-colors ${activeDropdownId === repo.id ? 'bg-border text-txt-main' : ''}`}
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeDropdownId === repo.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="py-1">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRepoToDelete(repo);
                                                                setActiveDropdownId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} /> {t('delete_repo')}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 bg-surface flex items-center justify-between text-sm text-txt-sec">
            <div>
                {t('showing')} <span className="text-txt-main font-medium">1</span> {t('to')} <span className="text-txt-main font-medium">{filteredRepos.length}</span> {t('of')} <span className="text-txt-main font-medium">12</span> {t('results')}
            </div>
            <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-md border border-border hover:bg-background text-txt-sec hover:text-txt-main disabled:opacity-50">
                    {t('previous')}
                </button>
                <button className="px-3 py-1.5 rounded-md border border-border hover:bg-background text-txt-sec hover:text-txt-main">
                    {t('next')}
                </button>
            </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {repoToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
             <div className="bg-surface border border-border rounded-lg w-full max-w-md p-6 shadow-2xl relative">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="text-red-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-txt-main">{t('delete_confirm_title')}</h3>
                        <p className="text-sm text-txt-sec">{t('delete_confirm_msg')} <span className="font-semibold text-txt-main">{repoToDelete.name}</span>?</p>
                    </div>
                </div>
                
                <p className="text-sm text-txt-sec mb-6 pl-16">
                    {t('delete_warning')}
                </p>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setRepoToDelete(null)}>{t('cancel')}</Button>
                    <Button variant="danger" onClick={handleDeleteRepo}>{t('delete_repo')}</Button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};