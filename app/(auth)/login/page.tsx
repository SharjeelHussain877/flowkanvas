import { LoginForm } from "./_components/login-form"
import { getAuthConfirmErrorMessage } from "@/lib/auth/confirmation-errors"
import { getEmailFromSearchParam } from "@/lib/auth/email-search-param"
import { getAuthNoticeMessage } from "@/lib/auth/notices"

function getStringFromSearchParam(
  value: string | string[] | undefined
): string | undefined {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value) && value[0]) {
    return value[0]
  }

  return undefined
}

function getErrorFromSearchParam(
  error: string | string[] | undefined
): string | undefined {
  const code = getStringFromSearchParam(error)
  return code ? getAuthConfirmErrorMessage(code) ?? undefined : undefined
}

function getNoticeFromSearchParam(
  notice: string | string[] | undefined
): string | undefined {
  const code = getStringFromSearchParam(notice)
  return code ? getAuthNoticeMessage(code) ?? undefined : undefined
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string | string[]
    error?: string | string[]
    notice?: string | string[]
  }>
}) {
  const params = await searchParams
  const defaultEmail = getEmailFromSearchParam(params.email)
  const authError = getErrorFromSearchParam(params.error)
  const authNotice = getNoticeFromSearchParam(params.notice)

  return (
    <LoginForm
      defaultEmail={defaultEmail}
      authError={authError}
      authNotice={authNotice}
    />
  )
}
