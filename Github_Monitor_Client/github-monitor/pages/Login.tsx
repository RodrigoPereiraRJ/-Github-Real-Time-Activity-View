import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { useLanguage } from '../services/languageContext';
import { api } from '../services/api';
import { Button, Input, Card } from '../components/ui';
import { Lock } from 'lucide-react';
import { GithubLogo } from '../components/GithubLogo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const validateEmail = (value: string) => {
    if (!value) return t('email_required') || 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t('email_invalid') || 'Invalid email format';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return t('password_required') || 'Password is required';
    if (value.length < 8) return t('password_length') || 'Password must be at least 8 characters';
    if (!/[a-z]/.test(value)) return t('password_lowercase') || 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(value)) return t('password_number') || 'Password must contain a number';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) setPasswordError(validatePassword(value));
  };

  const handleBlurEmail = () => {
    setEmailError(validateEmail(email));
  };

  const handleBlurPassword = () => {
    setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (emailErr || passErr) {
      setEmailError(emailErr);
      setPasswordError(passErr);
      return;
    }

    setLoading(true);
    
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
      setFormError(t('invalid_credentials') || 'Invalid credentials. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6 text-txt-main gap-2 items-center">
            <GithubLogo className="w-10 h-10 text-txt-main" />
            <span className="text-2xl font-bold tracking-tight">GitMonitor</span>
        </div>
        
        <Card className="shadow-xl">
          <h2 className="text-xl font-bold text-txt-main mb-6 text-center">{t('signin_title')}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input 
              label={t('email_addr')}
              type="email" 
              value={email} 
              onChange={handleEmailChange}
              onBlur={handleBlurEmail}
              error={emailError}
              success={!emailError && email.length > 0}
              placeholder="name@company.com"
            />
            
            <div>
                 <Input 
                    label={t('password')} 
                    type="password" 
                    value={password} 
                    onChange={handlePasswordChange}
                    onBlur={handleBlurPassword}
                    error={passwordError}
                    success={!passwordError && password.length > 0}
                  />
                  <div className="flex justify-end mt-1">
                     <a href="#" className="text-xs text-primary hover:underline">{t('forgot_pass')}</a>
                  </div>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm flex items-center gap-2 animate-in fade-in">
                <Lock size={14} /> {formError}
              </div>
            )}

            <Button className="w-full font-bold bg-transparent border border-border text-txt-main hover:bg-black/5 dark:hover:bg-white/10 focus:ring-0 focus:ring-offset-0 focus:outline-none" disabled={loading}>
              {loading ? t('signing_in') : t('signin_btn')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};