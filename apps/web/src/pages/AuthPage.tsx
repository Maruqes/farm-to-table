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
    <section className="auth-column py-2 py-md-5">
      <div className="vstack gap-2">
        <h1 className="mb-0">{isLogin ? 'Sign in' : 'Create an account'}</h1>
        <p className="text-body-secondary mb-0">
          {isLogin
            ? 'Shop from local producers and bid in live auctions.'
            : 'Join as a buyer to shop from local farms, or as a producer to sell your produce.'}
        </p>
      </div>

      <div className="rule mt-4 pt-4">
        {isLogin ? <LoginForm /> : <RegisterForm />}
      </div>

      <p className="mt-3 small text-body-secondary mb-0">
        {isLogin ? (
          <>
            New to Farm to Table?{' '}
            <Link
              to="/register"
              className="fw-semibold"
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
              className="fw-semibold"
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
