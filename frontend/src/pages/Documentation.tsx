import { BookOpen, ChevronRight, Copy, Check, Key, Lock, Code2, Webhook, Zap, AlertCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { API_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('curl');
  const navigate = useNavigate();

  const navigation = [
    { id: 'introduction', label: 'Introduction', icon: BookOpen },
    { id: 'authentication', label: 'Authentification', icon: Lock },
    { id: 'api-keys', label: 'Clés API', icon: Key },
    { id: 'public-routes', label: 'Routes Publiques', icon: Webhook },
    { id: 'endpoints', label: 'Endpoints', icon: Code2 },
    { id: 'examples', label: 'Exemples', icon: Zap },
  ];

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      bash: 'text-green-400',
      curl: 'text-green-400',
      javascript: 'text-yellow-400',
      typescript: 'text-blue-400',
      python: 'text-blue-300',
      php: 'text-purple-400',
      json: 'text-orange-400',
      sql: 'text-pink-400',
    };
    return colors[language.toLowerCase()] || 'text-gray-500';
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative group">
      <div className="absolute right-3 top-3 z-10">
        <button
          onClick={() => copyToClipboard(code, id)}
          className="p-2 bg-[#132426] hover:bg-[#05F26C]/20 border border-[#0a1b1e] rounded-lg transition-all shadow-lg"
        >
          {copiedCode === id ? (
            <Check className="w-4 h-4 text-[#05F26C]" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#05F26C]" />
          )}
        </button>
      </div>
      <div className={`absolute top-3 left-3 text-xs font-mono uppercase font-semibold ${getLanguageColor(language)}`}>
        {language}
      </div>
      <pre className="bg-[#0a0e10] border border-[#0a1b1e] rounded-lg p-4 pt-10 overflow-x-auto hover:border-[#05F26C]/30 transition-all">
        <code className="text-sm text-gray-300 font-mono leading-relaxed">{code}</code>
      </pre>
    </div>
  );

  const LanguageSelector = ({ onSelect, selected }: { onSelect: (lang: string) => void; selected: string }) => {
    const languages = [
      { id: 'curl', label: 'cURL' },
      { id: 'javascript', label: 'JavaScript (Fetch)' },
      { id: 'axios', label: 'JavaScript (Axios)' },
      { id: 'python', label: 'Python' },
      { id: 'php', label: 'PHP' },
    ];

    return (
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => onSelect(lang.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selected === lang.id
                ? 'bg-[#05F26C] text-[#132426] shadow-lg'
                : 'bg-[#132426] text-gray-400 hover:bg-[#05F26C]/10 hover:text-white border border-[#0a1b1e]'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#030709] flex">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:block w-64 border-r border-[#0a1b1e] bg-[#0f1c1c] sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-[#05F26C] rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#132426]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Documentation</h2>
              <p className="text-xs text-gray-400">API Reference</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                    activeSection === item.id
                      ? 'bg-[#05F26C] text-[#132426] font-semibold'
                      : 'text-gray-400 hover:bg-[#05F26C]/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                  {activeSection === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full p-4">
          {/* Introduction */}
          {activeSection === 'introduction' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">API N8N SaaS</h1>
                <p className="text-lg text-gray-400">
                  Bienvenue dans la documentation de l'API N8N SaaS. Cette API vous permet d'interagir
                  avec vos workflows N8N via des requêtes HTTP.
                </p>
              </div>

              <div className="bg-gradient-to-r from-[#05F26C]/10 to-transparent border border-[#05F26C]/30 rounded-xl p-6 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#05F26C] rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-[#132426]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">Base URL</h3>
                    <code className="text-base text-[#05F26C] font-mono bg-[#132426] px-3 py-2 rounded-lg block">{API_URL}</code>
                    <p className="text-xs text-gray-400 mt-2">Toutes les requêtes API doivent utiliser cette URL de base</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">Fonctionnalités principales</h2>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#05F26C] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#132426]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Authentification par clé API</p>
                      <p className="text-sm text-gray-400">Sécurisez vos requêtes avec des clés API</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#05F26C] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#132426]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Gestion des instances</p>
                      <p className="text-sm text-gray-400">Démarrez, arrêtez et gérez vos instances</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#05F26C] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#132426]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Webhooks</p>
                      <p className="text-sm text-gray-400">Déclenchez vos workflows via HTTP</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#05F26C] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#132426]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Statistiques en temps réel</p>
                      <p className="text-sm text-gray-400">Consultez les métriques de vos instances</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Authentication */}
          {activeSection === 'authentication' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Authentification</h1>
                <p className="text-lg text-gray-400">
                  L'API utilise l'authentification par token JWT et clés API pour sécuriser les requêtes.
                </p>
              </div>

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">JWT Token</h2>
                <p className="text-gray-400 mb-4">
                  Pour les requêtes nécessitant une authentification utilisateur, utilisez votre token JWT
                  dans le header Authorization.
                </p>
                
                <h3 className="text-lg font-semibold text-white mb-3">Exemple de requête</h3>
                <CodeBlock
                  id="jwt-example"
                  language="bash"
                  code={`curl -X GET ${API_URL}/api/instances/my \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
                />
              </div>

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Se connecter</h2>
                
                <h3 className="text-lg font-semibold text-white mb-3">POST /api/auth/login</h3>
                <CodeBlock
                  id="login-example"
                  language="javascript"
                  code={`fetch('${API_URL}/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'your_password'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Token:', data.token);
});`}
                />

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">Réponse</h3>
                <CodeBlock
                  id="login-response"
                  language="json"
                  code={`{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}`}
                />
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeSection === 'api-keys' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Clés API</h1>
                <p className="text-lg text-gray-400">
                  Les clés API permettent d'accéder à vos workflows sans authentification utilisateur.
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-2">Gérer vos clés API</p>
                    <p className="text-sm text-gray-400 mb-3">
                      Vous pouvez créer et gérer vos clés API depuis la page dédiée.
                    </p>
                    <button
                      onClick={() => navigate('/api-keys')}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] rounded-lg font-medium transition-all"
                    >
                      <Key className="w-4 h-4" />
                      <span>Gérer mes clés API</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-semibold text-white mb-4">Créer une clé API</h2>
                
                <h3 className="text-lg font-semibold text-white mb-3">POST /api/api-keys</h3>
                <CodeBlock
                  id="create-key"
                  language="javascript"
                  code={`fetch('${API_URL}/api/api-keys', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Production Key',
    expiresAt: '2026-12-31'
  })
})
.then(response => response.json())
.then(data => {
  console.log('API Key:', data.data.key);
});`}
                />
              </div>

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Utiliser une clé API</h2>
                <p className="text-gray-400 mb-4">
                  Ajoutez votre clé API dans le header <code className="text-[#05F26C]">X-API-Key</code>
                </p>
                
                <CodeBlock
                  id="use-key"
                  language="bash"
                  code={`curl -X GET ${API_URL}/api/instances/stats \\
  -H "X-API-Key: your_api_key_here"`}
                />
              </div>

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Lister les clés API</h2>
                
                <h3 className="text-lg font-semibold text-white mb-3">GET /api/api-keys</h3>
                <CodeBlock
                  id="list-keys"
                  language="bash"
                  code={`curl -X GET ${API_URL}/api/api-keys \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
                />
              </div>
            </div>
          )}

          {/* Public Routes */}
          {activeSection === 'public-routes' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Routes Publiques</h1>
                <p className="text-lg text-gray-400">
                  Utilisez vos workflows N8N via des routes publiques sécurisées par clé API.
                </p>
              </div>

              <div className="bg-gradient-to-r from-[#05F26C]/10 to-transparent border border-[#05F26C]/30 rounded-xl p-6 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#05F26C] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Key className="w-6 h-6 text-[#132426]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-2">Authentification requise</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Les routes publiques nécessitent une clé API valide. Créez votre clé depuis la page dédiée.
                    </p>
                    <button
                      onClick={() => navigate('/api-keys')}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-[#132426] hover:bg-[#05F26C]/10 border border-[#0a1b1e] text-white rounded-lg font-medium transition-all"
                    >
                      <Key className="w-4 h-4" />
                      <span>Créer une clé API</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-semibold text-white mb-4">Déclencher un Workflow</h2>
                <p className="text-gray-400 mb-4">
                  Exécutez vos workflows N8N via une requête HTTP sécurisée par clé API.
                </p>
                
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">POST</span>
                    <code className="text-white">/api/public/workflow/:workflowId/execute</code>
                  </div>
                  <p className="text-sm text-gray-400">
                    Remplacez <code className="text-[#05F26C]">:workflowId</code> par l'ID de votre workflow N8N
                  </p>
                </div>

                <LanguageSelector onSelect={setSelectedLanguage} selected={selectedLanguage} />

                {selectedLanguage === 'curl' && (
                  <CodeBlock
                    id="public-workflow-curl"
                    language="bash"
                    code={`curl -X POST "${API_URL}/api/public/workflow/your-workflow-id/execute" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "Hello from API"
    }
  }'`}
                  />
                )}

                {selectedLanguage === 'javascript' && (
                  <CodeBlock
                    id="public-workflow-fetch"
                    language="javascript"
                    code={`// Utilisation avec Fetch API
const response = await fetch('${API_URL}/api/public/workflow/your-workflow-id/execute', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello from API'
    }
  })
});

const result = await response.json();
console.log('Workflow result:', result);`}
                  />
                )}

                {selectedLanguage === 'axios' && (
                  <CodeBlock
                    id="public-workflow-axios"
                    language="javascript"
                    code={`// Installation: npm install axios
const axios = require('axios');

const response = await axios.post(
  '${API_URL}/api/public/workflow/your-workflow-id/execute',
  {
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello from API'
    }
  },
  {
    headers: {
      'X-API-Key': 'your_api_key_here',
      'Content-Type': 'application/json'
    }
  }
);

console.log('Workflow result:', response.data);`}
                  />
                )}

                {selectedLanguage === 'python' && (
                  <CodeBlock
                    id="public-workflow-python"
                    language="python"
                    code={`# Installation: pip install requests
import requests

url = '${API_URL}/api/public/workflow/your-workflow-id/execute'
headers = {
    'X-API-Key': 'your_api_key_here',
    'Content-Type': 'application/json'
}
payload = {
    'data': {
        'name': 'John Doe',
        'email': 'john@example.com',
        'message': 'Hello from API'
    }
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()
print('Workflow result:', result)`}
                  />
                )}

                {selectedLanguage === 'php' && (
                  <CodeBlock
                    id="public-workflow-php"
                    language="php"
                    code={`<?php

$url = '${API_URL}/api/public/workflow/your-workflow-id/execute';
$headers = [
    'X-API-Key: your_api_key_here',
    'Content-Type: application/json'
];
$payload = json_encode([
    'data' => [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'message' => 'Hello from API'
    ]
]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);

print_r($result);

?>`}
                  />
                )}
              </div>

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-semibold text-white mb-4">Réponse</h2>
                <CodeBlock
                  id="public-workflow-response"
                  language="json"
                  code={`{
  "success": true,
  "executionId": "exec_abc123def456",
  "status": "success",
  "data": {
    "result": "Workflow executed successfully",
    "processedAt": "2026-01-09T14:32:10Z"
  }
}`}
                />
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-2">Sécurité</p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Ne partagez jamais vos clés API publiquement</li>
                      <li>• Utilisez des variables d'environnement pour stocker vos clés</li>
                      <li>• Régénérez vos clés si elles sont compromises</li>
                      <li>• Définissez une date d'expiration pour vos clés</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Endpoints */}
          {activeSection === 'endpoints' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Endpoints</h1>
                <p className="text-lg text-gray-400">
                  Référence complète des endpoints disponibles dans l'API.
                </p>
              </div>

              {/* Instances */}
              <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Instances</h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-2 py-1 bg-[#05F26C] text-[#132426] text-xs font-bold rounded">GET</span>
                      <code className="text-white">/api/instances/my</code>
                    </div>
                    <p className="text-gray-400 mb-3">Récupérer votre instance N8N</p>
                    <CodeBlock
                      id="get-instance"
                      language="javascript"
                      code={`const response = await fetch('/api/instances/my', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
const data = await response.json();`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">POST</span>
                      <code className="text-white">/api/instances/start</code>
                    </div>
                    <p className="text-gray-400 mb-3">Démarrer votre instance</p>
                    <CodeBlock
                      id="start-instance"
                      language="bash"
                      code={`curl -X POST ${API_URL}/api/instances/start \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">POST</span>
                      <code className="text-white">/api/instances/stop</code>
                    </div>
                    <p className="text-gray-400">Arrêter votre instance</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">POST</span>
                      <code className="text-white">/api/instances/restart</code>
                    </div>
                    <p className="text-gray-400">Redémarrer votre instance</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Statistiques</h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-2 py-1 bg-[#05F26C] text-[#132426] text-xs font-bold rounded">GET</span>
                      <code className="text-white">/api/stats/current</code>
                    </div>
                    <p className="text-gray-400 mb-3">Statistiques en temps réel</p>
                    <CodeBlock
                      id="get-stats"
                      language="json"
                      code={`{
  "success": true,
  "data": {
    "stats": {
      "cpu": { "percent": 45.2 },
      "memory": { "percent": 62.8, "usageMB": 512, "limitMB": 1024 },
      "network": { "rxMB": 125.3, "txMB": 98.7 },
      "uptime": "3d 12h 45m"
    }
  }
}`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-2 py-1 bg-[#05F26C] text-[#132426] text-xs font-bold rounded">GET</span>
                      <code className="text-white">/api/stats/history</code>
                    </div>
                    <p className="text-gray-400">Historique des statistiques (24h)</p>
                  </div>
                </div>
              </div>

              {/* Logs */}
              <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Logs</h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-2 py-1 bg-[#05F26C] text-[#132426] text-xs font-bold rounded">GET</span>
                      <code className="text-white">/api/logs/logs?tail=100</code>
                    </div>
                    <p className="text-gray-400 mb-3">Récupérer les logs de l'instance</p>
                    <CodeBlock
                      id="get-logs"
                      language="bash"
                      code={`curl -X GET "${API_URL}/api/logs/logs?tail=100" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-2 py-1 bg-[#05F26C] text-[#132426] text-xs font-bold rounded">GET</span>
                      <code className="text-white">/api/logs/errors?tail=50</code>
                    </div>
                    <p className="text-gray-400">Récupérer les erreurs de workflow</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Webhooks */}
          {activeSection === 'webhooks' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Webhooks</h1>
                <p className="text-lg text-gray-400">
                  Déclenchez vos workflows N8N via des requêtes HTTP.
                </p>
              </div>

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Configuration</h2>
                <p className="text-gray-400 mb-4">
                  Dans N8N, ajoutez un node "Webhook" et configurez l'URL de production.
                  Votre workflow sera accessible via cette URL.
                </p>
                
                <div className="bg-[#05F26C]/10 border border-[#05F26C]/30 rounded-lg p-4 mb-4">
                  <p className="text-white">
                    <strong>URL du webhook :</strong><br />
                    <code className="text-[#05F26C]">https://votre-instance.com/webhook/votre-id-workflow</code>
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-white mb-3">Exemple GET</h3>
                <CodeBlock
                  id="webhook-get"
                  language="bash"
                  code={`curl -X GET "https://votre-instance.com/webhook/mon-workflow?param1=value1&param2=value2"`}
                />

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">Exemple POST</h3>
                <CodeBlock
                  id="webhook-post"
                  language="javascript"
                  code={`fetch('https://votre-instance.com/webhook/mon-workflow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello from API'
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
                />
              </div>

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Réponse personnalisée</h2>
                <p className="text-gray-400 mb-4">
                  Vous pouvez configurer la réponse de votre webhook dans N8N en utilisant
                  le node "Respond to Webhook".
                </p>
                
                <CodeBlock
                  id="webhook-response"
                  language="json"
                  code={`{
  "success": true,
  "message": "Workflow exécuté avec succès",
  "data": {
    "processedAt": "2026-01-09T12:34:56Z",
    "status": "completed"
  }
}`}
                />
              </div>
            </div>
          )}

          {/* Examples */}
          {activeSection === 'examples' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Exemples de Code</h1>
                <p className="text-lg text-gray-400">
                  Exemples pratiques d'utilisation de l'API dans différents langages.
                </p>
              </div>

              <LanguageSelector onSelect={setSelectedLanguage} selected={selectedLanguage} />

              <div className="bg-[#132426] border border-[#0a1b1e] rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-semibold text-white mb-6">Exemples complets</h2>
                
                {selectedLanguage === 'curl' && (
                  <CodeBlock
                    id="example-curl"
                    language="bash"
                    code={`# Variables
API_URL="${API_URL}"
JWT_TOKEN="your_jwt_token"
API_KEY="your_api_key"

# Récupérer l'instance
curl -X GET "$API_URL/api/instances/my" \\
  -H "Authorization: Bearer $JWT_TOKEN"

# Obtenir les statistiques
curl -X GET "$API_URL/api/stats/current" \\
  -H "Authorization: Bearer $JWT_TOKEN"

# Déclencher un workflow public avec clé API
curl -X POST "$API_URL/api/public/workflow/your-workflow-id/execute" \\
  -H "X-API-Key: $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
      "name": "Test User",
      "email": "test@example.com"
    }
  }'

# Créer une clé API
curl -X POST "$API_URL/api/api-keys" \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production Key",
    "expiresAt": "2026-12-31"
  }'`}
                  />
                )}

                {selectedLanguage === 'javascript' && (
                  <CodeBlock
                    id="example-fetch"
                    language="javascript"
                    code={`// Utilisation avec Fetch API (natif dans les navigateurs et Node.js 18+)

const API_URL = '${API_URL}';
const JWT_TOKEN = 'your_jwt_token';
const API_KEY = 'your_api_key';

// Récupérer l'instance
async function getInstance() {
  try {
    const response = await fetch(\`\${API_URL}/api/instances/my\`, {
      headers: {
        'Authorization': \`Bearer \${JWT_TOKEN}\`
      }
    });
    const data = await response.json();
    console.log('Instance:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Obtenir les statistiques
async function getStats() {
  try {
    const response = await fetch(\`\${API_URL}/api/stats/current\`, {
      headers: {
        'Authorization': \`Bearer \${JWT_TOKEN}\`
      }
    });
    const data = await response.json();
    console.log('Stats:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Déclencher un workflow public avec clé API
async function executeWorkflow(workflowId, payload) {
  try {
    const response = await fetch(
      \`\${API_URL}/api/public/workflow/\${workflowId}/execute\`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: payload })
      }
    );
    const result = await response.json();
    console.log('Workflow result:', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Utilisation
(async () => {
  try {
    await getInstance();
    await getStats();
    await executeWorkflow('your-workflow-id', {
      name: 'Test User',
      email: 'test@example.com'
    });
  } catch (error) {
    console.error('Failed:', error);
  }
})();`}
                  />
                )}

                {selectedLanguage === 'axios' && (
                  <CodeBlock
                    id="example-axios"
                    language="javascript"
                    code={`// Installation: npm install axios
const axios = require('axios');

const API_URL = '${API_URL}';
const JWT_TOKEN = 'your_jwt_token';
const API_KEY = 'your_api_key';

// Créer une instance axios avec config par défaut
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': \`Bearer \${JWT_TOKEN}\`,
    'Content-Type': 'application/json'
  }
});

// Client pour routes publiques
const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  }
});

// Récupérer l'instance
async function getInstance() {
  try {
    const response = await apiClient.get('/api/instances/my');
    console.log('Instance:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}

// Obtenir les statistiques
async function getStats() {
  try {
    const response = await apiClient.get('/api/stats/current');
    console.log('Stats:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}

// Déclencher un workflow public
async function executeWorkflow(workflowId, payload) {
  try {
    const response = await publicClient.post(
      \`/api/public/workflow/\${workflowId}/execute\`,
      { data: payload }
    );
    console.log('Workflow result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}

// Utilisation
(async () => {
  try {
    await getInstance();
    await getStats();
    await executeWorkflow('your-workflow-id', {
      name: 'Test User',
      email: 'test@example.com'
    });
  } catch (error) {
    console.error('Failed:', error);
  }
})();`}
                  />
                )}

                {selectedLanguage === 'python' && (
                  <CodeBlock
                    id="example-python"
                    language="python"
                    code={`# Installation: pip install requests
import requests
from typing import Dict, Any

API_URL = '${API_URL}'
JWT_TOKEN = 'your_jwt_token'
API_KEY = 'your_api_key'

class N8NAPIClient:
    def __init__(self, api_url: str, token: str, api_key: str = None):
        self.api_url = api_url
        self.token = token
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        self.public_headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        } if api_key else {}
    
    def get_instance(self) -> Dict[str, Any]:
        """Récupérer l'instance"""
        response = requests.get(
            f'{self.api_url}/api/instances/my',
            headers=self.headers
        )
        response.raise_for_status()
        print('Instance:', response.json())
        return response.json()
    
    def get_stats(self) -> Dict[str, Any]:
        """Obtenir les statistiques"""
        response = requests.get(
            f'{self.api_url}/api/stats/current',
            headers=self.headers
        )
        response.raise_for_status()
        print('Stats:', response.json())
        return response.json()
    
    def execute_workflow(self, workflow_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Exécuter un workflow public"""
        url = f'{self.api_url}/api/public/workflow/{workflow_id}/execute'
        response = requests.post(
            url,
            json={'data': payload},
            headers=self.public_headers
        )
        response.raise_for_status()
        print('Workflow result:', response.json())
        return response.json()

# Utilisation
if __name__ == '__main__':
    client = N8NAPIClient(API_URL, JWT_TOKEN, API_KEY)
    
    try:
        # Récupérer l'instance
        instance = client.get_instance()
        
        # Obtenir les stats
        stats = client.get_stats()
        
        # Exécuter un workflow public
        result = client.execute_workflow(
            'your-workflow-id',
            {'name': 'Test User', 'email': 'test@example.com'}
        )
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')`}
                  />
                )}

                {selectedLanguage === 'php' && (
                  <CodeBlock
                    id="example-php"
                    language="php"
                    code={`<?php

class N8NAPIClient {
    private $apiUrl;
    private $token;
    private $apiKey;
    
    public function __construct($apiUrl, $token, $apiKey = null) {
        $this->apiUrl = $apiUrl;
        $this->token = $token;
        $this->apiKey = $apiKey;
    }
    
    private function makeRequest($endpoint, $method = 'GET', $data = null, $useApiKey = false) {
        $ch = curl_init($this->apiUrl . $endpoint);
        
        $headers = $useApiKey && $this->apiKey 
            ? ["X-API-Key: {$this->apiKey}", "Content-Type: application/json"]
            : ["Authorization: Bearer {$this->token}", "Content-Type: application/json"];
        
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 400) {
            throw new Exception("HTTP Error: $httpCode - $response");
        }
        
        return json_decode($response, true);
    }
    
    public function getInstance() {
        $result = $this->makeRequest('/api/instances/my');
        echo "Instance: " . print_r($result, true) . "\\n";
        return $result;
    }
    
    public function getStats() {
        $result = $this->makeRequest('/api/stats/current');
        echo "Stats: " . print_r($result, true) . "\\n";
        return $result;
    }
    
    public function executeWorkflow($workflowId, $payload) {
        $result = $this->makeRequest(
            "/api/public/workflow/$workflowId/execute",
            'POST',
            ['data' => $payload],
            true
        );
        echo "Workflow result: " . print_r($result, true) . "\\n";
        return $result;
    }
}

// Utilisation
$API_URL = '${API_URL}';
$JWT_TOKEN = 'your_jwt_token';
$API_KEY = 'your_api_key';

$client = new N8NAPIClient($API_URL, $JWT_TOKEN, $API_KEY);

try {
    // Récupérer l'instance
    $instance = $client->getInstance();
    
    // Obtenir les stats
    $stats = $client->getStats();
    
    // Exécuter un workflow public
    $result = $client->executeWorkflow(
        'your-workflow-id',
        ['name' => 'Test User', 'email' => 'test@example.com']
    );
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}

?>`}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
