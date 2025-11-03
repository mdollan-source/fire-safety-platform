'use client';

import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, Smartphone, Share, Plus, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface InstallButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  showIcon?: boolean;
}

export function InstallButton({
  variant = 'primary',
  className = '',
  showIcon = true
}: InstallButtonProps) {
  const { canInstall, isIOS, install } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (!canInstall) {
    return null; // Don't show button if already installed or not installable
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      await install();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleInstall}
        className={className}
      >
        {showIcon && <Smartphone className="w-5 h-5 mr-2" />}
        Install App
      </Button>

      {/* iOS Install Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Install Fire Safety Log
              </h3>
              <p className="text-gray-600">
                Add our app to your home screen for quick access
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    Tap the <Share className="w-4 h-4 inline mx-1" /> <strong>Share</strong> button
                    at the bottom of Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                    <Plus className="w-4 h-4 inline ml-1" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    Tap <strong>"Add"</strong> in the top right corner
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This feature only works in Safari on iOS.
                If you're using Chrome or another browser, please open this page in Safari.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-6"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export function InstallBanner() {
  const { canInstall, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (!canInstall || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      await install();
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex w-12 h-12 bg-white bg-opacity-20 rounded-lg items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">
                  Install Fire Safety Log
                </p>
                <p className="text-xs sm:text-sm text-blue-100">
                  Access offline, faster loading, and app-like experience
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleInstall}
                className="bg-white text-blue-600 hover:bg-blue-50 whitespace-nowrap"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
              <button
                onClick={() => setDismissed(true)}
                className="text-white hover:text-blue-100 p-2"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Install Fire Safety Log
              </h3>
              <p className="text-gray-600">
                Add our app to your home screen for quick access
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    Tap the <Share className="w-4 h-4 inline mx-1" /> <strong>Share</strong> button
                    at the bottom of Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                    <Plus className="w-4 h-4 inline ml-1" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    Tap <strong>"Add"</strong> in the top right corner
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This feature only works in Safari on iOS.
                If you're using Chrome or another browser, please open this page in Safari.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-6"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
