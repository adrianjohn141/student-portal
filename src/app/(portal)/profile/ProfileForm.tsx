'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateprofile, FormState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Updating...' : 'Update profile'}
    </button>
  )
}

export function ProfileForm({
  email,
  fullName,
}: {
  email: string
  fullName: string
}) {
  const initialState: FormState = { message: '', errors: {} }
  const [state, dispatch] = useFormState(updateprofile, initialState)

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">Update Your Information</h2>
      <p className="text-sm text-zinc-400 mb-6">
        This is your personal information. It will be displayed to instructors
        and administration.
      </p>

      <form action={dispatch} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-sm text-zinc-400 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            disabled
            className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-500"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Email cannot be changed.
          </p>
        </div>

        <div>
          <label
            htmlFor="full_name"
            className="block text-sm text-zinc-400 mb-2"
          >
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            defaultValue={fullName}
            className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Your Full Name"
          />
          {state.errors?.full_name && (
            <div className="text-red-500 text-sm mt-2">
              {state.errors.full_name.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end items-center gap-4">
          {state.message && (
            <p className="text-sm text-zinc-400">{state.message}</p>
          )}
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
