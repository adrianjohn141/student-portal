'use client'

import Image from 'next/image'
import Link from 'next/link'
import { signup } from './actions'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Eye, EyeOff } from 'lucide-react'

function SignupMessage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return message ? (
    <div className="rounded-md border border-zinc-600 bg-zinc-900/50 px-4 py-3 text-center text-sm text-white">
      {message}
    </div>
  ) : null
}

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col justify-center space-y-6 rounded-lg bg-black/30 p-8 shadow-lg">
        <Suspense fallback={null}>
          <SignupMessage />
        </Suspense>
        <div className="flex flex-col items-center space-y-2 text-center">
          <Image src="/globe.svg" alt="Globe Icon" width={48} height={48} />
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Create an Account
          </h1>
          <p className="text-sm text-zinc-300">
            Enter your details to create a new account
          </p>
        </div>
        <SignupForm />
        <p className="px-8 text-center text-sm text-zinc-300">
          Already have an account?{' '}
          <Link href="/login" className="underline hover:text-white">
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}

function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <form className="grid gap-4" action={signup}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-white" htmlFor="full_name">
          Full Name
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-zinc-600 text-white placeholder-zinc-400"
          id="full_name"
          name="full_name"
          placeholder="Your Full Name"
          required
          type="text"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-white" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-zinc-600 text-white placeholder-zinc-400"
          id="email"
          name="email"
          placeholder="25ln0000_ms@psu.edu.ph"
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
            className="w-full rounded-md px-4 py-2 bg-inherit border border-zinc-600 text-white placeholder-zinc-400"
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
      <div className="grid gap-2">
        <label className="text-sm font-medium text-white" htmlFor="confirm_password">
          Confirm Password
        </label>
        <div className="relative">
          <input
            className="w-full rounded-md px-4 py-2 bg-inherit border border-zinc-600 text-white placeholder-zinc-400"
            id="confirm_password"
            name="confirm_password"
            placeholder="••••••••"
            required
            type={showConfirmPassword ? 'text' : 'password'}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-white"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
      >
        Sign Up
      </button>
    </form>
  )
}
