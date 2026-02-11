import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { API_BASE_URL } from '../constants';
import { Event, Repository } from '../types';
import { useLanguage } from '../services/languageContext';
import { Card, Button } from '../components/ui';
import { GitCommit, GitPullRequest, AlertCircle, Calendar as CalendarIcon, Filter, ChevronDown, Check, Rocket, ChevronLeft, ChevronRight, FileText, ExternalLink } from 'lucide-react';
import { DiffModal } from '../components/DiffModal';

export const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, locale } = useLanguage();
  const [searchParams] = useSearchParams();

  const [diffEventId, setDiffEventId] = useState<string | null>(null);

  // Filter States
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [eventTypes, setEventTypes] = useState({
    PUSH: true,
    PULL_REQUEST: true,
    ISSUE: true,
    RELEASE: false
  });
  
  // Calendar State
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selectedFullDate, setSelectedFullDate] = useState<Date | null>(new Date()); 

  useEffect(() => {
    // Check for date param in URL
    const dateParam = searchParams.get('date');
    const repoIdParam = searchParams.get('repoId');

    if (repoIdParam) {
        setSelectedRepo(repoIdParam);
    }

    if (dateParam) {
        // Parse "YYYY-MM-DD" as local date, not UTC
        const [year, month, day] = dateParam.split('-').map(Number);
        // Month is 0-indexed in Date constructor
        const date = new Date(year, month - 1, day);
        
        if (!isNaN(date.getTime())) {
            setSelectedFullDate(date);
            setViewDate(date);
        }
    }
  }, [searchParams]); 

  useEffect(() => {
    const loadRepos = async () => {
      try {
        const reposData = await api.repositories.list();
        setRepos(reposData);
      } catch (error) {
        console.error("Failed to load repositories", error);
      }
    };
    loadRepos();
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadEvents = async () => {
      setLoading(true);
      try {
        // Calculate start and end of the current view month
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        const eventsData = await api.events.list({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            size: '100' // Ensure we get enough events for the month
        });
        
        if (isActive) {
          setEvents(eventsData);
        }
      } catch (error) {
        console.error("Failed to load events", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };
    loadEvents();
    
    return () => {
      isActive = false;
    };
  }, [viewDate]);

  // SSE Listener
  useEffect(() => {
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(`${API_BASE_URL}/events/stream?token=${token}`);

    eventSource.addEventListener('event-update', (event: any) => {
        try {
            const newEvent = JSON.parse(event.data);
            
            // Only add if it belongs to the current view month/year
            const eventDate = new Date(newEvent.createdAt);
            if (eventDate.getMonth() === viewDate.getMonth() && eventDate.getFullYear() === viewDate.getFullYear()) {
                setEvents(prev => [newEvent, ...prev]);
            }
        } catch (error) {
            console.error('Error parsing SSE event:', error);
        }
    });

    return () => {
        eventSource.close();
    };
  }, [viewDate]);

  const getEventIcon = (type: string) => {
    switch (type) {
        case 'PUSH': return <GitCommit size={18} className="text-green-500" />;
        case 'PULL_REQUEST': return <GitPullRequest size={18} className="text-purple-500" />;
        case 'ISSUE': return <AlertCircle size={18} className="text-orange-500" />;
        default: return <CalendarIcon size={18} className="text-gray-500" />;
    }
  };

  const toggleEventType = (type: keyof typeof eventTypes) => {
      setEventTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const selectAllEventTypes = () => {
    setEventTypes({
      PUSH: true,
      PULL_REQUEST: true,
      ISSUE: true,
      RELEASE: true
    });
  };

  const filteredEvents = events.filter(event => {
      if (selectedRepo !== 'all' && event.repositoryId !== selectedRepo) return false;
      
      if (event.type === 'PUSH' && !eventTypes.PUSH) return false;
      if (event.type === 'PULL_REQUEST' && !eventTypes.PULL_REQUEST) return false;
      if (event.type === 'ISSUE' && !eventTypes.ISSUE) return false;
      
      // Treat RELEASE and other types (like CREATE) under the "RELEASE" filter category for now
      const isOtherType = !['PUSH', 'PULL_REQUEST', 'ISSUE'].includes(event.type);
      if (isOtherType && !eventTypes.RELEASE) return false;
      
      // Date Filter
      if (selectedFullDate) {
          const eventDate = new Date(event.createdAt);
          const isSameDay = 
              eventDate.getDate() === selectedFullDate.getDate() &&
              eventDate.getMonth() === selectedFullDate.getMonth() &&
              eventDate.getFullYear() === selectedFullDate.getFullYear();
          
          if (!isSameDay) return false;
      }

      return true;
  });

  const uniqueContributors = new Set(filteredEvents.map(e => e.actorName)).size;

  const changeMonth = (offset: number) => {
      const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
      setViewDate(newDate);
  };

  const handleDateClick = (day: number) => {
      const newSelectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      
      // Allow deselecting if clicking the same day
      if (selectedFullDate && 
          selectedFullDate.getDate() === day && 
          selectedFullDate.getMonth() === viewDate.getMonth() && 
          selectedFullDate.getFullYear() === viewDate.getFullYear()) {
          setSelectedFullDate(null);
      } else {
          setSelectedFullDate(newSelectedDate);
      }
  };

  const renderCalendar = () => {
      const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfMonth = new Date(year, month, 1).getDay(); 

      const paddingDays = Array.from({ length: firstDayOfMonth });
      const currentDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      // Localized month name
      const monthName = viewDate.toLocaleDateString(locale, { month: 'long' });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if next month is in the future
      const nextMonthCheck = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      const isNextMonthFuture = nextMonthCheck > new Date();

      // Check if previous month is before 2026
      const prevMonthCheck = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      const isPrevMonthForbidden = prevMonthCheck.getFullYear() < 2026;

      return (
          <div className="bg-surface p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-4 text-txt-main">
                  <button 
                    onClick={() => changeMonth(-1)} 
                    disabled={isPrevMonthForbidden}
                    className={`p-1 rounded transition-colors ${isPrevMonthForbidden ? 'opacity-30 cursor-not-allowed' : 'hover:bg-background'}`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-bold">{capitalizedMonth} {year}</span>
                  <button 
                    onClick={() => changeMonth(1)} 
                    disabled={isNextMonthFuture}
                    className={`p-1 rounded transition-colors ${isNextMonthFuture ? 'opacity-30 cursor-not-allowed' : 'hover:bg-background'}`}
                  >
                    <ChevronRight size={16} />
                  </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {days.map((d, i) => <span key={i} className="text-xs text-txt-sec font-medium">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                  {paddingDays.map((_, i) => <span key={`pad-${i}`} className="text-sm py-1.5"></span>)}
                  {currentDays.map(day => {
                      const dateToCheck = new Date(year, month, day);
                      const isFuture = dateToCheck > today;
                      
                      const isSelected = selectedFullDate && selectedFullDate.getDate() === day && selectedFullDate.getMonth() === month && selectedFullDate.getFullYear() === year;
                      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

                      return (
                        <button 
                            key={day} 
                            onClick={() => !isFuture && handleDateClick(day)}
                            disabled={isFuture}
                            className={`text-sm w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                                isFuture 
                                ? 'opacity-30 cursor-not-allowed text-txt-sec' 
                                : isSelected
                                    ? 'bg-primary text-white shadow-lg' 
                                    : isToday
                                        ? 'bg-background text-primary font-bold border border-primary/30'
                                        : 'text-txt-sec hover:bg-background hover:text-txt-main'
                            }`}
                        >
                            {day}
                        </button>
                      );
                  })}
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <aside className="w-full lg:w-72 shrink-0 space-y-8 sticky top-6">
        <div>
            <h3 className="text-xs font-bold text-txt-sec uppercase tracking-wider mb-3">{t('repo_filter')}</h3>
            <div className="relative">
                <select 
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full appearance-none bg-surface border border-border text-txt-main text-sm rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="all">{t('all_repos')}</option>
                    {repos.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-txt-sec pointer-events-none" size={16} />
            </div>
        </div>

        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-txt-sec uppercase tracking-wider">{t('event_types')}</h3>
                <button 
                  onClick={selectAllEventTypes}
                  className="text-xs text-primary hover:underline"
                >
                  {t('select_all')}
                </button>
            </div>
            <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${eventTypes.PUSH ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-border group-hover:border-txt-sec'}`}>
                        {eventTypes.PUSH && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={eventTypes.PUSH} onChange={() => toggleEventType('PUSH')} />
                    <span className="flex items-center gap-2 text-sm text-txt-main">
                        <GitCommit size={14} className="text-blue-400" /> {t('push_events')}
                    </span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${eventTypes.PULL_REQUEST ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-border group-hover:border-txt-sec'}`}>
                        {eventTypes.PULL_REQUEST && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={eventTypes.PULL_REQUEST} onChange={() => toggleEventType('PULL_REQUEST')} />
                    <span className="flex items-center gap-2 text-sm text-txt-main">
                        <GitPullRequest size={14} className="text-purple-400" /> {t('pull_requests')}
                    </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${eventTypes.ISSUE ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-border group-hover:border-txt-sec'}`}>
                        {eventTypes.ISSUE && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={eventTypes.ISSUE} onChange={() => toggleEventType('ISSUE')} />
                    <span className="flex items-center gap-2 text-sm text-txt-main">
                        <AlertCircle size={14} className="text-green-400" /> {t('issues')}
                    </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${eventTypes.RELEASE ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-border group-hover:border-txt-sec'}`}>
                        {eventTypes.RELEASE && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={eventTypes.RELEASE} onChange={() => toggleEventType('RELEASE')} />
                    <span className="flex items-center gap-2 text-sm text-txt-main">
                        <Rocket size={14} className="text-orange-400" /> {t('releases')}
                    </span>
                </label>
            </div>
        </div>

        <div>
            <h3 className="text-xs font-bold text-txt-sec uppercase tracking-wider mb-3">{t('date_range')}</h3>
            {renderCalendar()}
        </div>

        <div className="pt-6 border-t border-border space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-txt-sec">{t('total_events')}</span>
                <span className="text-txt-main font-mono font-medium">{filteredEvents.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-txt-sec">{t('contributors')}</span>
                <span className="text-txt-main font-mono font-medium">{uniqueContributors}</span>
            </div>
        </div>
      </aside>

      <div className="flex-1 w-full space-y-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-txt-main">{t('event_log')}</h2>
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="lg:hidden">
                    <Filter size={14} className="mr-2"/> {t('filters')}
                </Button>
            </div>
        </div>

        <div className="space-y-4">
            {loading ? (
                <p className="text-txt-sec">{t('loading_events')}</p>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-txt-sec border border-dashed border-border rounded-lg">
                    {t('no_events_match')}
                </div>
            ) : (
                filteredEvents.map((event, index) => (
                    <Card key={event.id} className="flex gap-4 p-4 hover:bg-background transition-colors border-l-4 border-l-transparent hover:border-l-primary relative overflow-hidden">
                        <div className="flex flex-col items-center">
                            <div className="bg-background p-2 rounded-full border border-border">
                                {getEventIcon(event.type)}
                            </div>
                            {index !== filteredEvents.length - 1 && (
                                <div className="w-px h-full bg-border my-2"></div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 mb-1">
                                    <img src={event.avatarUrl} alt={event.actorName} className="w-5 h-5 rounded-full" />
                                    <span className="font-semibold text-sm text-txt-main hover:text-primary cursor-pointer">{event.actorName || event.actor}</span>
                                    <span className="text-txt-sec text-sm">{t('performed')}</span>
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                                        event.type === 'PUSH' ? 'border-green-800 text-green-400 bg-green-900/20' :
                                        event.type === 'PULL_REQUEST' ? 'border-purple-800 text-purple-400 bg-purple-900/20' :
                                        'border-orange-800 text-orange-400 bg-orange-900/20'
                                    }`}>
                                        {event.type}
                                    </span>
                                    {(new Date().getTime() - new Date(event.createdAt).getTime()) < 60 * 60 * 1000 && (
                                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                            {t('new_badge')}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-txt-sec whitespace-nowrap">
                                    {new Date(event.createdAt).toLocaleDateString(locale)} {new Date(event.createdAt).toLocaleTimeString(locale, {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <p className="text-txt-sec text-sm mt-1">{event.message}</p>
                            {event.branch && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-txt-sec">
                                    <span className="bg-background px-2 py-0.5 rounded text-blue-400 font-mono border border-border">
                                        {event.branch}
                                    </span>
                                </div>
                            )}
                            
                            <div className="mt-3 flex gap-2 flex-wrap">
                                {(event.type === 'PUSH' || event.type === 'PULL_REQUEST') && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-xs h-7 px-2 text-txt-sec hover:text-primary hover:bg-background border border-transparent hover:border-border gap-1.5 transition-all"
                                        onClick={() => setDiffEventId(event.id)}
                                    >
                                        <FileText size={14} />
                                        {t('view_changes') || 'View Changes'}
                                    </Button>
                                )}
                                {event.url && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-xs h-7 px-2 text-txt-sec hover:text-primary hover:bg-background border border-transparent hover:border-border gap-1.5 transition-all"
                                        onClick={() => window.open(event.url, '_blank')}
                                    >
                                        <ExternalLink size={14} />
                                        GitHub
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))
            )}
        </div>
      </div>
      
      <DiffModal 
        isOpen={!!diffEventId} 
        onClose={() => setDiffEventId(null)} 
        eventId={diffEventId || ''} 
      />
    </div>
  );
};