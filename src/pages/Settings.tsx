import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cpu,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Radio,
  Server,
  Save,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['settings-status'],
    queryFn: () => api.getSettings(),
  });

  const [provider, setProvider] = useState<string>('mock');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');

  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Sync state once fetched
  React.useEffect(() => {
    if (status) {
      setProvider(status.current_provider);
    }
  }, [status]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateSettings({
        ai_provider: provider,
        openai_api_key: openaiKey || undefined,
        gemini_api_key: geminiKey || undefined,
        anthropic_api_key: anthropicKey || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-status'] });
      alert('Settings saved successfully!');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update settings');
    },
  });

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testAIConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Application Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure AI vision providers, API credentials, and inspect market data connectivity.
        </p>
      </div>

      {/* AI Provider Section */}
      <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-6">
        <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
          <Cpu className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-gray-100">AI Vision Provider Engine</h2>
        </div>

        {/* Provider Radio Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'mock', name: 'Mock Engine', desc: 'No API key needed (Realistic local F&O synthesis)' },
            { id: 'openai', name: 'OpenAI GPT-4o', desc: 'GPT-4o Vision multimodal analysis' },
            { id: 'gemini', name: 'Google Gemini', desc: 'Gemini 1.5 Pro / Flash vision analysis' },
            { id: 'claude', name: 'Anthropic Claude', desc: 'Claude 3.5 Sonnet vision analysis' },
          ].map((item) => {
            const isSelected = provider === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setProvider(item.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/50'
                    : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-gray-200">{item.name}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-600' : 'border-gray-600'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* API Keys Inputs */}
        <div className="space-y-4 pt-2">
          {provider === 'openai' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder={status?.is_openai_configured ? '••••••••••••••••••••••••' : 'sk-...'}
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                {status?.is_openai_configured ? 'Key already configured on server.' : 'Enter key to update.'}
              </p>
            </div>
          )}

          {provider === 'gemini' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Gemini API Key
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={status?.is_gemini_configured ? '••••••••••••••••••••••••' : 'AIzaSy...'}
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                {status?.is_gemini_configured ? 'Key already configured on server.' : 'Enter key to update.'}
              </p>
            </div>
          )}

          {provider === 'claude' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder={status?.is_anthropic_configured ? '••••••••••••••••••••••••' : 'sk-ant-...'}
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                {status?.is_anthropic_configured ? 'Key already configured on server.' : 'Enter key to update.'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-700 transition-colors"
          >
            <Server className="w-4 h-4" />
            <span>{isTesting ? 'Testing Connectivity...' : 'Test AI Connection'}</span>
          </button>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2.5 ${
              testResult.status === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/40 border-red-500/50 text-red-300'
            }`}
          >
            {testResult.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Market Data Provider Status (Section 30) */}
      <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-gray-100">Live Market Data Connection</h2>
          </div>
          <span className="text-xs font-mono bg-amber-950 text-amber-400 px-2.5 py-0.5 rounded border border-amber-900">
            DISCONNECTED
          </span>
        </div>

        <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 text-xs space-y-2">
          <div className="font-semibold text-gray-200">
            Status: {status?.market_data_status || 'Market data not connected'}
          </div>
          <p className="text-gray-400 leading-relaxed">
            In strict compliance with architectural guidelines, this application never fabricates live price ticks, volume numbers, or open-interest metrics. Real-time broker connectivity (Zerodha Kite, Upstox, Angel One, Dhan) can be connected when official credentials are provided.
          </p>
        </div>
      </div>
    </div>
  );
};
