import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  LayoutGrid,
  Car
} from "lucide-react";
import { loginAction } from '@/store/ducks/auth.duck';
import { RootState } from '@/store/rootReducer';
import { forgotPasswordApi } from "@/services/auth/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState(() => {
    return localStorage.getItem("rememberUser") || "";
  });
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => {
    return localStorage.getItem("remember") === "true";
  });

  useEffect(() => {
    if (remember) {
      localStorage.setItem("remember", "true");
      localStorage.setItem("rememberUser", email);
    } else {
      localStorage.removeItem("remember");
      localStorage.removeItem("rememberUser");
    }
  }, [remember, email]);

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

  const handleForgot = async () => {
    if (!email) {
      toast.error("Please enter your registered email address");
      return;
    }
    try {
      const res = await forgotPasswordApi(email);
      toast.success(res.message || "Password sent to your email!");
      setShowForgot(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send reset email");
    }
  };

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] overflow-hidden font-sans">
      {/* Left Panel - Branding Image */}
      <div className="relative hidden md:flex flex-col w-1/2 bg-[#020617] overflow-hidden pt-0">
        <img
  src="/Login page 2.png"
  className="w-full h-auto mt-0 object-cover"
  alt="Branding and features illustration"
/>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-6 overflow-y-auto">
        <div className="w-full max-w-[420px] bg-white p-6 lg:p-8 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-gray-100/50 flex flex-col items-center my-auto">

          {/* Form Header */}
          <div className="mb-6 flex items-center justify-center">
            <img src="/logo.png" className="w-14 h-14 object-contain" alt="Logo" />
          </div>

          <div className="text-center space-y-1 mb-6 w-full">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {showForgot ? "Forgot Password" : "Welcome Back!"}
            </h3>
            <p className="text-slate-500 font-medium text-sm">
              {showForgot ? "We'll send you recovery instructions" : "Sign in to continue to your account"}
            </p>
          </div>

          {showForgot ? (
            <div className="w-full space-y-4">
              <div className="space-y-1">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleForgot}
                className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] text-sm"
              >
                Send Password
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowForgot(false)}
                className="w-full text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors py-1"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-600 transition-all text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[13px] font-bold text-slate-700">Password</label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-600 transition-all text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pr-1 -mt-1">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98] disabled:opacity-70 text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Login
                  </>
                )}
              </button>

              {/* Divider */}
              {/* <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-gray-400 font-bold text-[10px] uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div> */}

              {/* Social Logins */}
              {/* <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-bold text-slate-700 text-xs shadow-sm"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.3 21.35 7.39 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62h-3.98C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.3 2.65 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
                  </svg>
                  Google
                </button>
                <button 
                  type="button"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-bold text-slate-700 text-xs shadow-sm"
                >
                  <div className="grid grid-cols-2 gap-0.5 w-4 h-4 flex-shrink-0">
                    <div className="bg-[#f35325]" />
                    <div className="bg-[#81bc06]" />
                    <div className="bg-[#05a6f0]" />
                    <div className="bg-[#ffba08]" />
                  </div>
                  Microsoft
                </button>
              </div> */}

              {/* Registration Link */}
              {/* <p className="text-center text-slate-500 font-bold text-xs pt-1">
                Don't have an account? <span className="text-blue-600 hover:underline cursor-pointer">Register</span>
              </p> */}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


