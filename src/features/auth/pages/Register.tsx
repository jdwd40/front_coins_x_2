import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';

export default function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8 border rounded-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Coins</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

