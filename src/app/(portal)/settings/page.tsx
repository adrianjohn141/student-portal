// No need for Supabase client yet, but good practice to make it async
export default async function SettingsPage() {

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg max-w-lg mx-auto">
         <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
         <p className="text-sm text-zinc-400">
           Settings options will go here (e.g., change password, manage notifications).
         </p>
         {/* Placeholder for future settings form */}
      </div>
    </div>
  )
}