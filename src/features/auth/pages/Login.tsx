import { Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8 border rounded-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Coins</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

