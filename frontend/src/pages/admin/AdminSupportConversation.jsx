import Conversation from '../dashboard/Conversation'

/** Admin reply view for a support thread — reuses the chat UI. */
export default function AdminSupportConversation() {
  return <Conversation backTo="/admin/support" listQueryKey={['admin', 'support']} />
}
