import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui';
import { useLanguage } from '../services/languageContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingUp, Folder, RefreshCw, Activity, ArrowUpRight, Database } from 'lucide-react';
import { api } from '../services/api';
import { API_BASE_URL } from '../constants';

const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { t, locale } = useLanguage();
  const navigate = useNavigate();

  // State for metrics - Initialized to zero/empty
  const [stats, setStats] = useState({
    totalRepos: 0,
    eventsToday: 0,
    pendingAlerts: 0,
    totalCommitsLast7Days: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [chartFilter, setChartFilter] = useState<'7d' | '30d'>('7d');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activeRepos, setActiveRepos] = useState<any[]>([]);
  const [totalCommitsPeriod, setTotalCommitsPeriod] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch last 30 days of events to support both filters
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const [repos, events, alerts] = await Promise.all([
                api.repositories.list(),
                api.events.list({ 
                    start: thirtyDaysAgo.toISOString(), 
                    size: '500' 
                }),
                api.alerts.list()
            ]);

            setAllEvents(events);

            const today = new Date().toDateString();
            const eventsTodayCount = events.filter(e => new Date(e.createdAt).toDateString() === today).length;
            const pendingAlertsCount = alerts.filter(a => a.status === 'OPEN').length;

            // Process Recent Activity
            const sortedEvents = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const recent = sortedEvents.slice(0, 5).map(e => {
                let title = 'Event';
                let desc = e.message || 'No description';
                let color = 'bg-blue-500';

                switch(e.type) {
                    case 'PUSH':
                        title = 'Push to branch';
                        if (e.branch) title += ` ${e.branch}`;
                        color = 'bg-blue-500';
                        break;
                    case 'PULL_REQUEST':
                        title = 'Pull Request';
                        color = 'bg-purple-500';
                        break;
                    case 'ISSUE':
                        title = 'Issue Activity';
                        color = 'bg-yellow-500';
                        break;
                }

                return {
                    id: e.id,
                    title,
                    desc: `${e.actorName || e.actor || 'Unknown User'}: ${desc}`,
                    time: getTimeAgo(new Date(e.createdAt)),
                    color,
                    isNew: (new Date().getTime() - new Date(e.createdAt).getTime()) < 60 * 60 * 1000
                };
            });
            setRecentActivity(recent);

            setStats({
                totalRepos: repos.length,
                eventsToday: eventsTodayCount,
                pendingAlerts: pendingAlertsCount,
                totalCommitsLast7Days: 0 // Will be updated by the other effect
            });

            // Process Active Repositories
            const activeReposData = repos.map(repo => {
                const repoEvents = events.filter(e => e.repositoryId === repo.id);
                const lastEvent = repoEvents.length > 0 ? repoEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;
                
                // Extract unique contributors
                const contributorsMap = new Map();
                repoEvents.forEach(e => {
                    const name = e.actor || e.actorName;
                    if (name && !contributorsMap.has(name)) {
                        contributorsMap.set(name, e.avatarUrl || '');
                    }
                });
                const contributors = Array.from(contributorsMap.entries()).map(([name, avatarUrl]) => ({ name, avatarUrl }));

                return {
                    id: repo.id,
                    name: repo.name,
                    updated: lastEvent ? getTimeAgo(new Date(lastEvent.createdAt)) : 'No activity',
                    status: repo.status === 'synced' ? 'Active' : (repo.status || 'Inactive'),
                    contributors: contributors,
                    lastCommit: lastEvent?.type === 'PUSH' ? (lastEvent.id.substring(0, 7)) : (lastEvent ? 'Updated' : '-')
                };
            }).filter(r => r.status === 'Active' || r.contributors.length > 0);

            setActiveRepos(activeReposData);

            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            setLoading(false);
        }
    };
    
    fetchData();
  }, [locale]);

  // SSE Listener for Real-time Updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(`${API_BASE_URL}/events/stream?token=${token}`);

    eventSource.addEventListener('event-update', (event: any) => {
        try {
            const newEvent = JSON.parse(event.data);
            
            // 1. Update Recent Activity
            setRecentActivity(prev => {
                let title = 'Event';
                let desc = newEvent.message || 'No description';
                let color = 'bg-blue-500';

                switch(newEvent.type) {
                    case 'PUSH':
                        title = 'Push to branch';
                        if (newEvent.branch) title += ` ${newEvent.branch}`;
                        color = 'bg-blue-500';
                        break;
                    case 'PULL_REQUEST':
                        title = 'Pull Request';
                        color = 'bg-purple-500';
                        break;
                    case 'ISSUE':
                        title = 'Issue Activity';
                        color = 'bg-yellow-500';
                        break;
                }
                
                const activityItem = {
                    id: newEvent.id,
                    title,
                    desc: `${newEvent.actor || 'Unknown User'}: ${desc}`,
                    time: 'Just now', 
                    color,
                    isNew: true
                };

                return [activityItem, ...prev].slice(0, 5);
            });

            // 2. Update Stats (Events Today)
            if (new Date(newEvent.createdAt).toDateString() === new Date().toDateString()) {
                setStats(prev => ({
                    ...prev,
                    eventsToday: prev.eventsToday + 1
                }));
            }
            
            // 3. Update All Events (triggers Chart update)
            setAllEvents(prev => [newEvent, ...prev]);

        } catch (error) {
            console.error('Error parsing SSE event:', error);
        }
    });

    eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
    };

    return () => {
        eventSource.close();
    };
  }, []);

  // Effect to update chart data when filter or events change
  useEffect(() => {
    if (loading) return;

    const days = chartFilter === '7d' ? 7 : 30;
    const timeLabels = Array.from({length: days}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - ((days - 1) - i));
        return { 
            label: d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: chartFilter === '30d' ? 'short' : undefined }),
            dateStr: d.toDateString()
        };
    });

    const newChartData = timeLabels.map(day => {
        const count = allEvents.filter(e => new Date(e.createdAt).toDateString() === day.dateStr).length;
        return {
            name: day.label,
            value: count,
            dateStr: day.dateStr
        };
    });

    setChartData(newChartData);
    const total = newChartData.reduce((acc, curr) => acc + curr.value, 0);
    setTotalCommitsPeriod(total);
    
  }, [allEvents, chartFilter, locale, loading]);

  const handleChartClick = (data: any, indexOrEvent: any) => {
    let dateStr = null;
    let foundIndex = -1;

    // Strategy 1: Try to find dateStr directly in payloads
    if (data?.activePayload?.[0]?.payload?.dateStr) {
        dateStr = data.activePayload[0].payload.dateStr;
    }
    else if (data?.payload?.dateStr) {
        dateStr = data.payload.dateStr;
    }
    else if (data?.dateStr) {
        dateStr = data.dateStr;
    }

    // Strategy 2: If no dateStr, try to find an index and lookup in chartData
    if (!dateStr) {
        // Check for index in data (Chart click often returns activeIndex/activeTooltipIndex)
        if (data?.activeTooltipIndex !== undefined) {
            foundIndex = Number(data.activeTooltipIndex);
        }
        else if (data?.activeIndex !== undefined) {
            foundIndex = Number(data.activeIndex);
        }
        // Check for index in second argument (Dot click often passes props with index as 2nd arg)
        else if (indexOrEvent?.index !== undefined) {
            foundIndex = Number(indexOrEvent.index);
        }
        // Check for index in data (Dot click might pass it in first arg too)
        else if (data?.index !== undefined) {
            foundIndex = Number(data.index);
        }

        if (foundIndex >= 0 && chartData[foundIndex]) {
            dateStr = chartData[foundIndex].dateStr;
        }
    }

    if (dateStr) {
        // The dateStr is in format "Wed Jan 01 2024" (local time string from toDateString())
        // We want to pass "2024-01-01" representing the local date
        const date = new Date(dateStr);
        
        // Use local date parts to construct the YYYY-MM-DD string
        // This avoids any UTC conversion issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateParam = `${year}-${month}-${day}`;
        
        navigate(`/events?date=${dateParam}`);
    } else {
        console.warn("Could not determine date for navigation");
    }
  };

  if (loading) return <div className="text-txt-main p-4">{t('loading_events')}</div>;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-txt-main">{t('dash_overview')}</h2>
        <div className="flex items-center gap-2 text-sm text-txt-sec">
            <span>{t('last_updated')}: {new Date().toLocaleTimeString()}</span>
            <RefreshCw size={14} className="cursor-pointer hover:text-txt-main transition-colors" />
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Repositories */}
        <Card className="relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-txt-sec text-sm font-medium">{t('total_repos')}</p>
                    <h3 className="text-3xl font-bold text-txt-main mt-1">{stats.totalRepos}</h3>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Folder className="w-5 h-5 text-blue-500" />
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <span className="text-txt-sec">{t('this_week')}</span>
            </div>
        </Card>

        {/* Card 2: Events */}
        <Card className="relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-txt-sec text-sm font-medium">{t('events_today')}</p>
                    <h3 className="text-3xl font-bold text-txt-main mt-1">{stats.eventsToday}</h3>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                    <Activity className="w-5 h-5 text-green-500" />
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <span className="text-txt-sec">{t('from_yesterday')}</span>
            </div>
        </Card>

        {/* Card 3: Alerts */}
        <Card className="relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-txt-sec text-sm font-medium">{t('pending_alerts')}</p>
                    <h3 className="text-3xl font-bold text-txt-main mt-1">{stats.pendingAlerts}</h3>
                </div>
                <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
                 <span className="text-txt-sec">System Status</span>
            </div>
        </Card>
      </div>

      {/* Middle Section: Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-base font-semibold text-txt-main">{t('contribution_activity')}</h3>
                        <p className="text-xs text-txt-sec">
                            {chartFilter === '7d' ? t('commits_last_7') : t('commits_last_30')}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-txt-sec capitalize">
                            {new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex bg-background rounded-md p-0.5 border border-border">
                            <button 
                                onClick={() => setChartFilter('7d')}
                            className={`px-3 py-1 text-xs font-medium rounded shadow-sm transition-colors ${
                                chartFilter === '7d' 
                                ? 'text-txt-main bg-surface' 
                                : 'text-txt-sec hover:text-txt-main'
                            }`}
                        >
                            7d
                        </button>
                        <button 
                            onClick={() => setChartFilter('30d')}
                            className={`px-3 py-1 text-xs font-medium rounded shadow-sm transition-colors ${
                                chartFilter === '30d' 
                                ? 'text-txt-main bg-surface' 
                                : 'text-txt-sec hover:text-txt-main'
                            }`}
                        >
                            30d
                        </button>
                    </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-4xl font-bold text-txt-main">{totalCommitsPeriod}</h2>
                </div>

                <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} onClick={handleChartClick}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: 'var(--color-text-secondary)', fontSize: 12}} 
                                    dy={10}
                                />
                                <YAxis hide domain={[0, 'dataMax + 2']} /> 
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
                                    itemStyle={{ color: 'var(--color-text-main)' }}
                                    cursor={{ stroke: 'var(--color-border)' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    name={t('events')}
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                    activeDot={{ r: 6, onClick: handleChartClick, style: { cursor: 'pointer' } }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-txt-sec text-sm">No data available yet</p>
                    )}
                </div>
            </Card>
        </div>

        {/* Recent Activity List */}
        <div className="lg:col-span-1">
            <Card className="h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-semibold text-txt-main">{t('recent_activity')}</h3>
                </div>

                <div className="space-y-6 relative">
                    {/* Vertical Line */}
                    {recentActivity.length > 0 && (
                        <div className="absolute left-[5px] top-3 bottom-3 w-[2px] bg-border z-0"></div>
                    )}

                    {recentActivity.length === 0 ? (
                        <p className="text-sm text-txt-sec text-center py-10">No recent activity found.</p>
                    ) : (
                        recentActivity.map((item: any) => (
                            <div key={item.id} className="relative pl-6">
                                <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full ${item.color} border-2 border-surface z-10`}></div>
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className="text-sm font-medium text-txt-main flex items-center gap-2">
                                        {item.title}
                                        {item.isNew && (
                                            <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                {t('new_badge')}
                                            </span>
                                        )}
                                    </h4>
                                    <span className="text-xs text-txt-sec whitespace-nowrap ml-2">{item.time}</span>
                                </div>
                                <p className="text-xs text-txt-sec">{item.desc}</p>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
      </div>

      {/* Bottom Section: Active Repositories Table */}
      <Card title={t('active_repos')} action={
          <div className="flex items-center gap-1 text-sm text-txt-sec cursor-pointer hover:text-txt-main">
              {t('filter_by')} <span className="ml-1 text-[10px]">▼</span>
          </div>
      }>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="text-xs font-semibold text-txt-sec uppercase tracking-wider border-b border-border">
                    <tr>
                        <th className="pb-3 pl-2">{t('repo_filter')}</th>
                        <th className="pb-3">{t('status')}</th>
                        <th className="pb-3">{t('contributors')}</th>
                        <th className="pb-3 text-right pr-2">{t('last_commit')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {activeRepos.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="py-8 text-center text-txt-sec">
                                No active repositories data.
                            </td>
                        </tr>
                    ) : (
                        activeRepos.map((repo: any) => (
                            <tr key={repo.id} className="group hover:bg-background transition-colors">
                                <td className="py-4 pl-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-background flex items-center justify-center border border-border">
                                            <Database size={14} className="text-txt-sec" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-txt-main group-hover:text-primary transition-colors cursor-pointer">{repo.name}</p>
                                            <p className="text-xs text-txt-sec">Updated {repo.updated}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${repo.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                        {repo.status}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <div className="flex -space-x-2">
                                        {repo.contributors.slice(0, 3).map((c: any, i: number) => (
                                            <img 
                                                key={i} 
                                                src={c.avatarUrl} 
                                                alt={c.name} 
                                                className="w-6 h-6 rounded-full border-2 border-surface" 
                                                title={c.name} 
                                            />
                                        ))}
                                        {repo.contributors.length > 3 && (
                                            <div className="w-6 h-6 rounded-full border-2 border-surface bg-gray-700 flex items-center justify-center text-[10px] text-white">
                                                +{repo.contributors.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 text-right pr-2 font-mono text-txt-sec">
                                    {repo.lastCommit}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};