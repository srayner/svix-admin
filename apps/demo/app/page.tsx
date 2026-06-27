import { SvixAdmin } from 'svix-admin'

const eventTypes = [
  {
    name: 'order.created',
    label: 'Order Created',
    description: 'A new order has been placed',
    schema: {
      type: 'object',
      examples: [{ orderId: 'ord_abc123', customerId: 'cust_xyz456', total: 49.99, items: [{ productId: 'prod_001', quantity: 2, unitPrice: 24.99 }] }],
      properties: {
        orderId: { type: 'string', description: 'Unique order identifier', example: 'ord_abc123' },
        customerId: { type: 'string', description: 'Customer who placed the order', example: 'cust_xyz456' },
        total: { type: 'number', description: 'Order total in the account currency', example: 49.99 },
        items: {
          type: 'array',
          example: [{ productId: 'prod_001', quantity: 2, unitPrice: 24.99 }],
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string', example: 'prod_001' },
              quantity: { type: 'integer', example: 2 },
              unitPrice: { type: 'number', example: 24.99 },
            },
            required: ['productId', 'quantity', 'unitPrice'],
          },
        },
      },
      required: ['orderId', 'customerId', 'total'],
    },
  },
  {
    name: 'order.updated',
    label: 'Order Updated',
    description: 'An order has been modified',
    schema: {
      type: 'object',
      examples: [{ orderId: 'ord_abc123', customerId: 'cust_xyz456', status: 'processing', updatedAt: '2024-01-15T10:30:00Z' }],
      properties: {
        orderId: { type: 'string', example: 'ord_abc123' },
        customerId: { type: 'string', example: 'cust_xyz456' },
        status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered'], example: 'processing' },
        updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
      },
      required: ['orderId', 'status'],
    },
  },
  {
    name: 'order.cancelled',
    label: 'Order Cancelled',
    description: 'An order has been cancelled',
    schema: {
      type: 'object',
      examples: [{ orderId: 'ord_abc123', customerId: 'cust_xyz456', reason: 'Customer request', cancelledAt: '2024-01-15T11:00:00Z' }],
      properties: {
        orderId: { type: 'string', example: 'ord_abc123' },
        customerId: { type: 'string', example: 'cust_xyz456' },
        reason: { type: 'string', example: 'Customer request' },
        cancelledAt: { type: 'string', format: 'date-time', example: '2024-01-15T11:00:00Z' },
      },
      required: ['orderId', 'customerId'],
    },
  },
  {
    name: 'payment.succeeded',
    label: 'Payment Succeeded',
    description: 'A payment was processed successfully',
    schema: {
      type: 'object',
      examples: [{ paymentId: 'pay_def789', orderId: 'ord_abc123', amount: 49.99, currency: 'GBP', method: 'card' }],
      properties: {
        paymentId: { type: 'string', example: 'pay_def789' },
        orderId: { type: 'string', example: 'ord_abc123' },
        amount: { type: 'number', example: 49.99 },
        currency: { type: 'string', example: 'GBP' },
        method: { type: 'string', enum: ['card', 'bank_transfer', 'wallet'], example: 'card' },
      },
      required: ['paymentId', 'orderId', 'amount', 'currency'],
    },
  },
  {
    name: 'payment.failed',
    label: 'Payment Failed',
    description: 'A payment attempt failed',
    schema: {
      type: 'object',
      examples: [{ paymentId: 'pay_def789', orderId: 'ord_abc123', amount: 49.99, currency: 'GBP', failureCode: 'card_declined', failureMessage: 'Your card was declined.' }],
      properties: {
        paymentId: { type: 'string', example: 'pay_def789' },
        orderId: { type: 'string', example: 'ord_abc123' },
        amount: { type: 'number', example: 49.99 },
        currency: { type: 'string', example: 'GBP' },
        failureCode: { type: 'string', example: 'card_declined' },
        failureMessage: { type: 'string', example: 'Your card was declined.' },
      },
      required: ['paymentId', 'orderId', 'amount', 'currency', 'failureCode'],
    },
  },
  {
    name: 'user.created',
    label: 'User Created',
    description: 'A new user account was created',
    schema: {
      type: 'object',
      examples: [{ userId: 'usr_ghi012', email: 'jane@example.com', name: 'Jane Smith', createdAt: '2024-01-15T09:00:00Z' }],
      properties: {
        userId: { type: 'string', example: 'usr_ghi012' },
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
        name: { type: 'string', example: 'Jane Smith' },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T09:00:00Z' },
      },
      required: ['userId', 'email'],
    },
  },
  {
    name: 'user.updated',
    label: 'User Updated',
    description: 'A user account was updated',
    schema: {
      type: 'object',
      examples: [{ userId: 'usr_ghi012', email: 'jane@example.com', name: 'Jane Smith', updatedAt: '2024-01-15T10:00:00Z' }],
      properties: {
        userId: { type: 'string', example: 'usr_ghi012' },
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
        name: { type: 'string', example: 'Jane Smith' },
        updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'user.deleted',
    label: 'User Deleted',
    description: 'A user account was deleted',
    schema: {
      type: 'object',
      examples: [{ userId: 'usr_ghi012', email: 'jane@example.com', deletedAt: '2024-01-15T12:00:00Z' }],
      properties: {
        userId: { type: 'string', example: 'usr_ghi012' },
        email: { type: 'string', format: 'email', example: 'jane@example.com' },
        deletedAt: { type: 'string', format: 'date-time', example: '2024-01-15T12:00:00Z' },
      },
      required: ['userId', 'email'],
    },
  },
]

export default function Page() {
  return (
    <main className="min-h-screen bg-background p-8">
      <SvixAdmin appName="demo-app" eventTypes={eventTypes} />
    </main>
  )
}
