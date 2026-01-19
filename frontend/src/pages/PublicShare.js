import { useState, useEffect } from 'react';
import { Download, QrCode, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../components/Navbar';

export default function PublicShare() {
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    const url = window.location.origin;
    setAppUrl(url);
  }, []);

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = 'stayfit-download-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="pt-12 px-4 max-w-lg mx-auto text-center">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">StayFit</h1>
          <p className="text-gray-600">Your fitness companion app</p>
        </div>

        {/* Hero Box */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <div className="bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Get the App</h2>
          <p className="text-gray-600 mb-6">Scan the QR code below with your phone camera to download StayFit instantly!</p>

          {/* QR Code */}
          <div className="bg-gray-50 p-6 rounded-2xl inline-block mb-6 border-2 border-gray-200">
            <QRCodeSVG
              id="qr-code-svg"
              value={appUrl}
              size={200}
              level="H"
              includeMargin={true}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>

          {/* Instructions */}
          <div className="text-left bg-blue-50 p-4 rounded-xl mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-2">📱 How to install:</p>
            <ol className="text-xs text-gray-700 space-y-1">
              <li><strong>1.</strong> Point your phone camera at the QR code</li>
              <li><strong>2.</strong> Tap the notification that appears</li>
              <li><strong>3.</strong> Tap "Add to Home screen"</li>
              <li><strong>4.</strong> Launch from your home screen!</li>
            </ol>
          </div>

          {/* Direct Link */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2">Or visit directly:</p>
            <a href={appUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 break-all font-mono text-sm hover:underline">
              {appUrl}
            </a>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownloadQR}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold mb-3"
          >
            <Download className="w-5 h-5" /> Download QR Code Image
          </button>

          {/* Features Preview */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-3">What you get:</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="text-sm">
                <div className="text-lg">💪</div>
                <p className="text-xs text-gray-700">Workouts</p>
              </div>
              <div className="text-sm">
                <div className="text-lg">👥</div>
                <p className="text-xs text-gray-700">Friends</p>
              </div>
              <div className="text-sm">
                <div className="text-lg">💬</div>
                <p className="text-xs text-gray-700">Chat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-white rounded-2xl p-6 shadow">
          <a href="/login" className="flex items-center justify-center gap-2 text-green-600 font-semibold hover:text-green-700">
            Already have an account? <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>
    </div>
  );
}
