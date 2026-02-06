import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Alert } from '../types';
import { useLanguage } from '../services/languageContext';
import { Card, Button } from '../components/ui';
import { AlertTriangle, Info, CheckCircle2, XCircle, Bell, Filter, ShieldAlert, Check, GitBranch, User } from 'lucide-react';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const { t, locale } = useLanguage();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.alerts.list();
      setAlerts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.alerts.resolve(id);
      setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : a));
    } catch (error) {
      console.error('Failed to resolve alert', error);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          border: 'border-l-red-500',
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-500',
          icon: AlertTriangle,
          badge: 'bg-red-900/30 text-red-400 border-red-800'
        };
      case 'WARNING':
        return {
          border: 'border-l-yellow-500',
          iconBg: 'bg-yellow-500/10',
          iconColor: 'text-yellow-600 dark:text-yellow-500',
          icon: ShieldAlert,
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
        };
      default:
        return {
          border: 'border-l-blue-500',
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-500',
          icon: Info,
          badge: 'bg-blue-900/30 text-blue-400 border-blue-800'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-txt-main">{t('system_alerts')}</h2>
          <p className="text-txt-sec text-sm">{t('alerts_desc')}</p>
        </div>
        
        <div className="flex bg-surface p-1 rounded-md border border-border">
            <button 
                onClick={() => setFilter('ALL')}
                className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${filter === 'ALL' ? 'bg-border text-txt-main shadow-sm' : 'text-txt-sec hover:text-txt-main'}`}
            >
                {t('all')}
            </button>
            <button 
                onClick={() => setFilter('OPEN')}
                className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${filter === 'OPEN' ? 'bg-border text-txt-main shadow-sm' : 'text-txt-sec hover:text-txt-main'}`}
            >
                {t('open')}
            </button>
            <button 
                onClick={() => setFilter('RESOLVED')}
                className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${filter === 'RESOLVED' ? 'bg-border text-txt-main shadow-sm' : 'text-txt-sec hover:text-txt-main'}`}
            >
                {t('resolved')}
            </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
            <p className="text-txt-sec p-4 text-center">{t('checking_alerts')}</p>
        ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
                <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 border border-border">
                    <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-txt-main">{t('all_systems_ok')}</h3>
                <p className="text-txt-sec text-sm mt-1">{t('no_alerts')}</p>
            </div>
        ) : (
            filteredAlerts.map((alert) => {
                const style = getSeverityStyles(alert.severity);
                const Icon = style.icon;

                return (
                    <Card key={alert.id} className={`p-0 overflow-hidden border-l-4 ${style.border}`}>
                        <div className="flex flex-col md:flex-row p-5 gap-4">
                            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${style.iconBg} ${style.iconColor}`}>
                                <Icon size={24} />
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-base font-bold text-txt-main">{alert.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${style.badge}`}>
                                            {alert.severity}
                                        </span>
                                        {alert.branch && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-surface border border-border text-txt-sec">
                                                <GitBranch size={10} />
                                                {alert.branch}
                                            </span>
                                        )}
                                        {alert.authorLogin && (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-surface border border-border text-txt-sec">
                                                {alert.authorAvatarUrl ? (
                                                    <img src={alert.authorAvatarUrl} alt={alert.authorLogin} className="w-3 h-3 rounded-full" />
                                                ) : (
                                                    <User size={10} />
                                                )}
                                                {alert.authorLogin}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-txt-sec whitespace-nowrap">
                                        {new Date(alert.createdAt).toLocaleString(locale)}
                                    </span>
                                </div>
                                <p className="text-txt-sec text-sm leading-relaxed mb-3">
                                    {alert.message}
                                </p>
                                
                                <div className="flex items-center gap-4 text-xs">
                                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${alert.status === 'OPEN' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 'bg-background text-txt-sec border-border'}`}>
                                        {alert.status === 'OPEN' ? <Info size={12} /> : <Check size={12} />}
                                        {alert.status}
                                    </span>
                                    {alert.status === 'OPEN' && (
                                        <button 
                                            onClick={() => handleDismiss(alert.id)}
                                            className="text-txt-sec hover:text-txt-main underline decoration-border underline-offset-2 transition-colors"
                                        >
                                            {t('mark_resolved')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            })
        )}
      </div>
    </div>
  );
};