'use client'

import { login } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Eye, EyeOff } from 'lucide-react'

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
            BSCS-A Portal
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

  return (
    <form className="grid gap-4">
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
