import { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

export default function DebugOverlay() {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const maxLogs = 50;

  useEffect(() => {
    // Capture console.log
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [
        ...prev.slice(-maxLogs + 1),
        { type: 'log', message: args.map(arg => JSON.stringify(arg)).join(' '), time: new Date().toLocaleTimeString() }
      ]);
    };

    // Capture console.error
    const originalError = console.error;
    console.error = (...args) => {
      originalError(...args);
      setLogs(prev => [
        ...prev.slice(-maxLogs + 1),
        { type: 'error', message: args.map(arg => JSON.stringify(arg)).join(' '), time: new Date().toLocaleTimeString() }
      ]);
    };

    // Capture console.warn
    const originalWarn = console.warn;
    console.warn = (...args) => {
      originalWarn(...args);
      setLogs(prev => [
        ...prev.slice(-maxLogs + 1),
        { type: 'warn', message: args.map(arg => JSON.stringify(arg)).join(' '), time: new Date().toLocaleTimeString() }
      ]);
    };

    // Capture unhandled errors
    const handleError = (event) => {
      setLogs(prev => [
        ...prev.slice(-maxLogs + 1),
        { type: 'error', message: `${event.error?.message || event.message}`, time: new Date().toLocaleTimeString() }
      ]);
    };
    window.addEventListener('error', handleError);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
      >
        Debug ({logs.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 bg-gray-900 text-white shadow-xl rounded-t-lg w-full sm:w-96 max-h-96 flex flex-col border-l-4 border-red-600">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-t-lg">
        <h3 className="text-sm font-bold">Debug Console ({logs.length})</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:text-gray-300"
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => setLogs([])}
            className="text-xs text-gray-400 hover:text-gray-200"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Logs */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto bg-gray-950 px-2 py-2 font-mono text-xs space-y-1">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={`py-1 px-2 rounded ${
                  log.type === 'error'
                    ? 'bg-red-900 text-red-200'
                    : log.type === 'warn'
                    ? 'bg-yellow-900 text-yellow-200'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                <span className="text-gray-500">[{log.time}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
