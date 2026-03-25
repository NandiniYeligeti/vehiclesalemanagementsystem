import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Building2 } from 'lucide-react';
import { loginAction } from '@/store/ducks/auth.duck';
import { RootState } from '@/store/rootReducer';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [themeColor, setThemeColor] = useState('#070B19');

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

  return (
    <div 
       className="min-h-screen flex flex-col items-center justify-center relative font-sans transition-colors duration-500"
       style={{ backgroundColor: themeColor }}
    >
      <div className="w-full max-w-[380px] p-8 sm:p-9 bg-white rounded-2xl shadow-xl relative z-10 mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-600">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-[22px] font-semibold text-slate-800">SmartERP Login</h1>
          
          <div className="mt-1 flex justify-center">
             <input 
                type="file" 
                className="block text-center text-[11px] text-slate-400 file:mr-1 file:py-0 file:px-0 file:border-0 file:text-[11px] file:bg-transparent file:text-slate-400 w-[140px]" 
             />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* User ID */}
            <div>
              <label className="text-[13px] font-bold text-slate-800 mb-1.5 block">
                User ID
              </label>
              <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-white">
                <div className="pl-3 flex items-center justify-center text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter User ID"
                  required
                  className="w-full h-[42px] pl-2 pr-3 text-[13px] text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[13px] font-bold text-slate-800 mb-1.5 block">
                Password
              </label>
              <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-white">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  required
                  className="w-full h-[42px] pl-3 pr-10 text-[13px] text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                >
                  {showPassword ? (
                     <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                     <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between mt-4 mb-6">
            <label className="flex items-center cursor-pointer gap-2">
              <input type="checkbox" className="w-[14px] h-[14px] rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              <span className="text-[13px] font-bold text-slate-800">Remember Me</span>
            </label>
            <a href="#" className="text-[13px] text-blue-500 hover:text-blue-600">
              Forgot Password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-[42px] bg-[#121A2F] hover:bg-[#0A0F1D] text-white rounded-[6px] font-semibold text-[14px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-[11px] text-slate-400 font-medium">
          Version 1.0 • SmartERP
        </div>
      </div>

      {/* Theme Toggles */}
      <div className="mt-8 flex items-center justify-center gap-2">
        <button 
           type="button"
           onClick={() => setThemeColor('#070B19')}
           className="px-3 py-1.5 bg-white text-slate-800 text-[11px] font-bold rounded shadow-sm hover:bg-slate-50 transition-colors"
        >
          Dark
        </button>
        <button 
           type="button"
           onClick={() => setThemeColor('#1E3A8A')}
           className="px-3 py-1.5 bg-white text-slate-800 text-[11px] font-bold rounded shadow-sm hover:bg-slate-50 transition-colors"
        >
          Blue
        </button>
        <button 
           type="button"
           onClick={() => setThemeColor('#4C1D95')}
           className="px-3 py-1.5 bg-white text-slate-800 text-[11px] font-bold rounded shadow-sm hover:bg-slate-50 transition-colors"
        >
          Purple
        </button>
        <label className="px-3 py-1.5 bg-white text-slate-800 text-[11px] font-bold rounded shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer m-0">
          Custom
          <div 
             className="w-3 h-3 rounded-sm border border-slate-200 overflow-hidden relative shadow-inner"
             style={{ backgroundColor: themeColor }}
          >
             <input 
                type="color" 
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="absolute opacity-0 w-8 h-8 -top-2 -left-2 cursor-pointer"
             />
          </div>
        </label>
      </div>
    </div>
  );
};

export default LoginPage;

