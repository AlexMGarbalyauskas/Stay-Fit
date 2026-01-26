import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function ShareApp() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    // Use deployed URL
    const url = 'https://stay-fit-2.onrender.com/';
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
      downloadLink.download = 'stayfit-qr-code.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'StayFit App',
          text: 'Check out the StayFit app! Scan this QR code or visit:',
          url: appUrl
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(appUrl);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="pt-20 px-4 max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 mb-4 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="bg-white p-6 rounded shadow text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="w-6 h-6 text-green-600" />
            <h1 className="text-xl font-semibold text-gray-900">Share StayFit</h1>
          </div>
          
          <p className="text-sm text-gray-700 mb-6">
            Share this QR code with friends so they can access the app instantly!
          </p>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-6">
            <QRCodeSVG
              id="qr-code-svg"
              value={appUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* App URL */}
          <div className="bg-gray-50 p-3 rounded mb-6">
            <p className="text-xs text-gray-500 mb-1">App URL</p>
            <p className="text-sm font-mono text-gray-900 break-all">{appUrl}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadQR}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5" /> Download QR Code
            </button>
            
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <Share2 className="w-5 h-5" /> Share Link
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-left bg-blue-50 p-4 rounded">
            <p className="text-sm font-semibold text-gray-900 mb-2">How to use:</p>
            <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
              <li>Download or screenshot the QR code</li>
              <li>Share it with friends via messaging apps</li>
              <li>They scan it with their camera to open the app</li>
              <li>They can add it to their home screen</li>
            </ol>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
}
