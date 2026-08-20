const EMAILS_ADMIN = [
  'louismaurice2904@gmail.com',
]

export function estAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return EMAILS_ADMIN.includes(email.toLowerCase())
}