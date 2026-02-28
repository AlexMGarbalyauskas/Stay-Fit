import { useState } from 'react';
import { ArrowLeft, Bot, Send, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import { askAIHelper } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function AIHelper() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';

  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    const cleaned = prompt.trim();
    if (!cleaned) return;

    setLoading(true);
    setError('');

    try {
      const res = await askAIHelper(cleaned);
      setReply(res.data?.reply || '');
    } catch (err) {
      setError(err?.response?.data?.error || t('aiHelperError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={`min-h-screen pt-20 pb-24 ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
        <div className="max-w-md mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 mb-4 transition ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}
          >
            <ArrowLeft size={18} /> {t('back')}
          </button>

          <div className={`rounded-xl p-4 shadow ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <h1 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Bot className="w-5 h-5" /> {t('aiHelperTitle')}
            </h1>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('aiHelperSubtitle')}
            </p>

            <label className="text-sm font-medium mb-2 block">{t('aiAskLabel')}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('aiPromptPlaceholder')}
              className={`w-full min-h-[120px] border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-gray-900 border-gray-600 text-gray-100 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
              }`}
            />

            <button
              onClick={handleAsk}
              disabled={loading || !prompt.trim()}
              className={`mt-3 w-full py-2 rounded-lg text-white flex items-center justify-center gap-2 transition ${
                loading || !prompt.trim()
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
              {loading ? t('aiThinking') : t('aiSend')}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-500">{error}</p>
            )}

            {reply && (
              <div className={`mt-4 rounded-lg p-3 border ${isDark ? 'border-gray-600 bg-gray-900' : 'border-gray-200 bg-slate-50'}`}>
                <p className="text-xs uppercase tracking-wide font-semibold mb-2 text-blue-500">{t('aiResponse')}</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{reply}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Navbar />
    </>
  );
}
