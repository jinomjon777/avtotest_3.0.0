import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[hsl(222_47%_8%)] via-[hsl(222_35%_12%)] to-[hsl(222_47%_8%)]">
      <div className="text-center px-4">
        <h1 className="mb-2 text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-montserrat">404</h1>
        <p className="mb-8 text-xl text-white/50">Sahifa topilmadi</p>
        <a href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold px-6 py-3 rounded-xl hover:from-amber-600 hover:to-yellow-500 transition-all shadow-lg shadow-amber-500/20">
          <Home className="w-5 h-5" />
          Bosh sahifaga qaytish
        </a>
      </div>
    </div>
  );
};

export default NotFound;
