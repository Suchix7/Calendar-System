import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ghost } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home after 3 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
        <Ghost className="text-stone-400 w-10 h-10" />
      </div>
      <h1 className="text-3xl font-serif text-stone-900 mb-2">
        Page Not Found
      </h1>
      <p className="text-stone-500 italic mb-8">
        The light doesn't shine here. Redirecting you home...
      </p>
      <div className="w-12 h-1 bg-stone-200 rounded-full overflow-hidden">
        <div className="w-full h-full bg-stone-800 animate-[loading_3s_linear]" />
      </div>
    </div>
  );
};

export default NotFound;
