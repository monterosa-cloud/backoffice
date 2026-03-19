const ALLOWED_EMAILS = [
  'giorgio@monterosa-ventures.com',
  'pietro@monterosa-ventures.com',
]

export function isEmailAllowed(email: string): boolean {
  return ALLOWED_EMAILS.includes(email.toLowerCase().trim())
}
