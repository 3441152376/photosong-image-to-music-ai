export interface PaymentSession {
  url: string
  sessionId: string
}

export type PaymentStatusType = 
  | 'paid'
  | 'unpaid'
  | 'processing'
  | 'expired'
  | 'failed'
  | 'canceled'
  | 'no_payment_required'

export interface PaymentStatus {
  status: PaymentStatusType
}

export interface PriceIds {
  memberships: {
    trial: string
    pro: string
    premium: string
    lifetime: string
  }
  points: {
    small: string
    medium: string
    large: string
  }
} 