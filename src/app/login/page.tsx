import { login, signup } from './actions'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col justify-center space-y-6 rounded-lg bg-black/30 p-8 shadow-lg">
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
  return (
    <form className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-white" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-zinc-600 text-white placeholder-zinc-400"
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
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-zinc-600 text-white placeholder-zinc-400"
          id="password"
          name="password"
          placeholder="••••••••"
          required
          type="password"
        />
      </div>
      <button
        formAction={login}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
      >
        Sign In
      </button>
      <button
        formAction={signup}
        className="w-full border border-zinc-600 hover:bg-zinc-800 text-white font-semibold py-2 px-4 rounded-md"
      >
        Sign Up
      </button>
    </form>
  )
}
