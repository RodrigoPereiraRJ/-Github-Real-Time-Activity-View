import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Contributor } from '../types';
import { useLanguage } from '../services/languageContext';
import { Card } from '../components/ui';
import { Users, Trophy, GitCommit, Search, ExternalLink, Medal } from 'lucide-react';

export const Contributors: React.FC = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    loadContributors();
  }, []);

  const loadContributors = async () => {
    setLoading(true);
    try {
      // Fetch all events (limit 1000 to get a good history)
      const events = await api.events.list({ size: '1000' });
      
      // Map to aggregate contributions per user (any event type)
      const contributionsMap = new Map<string, Contributor>();
      
      events.forEach(event => {
          const login = event.actorName || event.actor || 'Unknown';
          // Skip if unknown
          if (login === 'Unknown') return;
          
          if (contributionsMap.has(login)) {
              const current = contributionsMap.get(login)!;
              contributionsMap.set(login, {
                  ...current,
                  contributions: current.contributions + 1
              });
          } else {
              contributionsMap.set(login, {
                  id: event.actor || login, // fallback ID
                  login: login,
                  avatarUrl: event.avatarUrl || '',
                  contributions: 1
              });
          }
      });
      
      const contributorsList = Array.from(contributionsMap.values());
      
      // Sort by contributions desc
      const sorted = contributorsList.sort((a, b) => b.contributions - a.contributions);
      setContributors(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContributors = contributors.filter(c => 
    c.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topContributor = contributors.length > 0 ? contributors[0] : null;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Medal size={20} className="text-yellow-500" />;
    if (index === 1) return <Medal size={20} className="text-gray-400" />;
    if (index === 2) return <Medal size={20} className="text-amber-600" />;
    return <span className="text-txt-sec font-mono text-sm">#{index + 1}</span>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-txt-main">{t('contributors_title')}</h2>
        <p className="text-txt-sec text-sm">{t('contributors_desc')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex items-center gap-4 border-l-4 border-l-blue-500">
            <div className="p-3 bg-blue-500/10 rounded-full">
                <Users size={24} className="text-blue-500" />
            </div>
            <div>
                <p className="text-txt-sec text-xs font-medium uppercase">{t('active_devs')}</p>
                <h3 className="text-2xl font-bold text-txt-main">{contributors.length}</h3>
            </div>
        </Card>

        <Card className="flex items-center gap-4 border-l-4 border-l-yellow-500">
            <div className="p-3 bg-yellow-500/10 rounded-full">
                <Trophy size={24} className="text-yellow-500" />
            </div>
            <div>
                <p className="text-txt-sec text-xs font-medium uppercase">{t('top_contributor')}</p>
                <h3 className="text-xl font-bold text-txt-main">
                    {topContributor?.login || '-'}
                </h3>
            </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 text-txt-sec" size={16} />
                <input 
                    type="text" 
                    placeholder={t('search_contributor')}
                    className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-2 text-sm text-txt-main focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-sm text-txt-sec">
                {t('sorted_by')} <span className="text-txt-main font-medium">{t('activity')}</span>
            </div>
        </div>

        {/* Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-background">
            {loading ? (
                <p className="text-txt-sec col-span-full text-center">{t('loading_contributors')}</p>
            ) : filteredContributors.map((contributor, index) => (
                <div key={contributor.id} className="bg-surface border border-border rounded-lg p-5 flex items-start gap-4 hover:border-txt-sec transition-colors group shadow-sm">
                    <div className="relative">
                        <img 
                            src={contributor.avatarUrl} 
                            alt={contributor.login} 
                            className="w-14 h-14 rounded-full border-2 border-border"
                        />
                        <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 border border-border shadow-sm">
                            {getRankIcon(index)}
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h4 className="text-base font-bold text-txt-main truncate">{contributor.login}</h4>
                            <a href={`#`} className="text-txt-sec hover:text-primary">
                                <ExternalLink size={14} />
                            </a>
                        </div>
                        
                        <div className="mt-2">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs text-txt-sec">{t('contributions')}</span>
                                <span className="text-sm font-mono font-medium text-primary">{contributor.contributions}</span>
                            </div>
                            {/* Visual Bar relative to top contributor */}
                            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ width: `${(contributor.contributions / (topContributor?.contributions || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            
            {!loading && filteredContributors.length === 0 && (
                <div className="col-span-full py-8 text-center text-txt-sec">
                    No contributors found matching "{searchTerm}"
                </div>
            )}
        </div>
      </div>
    </div>
  );
};