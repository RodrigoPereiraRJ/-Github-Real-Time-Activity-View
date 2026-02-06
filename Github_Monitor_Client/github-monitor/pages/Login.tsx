import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { useLanguage } from '../services/languageContext';
import { api } from '../services/api';
import { Button, Input, Card } from '../components/ui';
import { Github, Lock } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await api.auth.login(email, password);
      login(data.token, { 
        id: data.id, 
        name: data.username, 
        email: data.email, 
        avatarUrl: data.avatarUrl, 
        role: data.role 
      });
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6 text-txt-main gap-2 items-center">
            <Github size={40} />
            <span className="text-2xl font-bold tracking-tight">GitMonitor</span>
        </div>
        
        <Card className="shadow-xl">
          <h2 className="text-xl font-bold text-txt-main mb-6 text-center">{t('signin_title')}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label={t('email_addr')}
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required 
            />
            
            <div>
                 <Input 
                    label={t('password')} 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <div className="flex justify-end mt-1">
                     <a href="#" className="text-xs text-primary hover:underline">{t('forgot_pass')}</a>
                  </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm flex items-center gap-2">
                <Lock size={14} /> {error}
              </div>
            )}

            <Button className="w-full font-bold" disabled={loading}>
              {loading ? t('signing_in') : t('signin_btn')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};