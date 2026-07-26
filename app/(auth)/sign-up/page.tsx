import { SignUpForm } from "./_components/sign-up-form"
import { getEmailFromSearchParam } from "@/lib/auth/email-search-param"
import { getInviteRefFromSearchParam } from "@/lib/auth/invite-ref"

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[]; ref?: string | string[] }>
}) {
  const params = await searchParams
  const defaultEmail = getEmailFromSearchParam(params.email)
  const inviteRef = getInviteRefFromSearchParam(params.ref)

  return <SignUpForm defaultEmail={defaultEmail} inviteRef={inviteRef} />
}
