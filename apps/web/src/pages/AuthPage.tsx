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
    <section className="mx-auto w-full max-w-md py-2 md:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="mb-0">{isLogin ? 'Sign in' : 'Create an account'}</h1>
        <p className="mb-0 text-dim">
          {isLogin
            ? 'Shop from local producers and bid in live auctions.'
            : 'Join as a buyer to shop from local farms, or as a producer to sell your produce.'}
        </p>
      </div>

      <div className="rule mt-6 pt-6">
        {isLogin ? <LoginForm /> : <RegisterForm />}
      </div>

      <p className="mt-4 mb-0 text-sm text-dim">
        {isLogin ? (
          <>
            New to Farm to Table?{' '}
            <Link
              to="/register"
              className="font-semibold"
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
              className="font-semibold"
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
