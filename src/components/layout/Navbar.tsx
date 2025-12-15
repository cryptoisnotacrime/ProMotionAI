import { Sparkles, LayoutDashboard, Package, Video, CreditCard, Settings, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  creditsRemaining: number;
  creditsTotal?: number;
}

export function Navbar({ currentView, onNavigate, creditsRemaining, creditsTotal = 100 }: NavbarProps) {
  const videosRemaining = Math.floor(creditsRemaining / 4);
  const isLowCredits = videosRemaining <= 3 && videosRemaining > 0;
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'library', label: 'Video Library', icon: Video },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <nav className="bg-gray-950 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-100">ProMotionAI</span>
            </div>

            <div className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/10'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('billing')}
              className={`min-h-[44px] rounded-lg px-4 py-2 flex items-center gap-2 transition-all hover:shadow-md ${
                isLowCredits
                  ? 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-2 border-orange-500/50 animate-pulse'
                  : 'bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 hover:border-blue-500/50'
              }`}
            >
              {isLowCredits ? (
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              ) : (
                <CreditCard className="w-4 h-4 text-blue-400" />
              )}
              <div className="flex flex-col items-start">
                <span className={`text-sm font-bold ${
                  isLowCredits ? 'text-orange-300' : 'text-blue-300'
                }`}>
                  {creditsRemaining} credits
                </span>
                {isLowCredits && (
                  <span className="text-xs text-orange-400 font-medium">
                    {videosRemaining} video{videosRemaining !== 1 ? 's' : ''} left
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className={`min-h-[44px] min-w-[44px] p-2 rounded-lg transition-colors ${
                currentView === 'settings'
                  ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/10'
                  : 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-gray-800">
        <div className="flex overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`min-h-[44px] flex-1 flex flex-col items-center gap-1 py-3 min-w-[80px] ${
                currentView === item.id ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => onNavigate('billing')}
            className="min-h-[44px] flex flex-col items-center justify-center gap-1 py-3 px-4 border-l border-gray-800 bg-blue-600/20 min-w-[100px]"
          >
            <div className="flex items-center gap-1">
              {isLowCredits && <AlertTriangle className="w-4 h-4 text-orange-400" />}
              <CreditCard className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs font-bold text-blue-300">{creditsRemaining}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
