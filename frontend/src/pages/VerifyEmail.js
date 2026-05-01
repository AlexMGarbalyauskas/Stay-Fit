// This component handles the email verification process after a user registers. 
// It displays a form for entering the 6-digit verification 
// code sent to the user's email, and provides options to 
// resend the code or go back to the login page. 
// It also includes error handling and feedback messages for the user.







//imports 
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Loader } from 'lucide-react';
import { resendVerificationCode, verifyEmailCode } from '../api';
//imports end 










//main component
export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [emailSent, setEmailSent] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [error, setError] = useState('');
  //end of state variables











//use effect 1 
  // On component mount, check for the 'user' query parameter which 
  // should contain the user's email and ID.
  useEffect(() => {
    const userParam = searchParams.get('user');
    const emailSentParam = searchParams.get('emailSent');


    // If the 'user' parameter is missing, we redirect to the login page.
    if (!userParam) {
      navigate('/login');
      return;
    }


    // try to parse the 'user' parameter. If it's valid, we set the email and user ID in state.
    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      setEmail(user.email);
      setUserId(user.id);
      if (emailSentParam === 'false') setEmailSent(false);
    } catch {
      navigate('/login');
    }
  }, [searchParams, navigate]);
//end of use effect 1








//block 1 
  // This function is called when the user submits the verification form.
  const handleVerify = async (e) => {

    // We prevent the default form submission behavior and reset any existing error messages.
    e.preventDefault();
    setError('');
    
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }


    // We set the verifying state to true to disable the form and show a loading state.
    setVerifying(true);
    try {
      const response = await verifyEmailCode(code, userId);
      
      // Save token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to home
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };
//end of block 1







//block 2
  // This function is called when the user clicks the "Resend Code" button.
  const handleResend = async () => {
    if (!userId) return;
    setResendMessage('');
    setError('');
    setResending(true);

    // We call the API to resend the verification code. If successful, we show a success message. If it fails, we show an error message.
    try {

      // Call the API to resend the verification code
      const response = await resendVerificationCode(userId);
      if (response.data.emailSent) {
        setEmailSent(true);
        setResendMessage('A new verification code has been sent.');

        // Clear the code input field
      } else {
        setResendMessage('We could not send the email. Please try again later.');
      }

      // Clear the code input field
    } catch (err) {

      // If there's an error, we display an appropriate message to the user.
      setResendMessage(err.response?.data?.error || 'Failed to resend code. Please try again.');

      // If the error indicates that the email couldn't be sent, we update the emailSent state to false to show the appropriate message in the UI.
    } finally {
      setResending(false);
    }
  };
//end of block 2












  //main render
  // The UI is designed to be clean and user-friendly, 
  // with clear instructions and feedback for the user. 
  // It includes a form for entering the verification code, 
  // buttons for resending the code and going back to the login page, 
  // and messages to guide the user through the process.
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Verify Your Email
        </h1>
        <p className="text-center text-gray-600 mb-4">
          A 6-digit verification code has been sent to <strong>{email}</strong>
        </p>
        {!emailSent && (
          <p className="text-sm text-red-500 text-center mb-4">
            We couldn't send the email. Click resend or check your email settings.
          </p>
        )}
        <p className="text-sm text-gray-500 text-center mb-3">
          Enter the code below to verify your account.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800 text-center font-medium">
            💡 Don't see the email? Check your spam/junk folder.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:border-blue-500 focus:outline-none"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {resendMessage && (
            <p className="text-sm text-gray-600 text-center">{resendMessage}</p>
          )}

          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full border-2 border-blue-300 text-blue-700 py-3 rounded-lg font-semibold hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? 'Resending...' : 'Resend Code'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:border-gray-400 transition-all"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
//end of main render 

}
