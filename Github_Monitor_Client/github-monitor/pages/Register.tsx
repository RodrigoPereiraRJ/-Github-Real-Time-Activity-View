import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { useLanguage } from '../services/languageContext';
import { api } from '../services/api';
import { Button, Input, Card } from '../components/ui';
import { Github, UserPlus } from 'lucide-react';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    githubId: '',
    matricula: ''
  });
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
      const data = await api.auth.register(formData);
      login(data.token, { id: data.id, name: data.username, email: data.email });
      navigate('/');
    } catch (err) {
      setError('Registration failed. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6 text-white gap-2 items-center">
            <Github size={40} />
            <span className="text-2xl font-bold tracking-tight">GitMonitor</span>
        </div>
        
        <Card className="shadow-xl border border-[#30363d] bg-[#161b22]">
          <h2 className="text-xl font-bold text-white mb-6 text-center">{t('create_account')}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label={t('full_name')} 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required 
            />
            
            <Input 
              label={t('email_addr')}
              type="email"
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
            />
            
            <Input 
              label={t('password')} 
              type="password"
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />

            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label={t('github_id')} 
                    value={formData.githubId} 
                    onChange={(e) => setFormData({...formData, githubId: e.target.value})}
                    required 
                />
                 <Input 
                    label={t('matricula')} 
                    value={formData.matricula} 
                    onChange={(e) => setFormData({...formData, matricula: e.target.value})}
                    required 
                />
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm flex items-center gap-2">
                <UserPlus size={14} /> {error}
              </div>
            )}

            <Button className="w-full font-bold" disabled={loading}>
              {loading ? t('creating_account') : t('signup_btn')}
            </Button>
          </form>

          <div className="mt-6 border-t border-[#30363d] pt-4 text-center">
             <p className="text-sm text-gray-400">
                {t('already_have_account')} <a href="#/login" className="text-[#58a6ff] hover:underline">{t('login_link')}</a>
             </p>
          </div>
        </Card>
      </div>
    </div>
  );
};