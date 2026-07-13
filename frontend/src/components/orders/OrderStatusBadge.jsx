import Badge from '../ui/Badge'
import { ORDER_STATUSES } from '../../lib/constants'

export default function OrderStatusBadge({ status }) {
  const info = ORDER_STATUSES[status] || { label: status, color: 'neutral' }
  return (
    <Badge variant={info.color} dot>
      {info.label}
    </Badge>
  )
}
