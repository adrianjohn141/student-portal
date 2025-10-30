"use client"

import { createClient } from "@/lib/supabase/client"
import { logout } from "../actions"
import Link from "next/link"
import {
  BookOpen,
  CalendarDays,
  Settings,
  UserCircle,
  LogOut,
  Menu,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import PageTransition from "@/components/PageTransition"

// --- 1. DEFINE THE USER PROFILE TYPE (NEW) ---
type Profile = {
  full_name: string | null
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Sidebar state
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push("/login")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()

      setUser(user)
      setProfile(profileData)
    }

    fetchUser()
  }, [router])

  // --- 2. CLOSE SIDEBAR ON NAVIGATION (NEW) ---
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  if (!user) {
    return null // or a loading spinner
  }

  const displayName =
    profile?.full_name && profile.full_name.trim() !== ""
      ? profile.full_name
      : user.email
  const avatarInitial = (
    profile?.full_name?.[0] || user.email?.[0]
  )?.toUpperCase()

  return (
    <div className="flex w-full h-screen relative">
      {/* --- SIDEBAR --- */}
      <aside
        className={`w-48 flex flex-col p-4 border-r border-white/20 bg-white/10 backdrop-blur-lg
                   transform transition-transform duration-300 ease-in-out 
                   fixed md:relative h-full z-10 overflow-y-auto
                   ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
                   md:translate-x-0`}
      >
        <div className="flex-1 flex flex-col gap-2">
          <span className="font-semibold text-lg mb-4">BSCS-A Portal</span>

          {/* Main Navigation */}
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
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

          {/* --- 3. UPDATED USER DISPLAY (NEW CODE) --- */}
          {/* We now use the new variables here */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
              {avatarInitial}
            </div>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
              {displayName}
            </span>
          </div>
          {/* --- END OF NEW CODE --- */}
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col bg-black/20 overflow-y-auto">
        {/* --- HEADER (NEW) --- */}
        <header className="flex items-center justify-between p-4 border-b border-white/20 bg-white/10 backdrop-blur-lg md:hidden">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <span className="font-semibold text-lg">BSCS-A Portal</span>
        </header>

        <main className="flex-1 p-4">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* --- OVERLAY (NEW) --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-5 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}
