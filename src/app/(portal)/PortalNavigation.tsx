'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  Settings,
  UserCircle,
  LogOut,
  Menu,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { logout } from '../actions'

type Profile = {
  full_name: string | null
}

export default function PortalNavigation({
  user,
  profile,
}: {
  user: User
  profile: Profile | null
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  const displayName =
    profile?.full_name && profile.full_name.trim() !== ''
      ? profile.full_name
      : user.email
  const avatarInitial = (
    profile?.full_name?.[0] || user.email?.[0]
  )?.toUpperCase()

  return (
    <>
      {/* --- SIDEBAR --- */}
      <aside
        className={`w-48 flex flex-col p-4 border-r border-white/20 bg-white/10 backdrop-blur-lg
                   transform transition-transform duration-300 ease-in-out 
                   fixed md:relative h-full z-10 overflow-y-auto
                   ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                   md:translate-x-0`}
      >
        <div className="flex-1 flex flex-col gap-2">
          <span className="font-semibold text-lg mb-4">BSCS-A Portal</span>

          {/* Main Navigation */}
          <nav className="flex flex-col gap-2">
            <Link
              href="/home"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <BookOpen size={18} />
              <span>Home</span>
            </Link>
            <Link
              href="/courses"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <BookOpen size={18} />
              <span>My Courses</span>
            </Link>
            <Link
              href="/schedule"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <CalendarDays size={20} />
              <span>Schedule</span>
            </Link>
          </nav>
        </div>

        {/* User profile & Settings Navigation */}
        <div className="flex flex-col gap-2">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <UserCircle size={18} />
            <span>profile</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>

          <div className="border-t border-zinc-200 dark:border-zinc-700 my-2"></div>

          {/* Logout Button */}
          <form action={logout} className="w-full">
            <button className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-red-400 hover:bg-red-900/50">
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </form>

          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
              {avatarInitial}
            </div>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
              {displayName}
            </span>
          </div>
        </div>
      </aside>

      {/* --- HEADER (for mobile) --- */}
      <header className="flex items-center justify-between p-4 border-b border-white/20 bg-white/10 backdrop-blur-lg md:hidden">
        <button onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="font-semibold text-lg">BSCS-A Portal</span>
      </header>

      {/* --- OVERLAY (for mobile) --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-5 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </>
  )
}
