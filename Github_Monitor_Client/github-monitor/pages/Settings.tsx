import React, { useState } from 'react';
import { Card, Button } from '../components/ui';
import { useTheme } from '../services/themeContext';
import { useLanguage } from '../services/languageContext';
import { Moon, Sun, Monitor, Globe, Check, CheckCircle2, X } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
      // Trigger the success popup
      setShowSuccess(true);
      
      // Hide it after 3 seconds
      setTimeout(() => {
          setShowSuccess(false);
      }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      
      {/* Top Notification Area - Pushes content down when visible */}
      {showSuccess && (
        <div className="w-full bg-[#238636] text-white px-6 py-4 rounded-lg shadow-md flex items-center justify-between gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
             <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full shrink-0">
                    <CheckCircle2 size={24} className="text-white" />
                </div>
                <div>
                    <h4 className="font-bold text-base">Success</h4>
                    <p className="text-sm text-white/90">{t('prefs_saved')}</p>
                </div>
             </div>
             <button 
                onClick={() => setShowSuccess(false)}
                className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            >
                <X size={20} />
            </button>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-txt-main">{t('settings_title')}</h2>
        <p className="text-txt-sec text-sm">{t('settings_desc')}</p>
      </div>

      <div className="space-y-6">
        
        {/* Appearance Section */}
        <section>
             <h3 className="text-lg font-medium text-txt-main mb-4">{t('appearance')}</h3>
             <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Dark Mode Option */}
                    <button 
                        onClick={() => setTheme('dark')}
                        className={`relative p-4 rounded-lg border-2 flex flex-col items-center gap-3 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border hover:border-txt-sec bg-background'}`}
                    >
                        <div className="w-full h-24 bg-[#0d1117] rounded border border-[#30363d] flex items-center justify-center mb-2 shadow-inner">
                             <Moon size={24} className="text-[#8b949e]" />
                        </div>
                        <span className="text-sm font-medium text-txt-main">{t('dark_mode')}</span>
                        {theme === 'dark' && <div className="absolute top-3 right-3 text-primary"><Check size={16} /></div>}
                    </button>

                    {/* Light Mode Option */}
                    <button 
                         onClick={() => setTheme('light')}
                         className={`relative p-4 rounded-lg border-2 flex flex-col items-center gap-3 transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border hover:border-txt-sec bg-background'}`}
                    >
                         <div className="w-full h-24 bg-white rounded border border-gray-200 flex items-center justify-center mb-2 shadow-inner">
                             <Sun size={24} className="text-gray-800" />
                        </div>
                        <span className="text-sm font-medium text-txt-main">{t('light_mode')}</span>
                         {theme === 'light' && <div className="absolute top-3 right-3 text-primary"><Check size={16} /></div>}
                    </button>

                    {/* System Option */}
                    <button 
                         onClick={() => setTheme('system')}
                         className={`relative p-4 rounded-lg border-2 flex flex-col items-center gap-3 transition-all ${theme === 'system' ? 'border-primary bg-primary/10' : 'border-border hover:border-txt-sec bg-background'}`}
                    >
                         <div className="w-full h-24 bg-gradient-to-br from-[#161b22] to-gray-200 rounded border border-border flex items-center justify-center mb-2 shadow-inner">
                             <Monitor size={24} className="text-txt-sec mix-blend-difference" />
                        </div>
                        <span className="text-sm font-medium text-txt-main">{t('system')}</span>
                         {theme === 'system' && <div className="absolute top-3 right-3 text-primary"><Check size={16} /></div>}
                    </button>
                </div>
             </Card>
        </section>

        {/* Language Section */}
        <section>
            <h3 className="text-lg font-medium text-txt-main mb-4">{t('language')}</h3>
            <Card>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-purple-500/10 rounded-full">
                        <Globe size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h4 className="text-base font-medium text-txt-main">{t('display_language')}</h4>
                        <p className="text-sm text-txt-sec">{t('lang_desc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onClick={() => setLanguage('pt')}
                        className={`flex items-center justify-between p-3 rounded-md border transition-all ${language === 'pt' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-txt-main hover:border-txt-sec'}`}
                    >
                        <span className="text-sm font-medium">Português (Brasil)</span>
                        {language === 'pt' && <Check size={16} />}
                    </button>

                    <button
                        onClick={() => setLanguage('en')}
                        className={`flex items-center justify-between p-3 rounded-md border transition-all ${language === 'en' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-txt-main hover:border-txt-sec'}`}
                    >
                        <span className="text-sm font-medium">English (US)</span>
                        {language === 'en' && <Check size={16} />}
                    </button>
                </div>
            </Card>
        </section>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-border mt-8">
          <Button onClick={handleSave}>{t('save_prefs')}</Button>
      </div>
    </div>
  );
};