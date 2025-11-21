'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  User, 
  Lock, 
  Bell, 
  Moon, 
  HelpCircle, 
  FileText, 
  Shield, 
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { changePassword } from './actions'

interface SettingsListProps {
  message?: string
}

export function SettingsList({ message }: SettingsListProps) {
  const [isPasswordOpen, setIsPasswordOpen] = useState(!!message && (message.includes('Password') || message.includes('Error')))
  const isError = message?.startsWith('Error')

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      
      {/* ACCOUNT GROUP */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
          Account
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          
          {/* Profile Link */}
          <Link 
            href="/profile" 
            className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-md">
                <User size={20} />
              </div>
              <span className="font-medium text-zinc-200">Profile Information</span>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </Link>

          {/* Change Password - Expandable */}
          <div>
            <button
              onClick={() => setIsPasswordOpen(!isPasswordOpen)}
              className={`w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors ${isPasswordOpen ? 'bg-zinc-800/30' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-md">
                  <Lock size={20} />
                </div>
                <span className="font-medium text-zinc-200">Change Password</span>
              </div>
              {isPasswordOpen ? (
                <ChevronDown size={18} className="text-zinc-600" />
              ) : (
                <ChevronRight size={18} className="text-zinc-600" />
              )}
            </button>

            {/* Password Form */}
            {isPasswordOpen && (
              <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                 <form action={changePassword} className="flex flex-col gap-4">
                    <p className="text-sm text-zinc-400">
                      Enter your current password to set a new one.
                    </p>
                    <div>
                      <label htmlFor="current_password" className="block text-xs text-zinc-500 mb-1.5 uppercase font-semibold">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="current_password"
                        name="current_password"
                        required
                        className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label htmlFor="new_password" className="block text-xs text-zinc-500 mb-1.5 uppercase font-semibold">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="new_password"
                        name="new_password"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      {/* Display Success/Error Messages */}
                      <div className="flex-1 mr-4">
                        {message && (
                          <p className={`text-sm ${isError ? 'text-red-400' : 'text-green-400'}`}>
                            {message}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm font-medium transition-colors"
                      >
                        Update Password
                      </button>
                    </div>
                 </form>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* PREFERENCES GROUP */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
          Preferences
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          
          {/* Notifications */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 opacity-75 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-md">
                <Bell size={20} />
              </div>
              <span className="font-medium text-zinc-200">Notifications</span>
            </div>
            <div className="text-xs text-zinc-500 font-medium px-2 py-1 bg-zinc-800 rounded">Coming Soon</div>
          </div>

          {/* Appearance */}
          <div className="flex items-center justify-between p-4 opacity-75 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-md">
                <Moon size={20} />
              </div>
              <span className="font-medium text-zinc-200">Appearance</span>
            </div>
            <div className="text-xs text-zinc-500 font-medium px-2 py-1 bg-zinc-800 rounded">System</div>
          </div>

        </div>
      </section>

      {/* SUPPORT GROUP */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
          Support & About
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          
          <Link href="#" className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 text-green-500 rounded-md">
                <HelpCircle size={20} />
              </div>
              <span className="font-medium text-zinc-200">Help & Support</span>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </Link>

          <Link href="#" className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-500/10 text-zinc-400 rounded-md">
                <Shield size={20} />
              </div>
              <span className="font-medium text-zinc-200">Privacy Policy</span>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </Link>

          <Link href="#" className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-500/10 text-zinc-400 rounded-md">
                <FileText size={20} />
              </div>
              <span className="font-medium text-zinc-200">Terms of Service</span>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </Link>

        </div>
        <div className="mt-6 text-center">
           <p className="text-xs text-zinc-600">Version 0.1.0</p>
        </div>
      </section>

    </div>
  )
}
