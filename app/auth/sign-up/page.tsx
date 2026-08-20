import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  redirect('/auth/login?message=El%20registro%20p%C3%BAblico%20no%20est%C3%A1%20disponible.')
}
