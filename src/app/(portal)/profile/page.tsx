import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateProfile } from './actions'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: { message?: string }
}) {
  const supabase = await createClient()

  // Resolve the searchParams promise
  const resolvedParams = await Promise.resolve(searchParams)
  const message = resolvedParams?.message

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Fetch the profile data
  const { data: profile, error } = await supabase
    .from('profile')
    .select('full_name')
    .eq('id', user.id)
    .single() 

  if (error && error.code !== 'PGRST116') {
    // PGRST116 means no row was found, which is fine
    console.error('Error fetching profile:', error)
  }

  return (
    // We remove gap-8 from here
    <div className="flex flex-col">
      {/* Add mb-8 (margin-bottom) here */}
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {/* --- FIX: Added mx-auto to center this div --- */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg max-w-lg mx-auto">
        <h2 className="text-xl font-semibold mb-4">Update Your Information</h2>
        <p className="text-sm text-zinc-400 mb-6">
          This is your personal information. It will be displayed to
          instructors and administration.
        </p>

        <form action={updateProfile} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm text-zinc-400 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-500"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Email cannot be changed.
            </p>
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm text-zinc-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name || ''}
              className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
  
              placeholder="Your Full Name"
            />
          </div>

          <div className="flex justify-end items-center gap-4">
            {/* Display Success/Error Messages */}
            {message && (
              <p className="text-sm text-zinc-400">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}