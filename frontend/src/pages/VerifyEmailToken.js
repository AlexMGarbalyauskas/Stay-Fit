//verify email token page 
// shows loading state while verifying, 
// success message on success, and error message on failure



//imports 
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmailToken } from '../api';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { log, error as logError } from '../utils/logger';
//imports end 





//component for verifying email token 
export default function VerifyEmailToken() {






  //hooks
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [error, setError] = useState('');
//hooks end







  //use effect 1 
  // This effect runs once on component mount to verify the email token.
  //  It extracts the token and userId from the URL parameters, 
  // validates them, and then calls the API to verify the token. 
  // Based on the response, it updates the status and handles 
  // navigation or error display accordingly.
  //effect to verify token on component mount
  useEffect(() => {

    // Extract token and userId from URL parameters
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    // Log the received token and userId for debugging
    log('VerifyEmailToken page loaded', { userId });


    // Validate presence of token and userId
    if (!token || !userId) {
      logError('Missing token or userId');
      setStatus('error');
      setError('Missing verification token or user ID');
      return;
    }
    
    // Verify the token
    verifyEmailToken(token, userId)

    // Handle successful verification
      .then((response) => {
        log('Verification successful');
        
        // Save token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Update status and navigate to home after a short delay
        setStatus('success');
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      })

      // Handle verification errors
      .catch((err) => {
        logError('Verification failed:', err);
        logError('Error response:', err.response?.data);
        setStatus('error');
        setError(err.response?.data?.error || 'Failed to verify email. Please try again.');
      });
  }, [searchParams, navigate]);
//use effect 1 end







  //main render
  // Render different UI based on verification status#
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
  //main render end
}
