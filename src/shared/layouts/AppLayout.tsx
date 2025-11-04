import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '@/features/auth/store';
import { useMarketHistory } from '@/features/market/hooks/useMarketHistory';
import { MarketStatusPill } from '@/features/market/components/MarketStatusPill';
import { Currency } from '@/shared/components/Currency';
import { LogOut, Coins } from 'lucide-react';

export function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: marketData } = useMarketHistory('30M');
  
  // Get latest market trend
  const latestTrend = marketData && marketData.history.length > 0 
    ? marketData.history[marketData.history.length - 1]?.market_trend 
    : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
                <Coins className="h-8 w-8" />
                Coins
              </Link>

              <nav className="flex gap-6">
                <Link to="/" className="text-foreground hover:text-primary">Dashboard</Link>
                <Link to="/coins" className="text-foreground hover:text-primary">Coins</Link>
                <Link to="/portfolio" className="text-foreground hover:text-primary">Portfolio</Link>
                <Link to="/transactions" className="text-foreground hover:text-primary">Transactions</Link>
                <Link to="/profile" className="text-foreground hover:text-primary">Profile</Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {latestTrend && (
                <MarketStatusPill trend={latestTrend} />
              )}

              {user && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                  <span className="text-sm font-medium">{user.username}</span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <Currency value={user.funds} className="text-sm font-bold" />
                </div>
              )}

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

