import React, { useState } from 'react';
import { Card, Input, Button } from '../components/ui';
import { Copy, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export const Connect: React.FC = () => {
  const [showSecret, setShowSecret] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const endpointUrl = "https://github-monitor-api.onrender.com/api/webhooks/github";
  const webhookSecret = "gh_sec_71d9e2f4-a5b6-4c8d-9e0f-1a2b3c4d5e6f";

  const handleCopy = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-txt-main mb-2">Conectar Repositório</h1>
        <p className="text-txt-sec">Siga o tutorial abaixo para configurar o Webhook no seu repositório GitHub e começar a monitorar eventos em tempo real.</p>
      </div>

      <Card className="p-6 border-l-4 border-l-primary">
        <h2 className="text-xl font-semibold text-txt-main mb-4 flex items-center gap-2">
            Passo a Passo
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-txt-sec ml-2">
            <li>Acesse as <strong>Settings</strong> (Configurações) do seu repositório no GitHub.</li>
            <li>No menu lateral esquerdo, clique em <strong>Webhooks</strong>.</li>
            <li>Clique no botão <strong>Add webhook</strong>.</li>
            <li>No campo <strong>Payload URL</strong>, cole o endereço do endpoint abaixo.</li>
            <li>Em <strong>Content type</strong>, selecione <code>application/json</code>.</li>
            <li>No campo <strong>Secret</strong>, cole o segredo exibido abaixo.</li>
            <li>
              Em "Which events would you like to trigger this webhook?", selecione <strong>Let me select individual events</strong> e marque:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Branch or tag creation</li>
                <li>Issues</li>
                <li>Pull requests</li>
                <li>Pushes</li>
              </ul>
            </li>
            <li>Clique em <strong>Add webhook</strong> para finalizar.</li>
        </ol>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
            <h3 className="text-lg font-medium text-txt-main mb-3">Endpoint da API</h3>
            <p className="text-sm text-txt-sec mb-4">
                Este é o endereço que o GitHub usará para enviar os eventos.
            </p>
            <div className="relative">
                <Input 
                    value={endpointUrl} 
                    readOnly 
                    className="pr-10 font-mono text-sm bg-background"
                />
                <button 
                    onClick={() => handleCopy(endpointUrl, setCopiedEndpoint)}
                    className="absolute right-3 top-2.5 text-txt-sec hover:text-primary transition-colors"
                    title="Copiar URL"
                >
                    {copiedEndpoint ? <CheckCircle2 size={18} className="text-success" /> : <Copy size={18} />}
                </button>
            </div>
        </Card>

        <Card className="p-6">
            <h3 className="text-lg font-medium text-txt-main mb-3">Webhook Secret</h3>
            <p className="text-sm text-txt-sec mb-4">
                Chave de segurança para validar a autenticidade dos eventos.
            </p>
            <div className="relative">
                <Input 
                    type={showSecret ? "text" : "password"}
                    value={webhookSecret} 
                    readOnly 
                    className="pr-20 font-mono text-sm bg-background"
                />
                <div className="absolute right-3 top-2.5 flex items-center gap-2">
                    <button 
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-txt-sec hover:text-primary transition-colors"
                        title={showSecret ? "Ocultar" : "Mostrar"}
                    >
                        {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <div className="w-px h-4 bg-border"></div>
                    <button 
                        onClick={() => handleCopy(webhookSecret, setCopiedSecret)}
                        className="text-txt-sec hover:text-primary transition-colors"
                        title="Copiar Secret"
                    >
                        {copiedSecret ? <CheckCircle2 size={18} className="text-success" /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
        </Card>
      </div>

      <Card className="p-4 bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
        <div>
            <h4 className="font-semibold text-blue-500 text-sm">Nota Importante</h4>
            <p className="text-xs text-blue-500/80 mt-1">
                Certifique-se de que o repositório foi adicionado ao dashboard antes de configurar o webhook. 
                Eventos de repositórios não cadastrados serão ignorados por segurança.
            </p>
        </div>
      </Card>
    </div>
  );
};
