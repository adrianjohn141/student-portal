import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { message?: string }
}) {
  // Read the message string from searchParams
  const resolvedParams = await Promise.resolve(searchParams)
  const message = resolvedParams?.message

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">BSCS-A Portal</h1>
        <p className="text-sm text-zinc-400">
          Sign in or create an account to continue
        </p>
      </div>

      {/* Pass *only* the message string down */}
      <LoginForm message={message} />

      <p className="px-8 text-center text-sm text-zinc-400">
        By signing up, you agree that you are a student with a valid .edu email.
      </p>
    </div>
  )
}

function LoginForm({
  message,
}: {
  message?: string
}) {
  return (
    <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
      <label className="text-md" htmlFor="email">
        Email
      </label>
      <input
        className="rounded-md px-4 py-2 bg-inherit border mb-2"
        name="email"
        placeholder="you@example.edu"
        required
      />
      <label className="text-md" htmlFor="password">
        Password
      </label>
      <input
        className="rounded-md px-4 py-2 bg-inherit border mb-4"
        type="password"
        name="password"
        placeholder="••••••••"
        required
      />

      {/* Display Server-Side Error Messages */}
      {message && (
        <p className="mb-4 p-3 bg-red-900 text-red-100 text-center text-sm">
          {message}
        </p>
      )}

      <button
        formAction={login}
        className="bg-blue-600 hover:bg-blue-700 rounded-md px-4 py-2 text-white mb-2"
      >
        Sign In
      </button>
      <button
        formAction={signup}
        className="border border-foreground/20 rounded-md px-4 py-2 text-white hover:bg-zinc-800"
      >
        Sign Up
      </button>
    </form>
  )
}