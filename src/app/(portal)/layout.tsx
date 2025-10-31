import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageTransition from '@/components/PageTransition'
import PortalNavigation from './PortalNavigation'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="md:flex w-full h-screen relative">
      <PortalNavigation user={user} profile={profile} />

      <div className="flex-1 flex flex-col bg-black/20 overflow-y-auto">
        <main className="flex-1 p-4">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}
