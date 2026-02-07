import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmailToken } from '../api';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { log, error as logError } from '../utils/logger';

export default function VerifyEmailToken() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    log('🔍 VerifyEmailToken page loaded', { userId });

    if (!token || !userId) {
      logError('❌ Missing token or userId');
      setStatus('error');
      setError('Missing verification token or user ID');
      return;
    }
    
    // Verify the token
    verifyEmailToken(token, userId)
      .then((response) => {
        log('✅ Verification successful');
        
        // Save token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setStatus('success');
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      })
      .catch((err) => {
        logError('❌ Verification failed:', err);
        logError('Error response:', err.response?.data);
        setStatus('error');
        setError(err.response?.data?.error || 'Failed to verify email. Please try again.');
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pt-20 pb-20 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {status === 'verifying' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Verifying Your Email
            </h1>
            <p className="text-center text-gray-600">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Email Verified!
            </h1>
            <p className="text-center text-gray-600">
              Your email has been successfully verified. Welcome to Stay Fit! Redirecting to home...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-center text-gray-600 mb-6">
              {error || 'An error occurred during verification.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
