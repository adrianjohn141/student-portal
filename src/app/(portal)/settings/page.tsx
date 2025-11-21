import { SettingsList } from './SettingsList'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { message?: string }
}) {
  // Resolve the searchParams promise
  const resolvedParams = await Promise.resolve(searchParams)
  const message = resolvedParams?.message

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <SettingsList message={message} />
    </div>
  )
}
