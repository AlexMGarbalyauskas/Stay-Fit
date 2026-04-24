import { useEffect, useRef, useState } from 'react';
import { X, Bot, Send, Sparkles } from 'lucide-react';
import { askAIHelper } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function AIHelperModal({ open, onClose }) {
  const { t, language } = useLanguage();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  if (!open) return null;

  const handleAsk = async () => {
    const cleaned = prompt.trim();
    if (!cleaned) return;

    setMessages(prev => [...prev, { role: 'user', text: cleaned }]);
    setPrompt('');
    setLoading(true);
    setError('');

    try {
      const res = await askAIHelper(cleaned, language);
      const assistantText = (res.data?.reply || '').trim();
      if (assistantText) {
        setMessages(prev => [...prev, { role: 'assistant', text: assistantText }]);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setError(t('aiEndpointNotFound'));
      } else if (status === 429) {
        const code = err?.response?.data?.code;
        const retryAt = err?.response?.data?.retryAt;

        if (code === 'ai_insufficient_quota') {
          setError(t('aiNoCredits'));
        } else if (retryAt) {
          const retryDate = new Date(retryAt);
          if (!Number.isNaN(retryDate.getTime())) {
            const localRetryTime = retryDate.toLocaleString();
            setError(t('aiRateLimitedRetryAt').replace('{time}', localRetryTime));
          } else {
            setError(t('aiRateLimited'));
          }
        } else {
          setError(t('aiRateLimited'));
        }
      } else {
        setError(err?.response?.data?.error || t('aiHelperError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setPrompt('');
    setMessages([]);
    setError('');
    setLoading(false);
    onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="fixed inset-0 z-[220]">
      <div className="absolute inset-0 bg-black/60" onClick={closeModal} />

      <div className={`absolute inset-0 ${isDark ? 'bg-gray-950/90 text-gray-100' : 'bg-slate-100/90 text-gray-900'} overflow-hidden p-3 sm:p-4`}>
        <div className={`max-w-4xl mx-auto h-full flex flex-col min-h-0 rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-5 h-5" /> {t('aiHelperTitle')}
            </h2>
            <button
              onClick={closeModal}
              className={`p-2 rounded-full transition ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 sm:px-5 py-4 flex-1 min-h-0 flex flex-col gap-4">
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('aiHelperSubtitle')}
            </p>

            <div className={`rounded-xl border p-3 flex-1 min-h-0 ${isDark ? 'border-gray-700 bg-gray-950/40' : 'border-gray-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wide font-semibold text-blue-500">{t('aiConversation')}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{messages.length} {t('messages').toLowerCase()}</p>
              </div>
              <div className="h-full overflow-y-auto pr-1 space-y-3 pb-2">
                {messages.length === 0 && (
                  <div className={`h-full flex items-center justify-center text-center text-sm px-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('aiStartAsking')}
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-xl px-3 py-2 border max-w-[94%] ${
                      message.role === 'user'
                        ? `ml-auto ${isDark ? 'bg-blue-900/35 border-blue-800' : 'bg-blue-50 border-blue-200'}`
                        : `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
                    }`}
                  >
                    <p className={`text-[11px] uppercase tracking-wide font-semibold mb-1 ${message.role === 'user' ? 'text-blue-500' : 'text-emerald-500'}`}>
                      {message.role === 'user' ? t('youText') : t('aiResponse')}
                    </p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('aiAskLabel')}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('aiPromptPlaceholder')}
                className={`w-full min-h-[110px] border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-gray-900 border-gray-600 text-gray-100 focus:ring-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
                }`}
              />

              <button
                onClick={handleAsk}
                disabled={loading || !prompt.trim()}
                className={`mt-3 w-full py-2.5 rounded-xl text-white flex items-center justify-center gap-2 transition ${
                  loading || !prompt.trim()
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
                {loading ? t('aiThinking') : t('aiSend')}
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
