import { Link, Navigate } from 'react-router-dom'
import { useSession } from '@/context/session'
import { LoginForm } from '@/features/auth/auth-login-register/LoginForm'
import { postAuthPath } from '@/features/auth/auth-login-register/redirect'
import { RegisterForm } from '@/features/auth/auth-login-register/RegisterForm'

interface AuthPageProps {
  mode: 'login' | 'register'
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { user } = useSession()
  const isLogin = mode === 'login'

  if (user) {
    return <Navigate to={postAuthPath(user)} replace />
  }

  return (
    <section className="mx-auto w-full max-w-md py-2 md:py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{isLogin ? 'Sign in' : 'Create an account'}</h1>
        <p className="text-muted-foreground">
          {isLogin
            ? 'Shop from local producers and bid in live auctions.'
            : 'Join as a buyer to shop from local farms, or as a producer to sell your produce.'}
        </p>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-5 sm:p-6">
        {isLogin ? <LoginForm /> : <RegisterForm />}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {isLogin ? (
          <>
            New to Farm to Table?{' '}
            <Link
              to="/register"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Create an account
            </Link>
            .
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Sign in
            </Link>
            .
          </>
        )}
      </p>
    </section>
  )
}
