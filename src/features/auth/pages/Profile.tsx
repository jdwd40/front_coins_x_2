import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '../store';
import { Currency } from '@/shared/components/Currency';
import { formatDate } from '@/shared/utils/formatters';
import { LogOut, User, Mail, Calendar, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="border rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <p className="text-muted-foreground">User ID: {user.user_id}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Available Funds</p>
              <p className="font-medium text-lg">
                <Currency value={user.funds} />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">{formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t">
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

