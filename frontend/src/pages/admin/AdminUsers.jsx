import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ShieldCheck, ShieldOff, ExternalLink, BadgeCheck, Trash2 } from 'lucide-react'
import adminApi from '../../api/admin'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatDate, initials } from '../../lib/format'
import { mediaUrl } from '../../lib/mediaUrl'
import BackButton from '../../components/ui/BackButton'
import { useAuthStore } from '../../store/authStore'

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const queryClient = useQueryClient()
  const me = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => adminApi.users({ q: search }),
    retry: 0,
  })

  const suspendMutation = useMutation({
    mutationFn: (id) => adminApi.suspendUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
  const reinstateMutation = useMutation({
    mutationFn: (id) => adminApi.reinstateUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => {
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const users = data?.data || []

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/admin" label="Back to admin" className="lg:hidden" preferHistory={false} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Users</h1>
          <p className="mt-1 text-ink-soft">Manage buyer and seller accounts. Open a profile to see their listings.</p>
        </div>
        <Button as={Link} to="/admin/verifications" variant="secondary" size="sm">
          <BadgeCheck className="size-4" /> Verification requests
        </Button>
      </div>

      <div className="flex max-w-md items-center gap-2 rounded-xl border border-border bg-surface p-2">
        <Search className="ml-2 size-4 text-ink-soft/60" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-soft/50"
        />
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : users.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-3.5 font-medium">User</th>
                <th className="px-5 py-3.5 font-medium">Role</th>
                <th className="px-5 py-3.5 font-medium">Badge</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Joined</th>
                <th className="px-5 py-3.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const suspended = user.is_suspended || user.status === 'suspended'
                const verified = user.is_verified_seller || user.verified
                const isAdminUser = user.role === 'admin'

                return (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-sand-deep/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {user.avatar ? (
                            <img src={mediaUrl(user.avatar)} alt="" className="size-full object-cover" />
                          ) : (
                            initials(user.name)
                          )}
                        </span>
                        <div>
                          <p className="font-medium text-ink">{user.name}</p>
                          <p className="text-xs text-ink-soft">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 capitalize text-ink-soft">{user.role || 'buyer'}</td>
                    <td className="px-5 py-3.5">
                      {verified ? (
                        <Badge variant="success" icon={ShieldCheck}>
                          Verified
                        </Badge>
                      ) : (
                        <span className="text-xs capitalize text-ink-soft">
                          {user.seller_verification_status || 'none'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={suspended && !isAdminUser ? 'danger' : 'success'}>
                        {suspended && !isAdminUser ? 'suspended' : 'active'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button as={Link} to={`/users/${user.id}`} size="sm" variant="ghost">
                          <ExternalLink className="size-4" /> Profile
                        </Button>
                        {!isAdminUser && (
                          <>
                            {suspended ? (
                              <Button size="sm" variant="ghost" onClick={() => reinstateMutation.mutate(user.id)}>
                                <ShieldCheck className="size-4 text-success" /> Reinstate
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => suspendMutation.mutate(user.id)}>
                                <ShieldOff className="size-4 text-danger" /> Suspend
                              </Button>
                            )}
                            {me?.id !== user.id && (
                              <Button size="sm" variant="ghost" title="Delete user" onClick={() => setDeleteTarget(user)}>
                                <Trash2 className="size-4 text-danger" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No users found" description="Try adjusting your search." />
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete user">
        <p className="text-sm text-ink-soft">
          Permanently delete <strong className="text-ink">{deleteTarget?.name}</strong> ({deleteTarget?.email})?
          Their listings and related data will be removed. This cannot be undone.
        </p>
        {deleteMutation.isError && (
          <p className="mt-3 text-sm text-danger">
            {deleteMutation.error?.response?.data?.message ||
              deleteMutation.error?.response?.data?.errors?.user?.[0] ||
              'Could not delete user.'}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteTarget.id)}
          >
            Delete user
          </Button>
        </div>
      </Modal>
    </div>
  )
}
