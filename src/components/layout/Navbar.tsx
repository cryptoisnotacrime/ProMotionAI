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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ProMotionAI</span>
            </div>

            <div className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
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
              className={`rounded-lg px-4 py-2 flex items-center gap-2 transition-all hover:shadow-md ${
                isLowCredits
                  ? 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 animate-pulse'
                  : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              {isLowCredits ? (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              ) : (
                <CreditCard className="w-4 h-4 text-blue-600" />
              )}
              <div className="flex flex-col items-start">
                <span className={`text-sm font-bold ${
                  isLowCredits ? 'text-orange-900' : 'text-blue-900'
                }`}>
                  {creditsRemaining} credits
                </span>
                {isLowCredits && (
                  <span className="text-xs text-orange-700 font-medium">
                    {videosRemaining} video{videosRemaining !== 1 ? 's' : ''} left
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className={`p-2 rounded-lg transition-colors ${
                currentView === 'settings'
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-gray-200">
        <div className="flex overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 min-w-[80px] ${
                currentView === item.id ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => onNavigate('billing')}
            className="flex flex-col items-center justify-center gap-1 py-3 px-4 border-l border-gray-200 bg-blue-50 min-w-[100px]"
          >
            <div className="flex items-center gap-1">
              {isLowCredits && <AlertTriangle className="w-4 h-4 text-orange-600" />}
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-900">{creditsRemaining}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
