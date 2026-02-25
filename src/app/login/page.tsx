'use client'

import { login } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginMessage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return message ? (
    <div className="rounded-md border border-zinc-600 bg-zinc-900/50 px-4 py-3 text-center text-sm text-white">
      {message}
    </div>
  ) : null
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col justify-center space-y-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg p-8 shadow-2xl">
        <Suspense fallback={null}>
          <LoginMessage />
        </Suspense>
        <div className="flex flex-col items-center space-y-2 text-center">
          <Image src="/globe.svg" alt="Globe Icon" width={48} height={48} />
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Student Portal
          </h1>
          <p className="text-sm text-zinc-300">
            Enter your credentials to sign in or create an account
          </p>
        </div>
        <LoginForm />
        <p className="px-8 text-center text-sm text-zinc-300">
          By signing up, you agree that you are a student with a valid psu.edu.ph email.
        </p>
      </div>
    </div>
  )
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          hd: 'psu.edu.ph',
        },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <form className="grid gap-4">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-black font-semibold py-2 px-4 rounded-md transition-colors"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.799 L -6.734 42.379 C -8.804 40.449 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
          </g>
        </svg>
        Sign in with Google
      </button>
      <div className="relative flex items-center w-full my-4">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink-0 mx-4 text-sm text-zinc-400">Or continue with</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-white" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-black/20 border border-white/10 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:bg-black/30"
          id="email"
          name="email"
          placeholder="you@example.edu"
          required
          type="email"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-white" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            className="w-full rounded-md px-4 py-2 bg-black/20 border border-white/10 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:bg-black/30"
            id="password"
            name="password"
            placeholder="••••••••"
            required
            type={showPassword ? 'text' : 'password'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <button
        formAction={login}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
      >
        Log In
      </button>
      <Link
        href="/signup"
        className="w-full text-center border border-zinc-600 hover:bg-zinc-800 text-white font-semibold py-1 px-4 rounded-md text-sm"
      >
        Sign Up
      </Link>
    </form>
  )
}
