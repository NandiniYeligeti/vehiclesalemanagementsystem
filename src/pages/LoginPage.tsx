import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Monitor } from "lucide-react";
import { loginAction } from '@/store/ducks/auth.duck';
import { RootState } from '@/store/rootReducer';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [theme, setTheme] = useState("dark");
  const [showForgot, setShowForgot] = useState(false);
  const [customColor, setCustomColor] = useState("#111827");

  const [email, setEmail] = useState(() => {
    return localStorage.getItem("rememberUser") || "";
  });
  const [password, setPassword] = useState("");

  // Remember Me state
  const [remember, setRemember] = useState(() => {
    return localStorage.getItem("remember") === "true";
  });

  const colorRef = useRef<HTMLInputElement>(null);

  const images = [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    if (remember) {
      localStorage.setItem("remember", "true");
      localStorage.setItem("rememberUser", email);
    } else {
      localStorage.removeItem("remember");
      localStorage.removeItem("rememberUser");
    }
  }, [remember, email]);

  const themes: Record<string, string> = {
    dark: "bg-gradient-to-br from-gray-950 to-gray-900",
    blue: "bg-gradient-to-br from-blue-900 to-indigo-950",
    purple: "bg-gradient-to-br from-purple-900 to-violet-950"
  };

  const cycleTheme = () => {
    if (theme === "dark") setTheme("blue");
    else if (theme === "blue") setTheme("purple");
    else setTheme("dark");
  };

  const openColorPicker = (e: React.MouseEvent) => {
    e.preventDefault();
    colorRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(loginAction({ email, password }, (user: any) => {
      if (user.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate('/');
      }
    }));
  };

  const bgStyle = theme === "custom" ? { backgroundColor: customColor } : {};

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        theme !== "custom" ? themes[theme] : ""
      } p-6 gap-4 transition-colors duration-500`}
      style={bgStyle}
    >
      <div className="w-full max-w-4xl bg-[#1e1e1e] shadow-2xl rounded-2xl grid md:grid-cols-2 overflow-hidden text-white relative ring-1 ring-white/10">
        {/* Left Image Slider */}
        <div className="hidden md:block relative h-full bg-black min-h-[500px]">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                i === slideIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}

          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          <div className="absolute bottom-6 w-full flex justify-center gap-2">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === slideIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="p-8 sm:p-10 space-y-6 flex flex-col justify-center bg-[#18181b]">
          {/* Company Logo */}
          <div className="flex justify-center -mb-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
              alt="Company Logo"
              className="h-14 object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>

          <h1 className="text-[26px] tracking-tight font-semibold text-center text-white">
            {showForgot ? "Forgot Password" : "SmartERP Login"}
          </h1>

          {showForgot ? (
            <div className="space-y-4 pt-2">
              <input
                placeholder="Enter Registered Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#27272a] border border-[#3f3f46] outline-none focus:border-blue-500 focus:bg-[#27272a] transition-colors text-white placeholder:text-gray-400"
              />

              <button className="w-full bg-[#2563eb] font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors text-white shadow-lg shadow-blue-500/10 active:scale-[0.98]">
                Send Reset Link
              </button>

              <button
                onClick={() => setShowForgot(false)}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors hover:underline w-full"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 pt-2">
              <div>
                <input
                  placeholder="User ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3.5 rounded-lg bg-[#27272a] border border-[#3f3f46] outline-none focus:border-[#3b82f6] focus:bg-[#323236] transition-all text-white placeholder:text-gray-400"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 rounded-lg bg-[#27272a] border border-[#3f3f46] outline-none focus:border-[#3b82f6] focus:bg-[#323236] transition-all text-white placeholder:text-gray-400 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-sm py-1">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-600 focus:ring-offset-[#18181b] bg-gray-700"
                  />
                  <span className="text-gray-200 group-hover:text-white transition-colors font-medium">Remember Me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-blue-400 hover:text-blue-300 transition-colors hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                 type="submit"
                 disabled={loading || !email || !password}
                 className="w-full bg-[#1d4ed8] font-semibold py-3.5 flex justify-center items-center rounded-lg hover:bg-blue-600 transition-colors text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-[15px] tracking-wide"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Login'
                )}
              </button>
            </form>
          )}

          {/* Premium Company Branding */}
          <div className="text-center text-xs text-gray-400 space-y-1.5 pt-8 mt-2">
            <div className="w-full h-px bg-white/10 mb-6"></div>
            <p className="font-bold text-gray-200 text-sm tracking-wide">Rupesh Infotech Pvt. Ltd.</p>
            <p className="text-gray-400 text-xs">SmartERP Business Suite</p>
            <p className="pt-2 text-gray-400/80 flex items-center justify-center gap-1.5">
               <span className="text-red-400 text-sm">📍</span> Mumbai, Maharashtra, India
            </p>
            <p className="text-gray-400/80 flex items-center justify-center gap-2 pb-1">
               <span className="flex items-center gap-1.5"><span className="text-blue-300">✉️</span> support@rupeshinfotech.com</span>
               <span className="text-gray-600">|</span>
               <span className="flex items-center gap-1.5"><span className="text-emerald-400">📞</span> +91 98765 43210</span>
            </p>
            <p className="pt-2 text-[10.5px] text-gray-500/80 tracking-widest uppercase">© 2026 All Rights Reserved</p>
          </div>
        </div>
      </div>

      {/* Visual Theme Selector */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Select Background Theme</p>
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl p-2.5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <button 
             onClick={() => setTheme('dark')} 
             className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 duration-300 ${theme === 'dark' ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-transparent'}`} 
             style={{ background: 'linear-gradient(to bottom right, #030712, #111827)' }} 
             title="Dark Slate"
          />
          <button 
             onClick={() => setTheme('blue')} 
             className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 duration-300 ${theme === 'blue' ? 'border-white scale-110 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'border-transparent'}`} 
             style={{ background: 'linear-gradient(to bottom right, #1e3a8a, #312e81)' }} 
             title="Midnight Blue"
          />
          <button 
             onClick={() => setTheme('purple')} 
             className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 duration-300 ${theme === 'purple' ? 'border-white scale-110 shadow-[0_0_15px_rgba(147,51,234,0.6)]' : 'border-transparent'}`} 
             style={{ background: 'linear-gradient(to bottom right, #581c87, #2e1065)' }} 
             title="Deep Purple"
          />
          <div className="w-px h-5 bg-white/20 mx-1"></div>
          
          <label className={`relative cursor-pointer w-7 h-7 rounded-full border-2 transition-all hover:scale-110 duration-300 overflow-hidden shadow-inner flex items-center justify-center bg-[conic-gradient(red,yellow,lime,aqua,blue,fuchsia,red)] ${theme === 'custom' ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,100,200,0.5)]' : 'border-transparent'}`} title="Pick Custom Color">
             <input
               type="color"
               value={customColor}
               onChange={(e) => {
                 setCustomColor(e.target.value);
                 setTheme("custom");
               }}
               className="absolute opacity-0 w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
             />
          </label>
        </div>
      </div>
    </div>
  );
}
