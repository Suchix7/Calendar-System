import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event natively fired by Chromium/Android browsers
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the native browser installation prompt!
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    // We can't use the prompt again, clear it
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed sm:bottom-6 bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
      <div className="flex flex-col">
        <span className="font-semibold text-sm">Install Calendar App</span>
        <span className="text-gray-400 text-xs">Add to your home screen for quick offline access.</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstall}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl flex items-center justify-center transition-colors shadow-md"
        >
          <Download size={18} />
        </button>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white p-2"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
