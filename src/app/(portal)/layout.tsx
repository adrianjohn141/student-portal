import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '../actions'
import Link from 'next/link'
import {
  BookOpen,
  CalendarDays,
  Settings,
  UserCircle,
  LogOut,
} from 'lucide-react'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  // --- 1. FETCH THE PROFILE DATA (NEW CODE) ---
  // We fetch the profile table to get the full_name
  const { data: profile } = await supabase
    .from('profile')
    .select('full_name')
    .eq('id', user.id)
    .single()
  // --- END OF NEW CODE ---

  // --- 2. DETERMINE DISPLAY NAME & AVATAR (NEW CODE) ---
  const displayName =
    profile?.full_name && profile.full_name.trim() !== ''
      ? profile.full_name
      : user.email
  
  const avatarInitial = (profile?.full_name?.[0] || user.email?.[0])?.toUpperCase()
  // --- END OF NEW CODE ---

  return (
    <div className="flex w-full min-h-screen">
      {/* --- SIDEBAR --- */}
      <aside className="w-48 flex flex-col p-4 border-r border-zinc-800 bg-zinc-900/50">
        <div className="flex-1 flex flex-col gap-2">
          <span className="font-semibold text-lg mb-4">BSCS-A Portal</span>

          {/* Main Navigation */}
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300"
            >
              <BookOpen size={18} />
              <span>My Courses</span>
            </Link>
            <Link
              href="/schedule"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300"
            >
              <CalendarDays size={20} />
              <span>Schedule</span>
            </Link>
          </nav>
        </div>

        {/* User Profile & Settings Navigation */}
        <div className="flex flex-col gap-2">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300"
          >
            <UserCircle size={18} />
            <span>Profile</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>

          <div className="border-t border-zinc-700 my-2"></div>

          {/* Logout Button */}
          <form action={logout} className="w-full">
            <button className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-red-400 hover:bg-red-900/50">
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </form>

          {/* --- 3. UPDATED USER DISPLAY (NEW CODE) --- */}
          {/* We now use the new variables here */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              {avatarInitial}
            </div>
            <span className="text-sm text-zinc-400 truncate">
              {displayName}
            </span>
          </div>
          {/* --- END OF NEW CODE --- */}
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-4 bg-zinc-900/80">
        {children}
      </main>
    </div>
  )
}