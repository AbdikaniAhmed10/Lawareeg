import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import adminApi from '../../api/admin'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { CATEGORIES } from '../../lib/constants'
import BackButton from '../../components/ui/BackButton'

export default function AdminCategories() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', slug: '' })
  const queryClient = useQueryClient()

  const { data } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.categories, retry: 0 })
  const categories = data?.data?.length ? data.data : CATEGORIES

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
  const createMutation = useMutation({ mutationFn: adminApi.createCategory, onSuccess: () => { invalidate(); closeModal() } })
  const updateMutation = useMutation({ mutationFn: (payload) => adminApi.updateCategory(editing.id, payload), onSuccess: () => { invalidate(); closeModal() } })
  const deleteMutation = useMutation({ mutationFn: adminApi.deleteCategory, onSuccess: invalidate })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', slug: '' })
    setModalOpen(true)
  }
  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug })
    setModalOpen(true)
  }
  const closeModal = () => setModalOpen(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) updateMutation.mutate(form)
    else createMutation.mutate(form)
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton to="/admin" label="Back to admin" className="lg:hidden" preferHistory={false} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Categories</h1>
          <p className="mt-1 text-ink-soft">Manage the marketplace category taxonomy.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <div key={cat.slug || cat.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
              {Icon && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{cat.name}</p>
                <p className="truncate text-xs text-ink-soft">/{cat.slug}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(cat.id)}>
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit category' : 'Add category'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          <Button type="submit" className="w-full" loading={createMutation.isPending || updateMutation.isPending}>
            {editing ? 'Save changes' : 'Create category'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
