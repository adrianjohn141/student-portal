import { changePassword } from './actions'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { message?: string }
}) {
  // Resolve the searchParams promise
  const resolvedParams = await Promise.resolve(searchParams)
  const message = resolvedParams?.message

  const isError = message?.startsWith('Error');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg max-w-lg mx-auto">
         <h2 className="text-xl font-semibold mb-4">Change Password</h2>
         <p className="text-sm text-zinc-400 mb-6">
           Enter your current password and a new password. The new password must be at least 6 characters long.
         </p>

         <form action={changePassword} className="flex flex-col gap-4">
            <div>
              <label htmlFor="current_password" className="block text-sm text-zinc-400 mb-2">
                Current Password
              </label>
              <input
                type="password"
                id="current_password"
                name="current_password"
                required
                className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="new_password" className="block text-sm text-zinc-400 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                required
                minLength={6}
                className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-end items-center gap-4">
              {/* Display Success/Error Messages */}
              {message && (
                <p className={`text-sm ${isError ? 'text-red-400' : 'text-green-400'}`}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
              >
                Update Password
              </button>
            </div>
         </form>
      </div>
    </div>
  )
}