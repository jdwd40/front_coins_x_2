import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../store';
import { authApi } from '../api';
import type { LoginInput, RegisterInput } from '../schemas';

export function useAuth() {
  const navigate = useNavigate();
  const { setAuth, logout, checkTokenExpiry } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: (result) => {
      if (result.success) {
        setAuth(result.data.user, result.data.token);
        toast.success(`Welcome back, ${result.data.user.username}!`);
        navigate('/');
      } else {
        toast.error(result.error.message);
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Account created! Please log in.');
        navigate('/login');
      } else {
        toast.error(result.error.message);
      }
    },
  });

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: () => {
      logout();
      toast.success('Logged out');
      navigate('/login');
    },
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    checkTokenExpiry,
  };
}

