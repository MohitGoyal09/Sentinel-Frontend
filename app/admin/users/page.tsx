'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { AlertCircle, CheckCircle, Loader2, UserPlus } from 'lucide-react'

interface InviteFormState {
  email: string
  role: 'employee' | 'manager' | 'admin'
  team_id: string
}

interface InviteApiResponse {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
}

const ROLE_OPTIONS: { value: InviteFormState['role']; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
]

const EMPTY_FORM: InviteFormState = { email: '', role: 'employee', team_id: '' }

export default function AdminUsersPage() {
  const { userRole } = useAuth()

  const [form, setForm] = useState<InviteFormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (userRole?.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Access denied. Admin role required.</p>
      </div>
    )
  }

  const handleChange = (field: keyof InviteFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccessMsg(null)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const payload: { email: string; role: string; team_id?: string } = {
        email: form.email,
        role: form.role,
      }
      if (form.team_id.trim()) {
        payload.team_id = form.team_id.trim()
      }

      const result = await api.post<InviteApiResponse>('/admin/invite', payload)
      const data = result as InviteApiResponse

      setSuccessMsg(
        `Invitation sent to ${data.email} (${data.role}). Expires ${new Date(data.expires_at).toLocaleDateString()}.`
      )
      setForm(EMPTY_FORM)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr?.response?.data?.detail ?? 'Failed to send invitation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          Invite User
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send a secure invitation link to a new team member.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/8 border border-green-500/15 text-xs font-medium text-green-500 mb-6 animate-in fade-in duration-200">
          <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/8 border border-destructive/20 text-xs font-medium text-destructive mb-6 animate-in fade-in duration-150">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleInvite} noValidate className="space-y-4">
        <div>
          <label htmlFor="invite-email" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5">
            Work Email
          </label>
          <input
            id="invite-email"
            type="email"
            placeholder="colleague@company.com"
            required
            disabled={loading}
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full bg-muted border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-[color,background-color,border-color,box-shadow] duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="invite-role" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5">
            Role
          </label>
          <select
            id="invite-role"
            required
            disabled={loading}
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="w-full bg-muted border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-[color,background-color,border-color,box-shadow] duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="invite-team" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5">
            Team ID <span className="text-muted-foreground/40 normal-case font-normal">(optional)</span>
          </label>
          <input
            id="invite-team"
            type="text"
            placeholder="UUID of the team to pre-assign"
            disabled={loading}
            value={form.team_id}
            onChange={(e) => handleChange('team_id', e.target.value)}
            className="w-full bg-muted border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-[color,background-color,border-color,box-shadow] duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !form.email}
          className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 rounded-lg text-sm transition-[color,background-color,transform,box-shadow] duration-150 ease-out active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-2xl shadow-black/50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Send Invitation
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground/40 text-center">
        The invitee will receive a link valid for 7 days. They must set a password to activate their account.
      </p>
    </div>
  )
}
