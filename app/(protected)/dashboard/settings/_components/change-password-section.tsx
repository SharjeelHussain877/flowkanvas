"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Check, Eye, EyeOff, KeyRound } from "lucide-react"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"

import { PasswordRequirements } from "@/app/(auth)/_components/password-requirements"
import {
  settingsPrimaryButtonClassName,
} from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ApiError, apiClient } from "@/lib/api/client"
import { isPasswordValid } from "@/lib/auth/password-requirements"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { backgroundMutationMeta } from "@/lib/query/mutation-meta"
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
  type CurrentPasswordVerificationStatus,
  type SettingsChangePasswordInput,
  type SettingsChangePasswordResponse,
  type VerifyCurrentPasswordResponse,
} from "@/schemas/settings/change-password"

type UpdatePasswordApiResponse = {
  data: SettingsChangePasswordResponse
}

export function ChangePasswordSection() {
  const lastVerifiedPasswordRef = useRef<string | null>(null)

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      verificationStatus: "idle",
      showNewPassword: false,
      showConfirmPassword: false,
    },
    mode: "onChange",
  })

  const currentPassword = form.watch("currentPassword")
  const newPassword = form.watch("newPassword")
  const confirmPassword = form.watch("confirmPassword")
  const verificationStatus = form.watch("verificationStatus")
  const showNewPassword = form.watch("showNewPassword")
  const showConfirmPassword = form.watch("showConfirmPassword")
  const debouncedCurrentPassword = useDebouncedValue(currentPassword, 500)

  function setVerificationStatus(
    status: CurrentPasswordVerificationStatus
  ) {
    form.setValue("verificationStatus", status, { shouldDirty: false })
  }

  const verifyCurrentPasswordMutation = useMutation({
    meta: backgroundMutationMeta,
    mutationFn: (password: string) =>
      apiClient<VerifyCurrentPasswordResponse>(
        "/api/settings/password/verify-current",
        {
          method: "POST",
          body: JSON.stringify({ currentPassword: password }),
        }
      ),
    onSuccess: (_data, password) => {
      lastVerifiedPasswordRef.current = password
      setVerificationStatus("valid")
      form.clearErrors("currentPassword")
    },
    onError: (error) => {
      lastVerifiedPasswordRef.current = null
      setVerificationStatus("invalid")

      if (error instanceof ApiError && error.code === "INVALID_CURRENT_PASSWORD") {
        form.setError("currentPassword", { message: error.message })
        return
      }

      form.setError("currentPassword", {
        message:
          error instanceof Error
            ? error.message
            : "Unable to verify current password",
      })
    },
  })

  const { mutate: verifyCurrentPassword } = verifyCurrentPasswordMutation

  useEffect(() => {
    const trimmed = debouncedCurrentPassword.trim()

    if (!trimmed) {
      lastVerifiedPasswordRef.current = null
      setVerificationStatus("idle")
      form.clearErrors("currentPassword")
      return
    }

    if (lastVerifiedPasswordRef.current === trimmed) {
      setVerificationStatus("valid")
      return
    }

    setVerificationStatus("verifying")
    form.clearErrors("currentPassword")
    verifyCurrentPassword(trimmed)
  }, [debouncedCurrentPassword, form, verifyCurrentPassword])

  useEffect(() => {
    const trimmed = currentPassword.trim()

    if (
      lastVerifiedPasswordRef.current &&
      trimmed !== lastVerifiedPasswordRef.current
    ) {
      lastVerifiedPasswordRef.current = null
      setVerificationStatus("idle")
      form.setValue("newPassword", "", { shouldValidate: false })
      form.setValue("confirmPassword", "", { shouldValidate: false })
      form.setValue("showNewPassword", false, { shouldDirty: false })
      form.setValue("showConfirmPassword", false, { shouldDirty: false })
      form.clearErrors(["newPassword", "confirmPassword"])
    }
  }, [currentPassword, form])

  const updatePasswordMutation = useMutation({
    mutationFn: (values: SettingsChangePasswordInput) =>
      apiClient<UpdatePasswordApiResponse>("/api/settings/password", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      form.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        verificationStatus: "idle",
        showNewPassword: false,
        showConfirmPassword: false,
      })
      lastVerifiedPasswordRef.current = null
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "INVALID_CURRENT_PASSWORD") {
        form.setError("currentPassword", { message: error.message })
        setVerificationStatus("invalid")
        return
      }

      form.setError("root", {
        message:
          error instanceof Error ? error.message : "Unable to update password",
      })
    },
  })

  const isCurrentPasswordVerified = verificationStatus === "valid"
  const canEditNewPasswords = isCurrentPasswordVerified
  const hasValidNewPassword =
    newPassword.trim().length > 0 && isPasswordValid(newPassword)
  const passwordsMatch =
    confirmPassword.trim().length > 0 && newPassword === confirmPassword
  const canSubmit =
    isCurrentPasswordVerified &&
    hasValidNewPassword &&
    passwordsMatch &&
    !updatePasswordMutation.isPending &&
    !verifyCurrentPasswordMutation.isPending

  function onSubmit(values: ChangePasswordFormValues) {
    const {
      verificationStatus: _verificationStatus,
      showNewPassword: _showNewPassword,
      showConfirmPassword: _showConfirmPassword,
      ...passwordValues
    } = values
    updatePasswordMutation.mutate(passwordValues)
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 mb-4">
          <div className="min-w-0 space-y-1">
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Use a strong password with at least 8 characters.
            </CardDescription>
          </div>
          <Button
            type="submit"
            disabled={!canSubmit}
            aria-label="Update password"
            className={`shrink-0 ${settingsPrimaryButtonClassName}`}
          >
            <KeyRound className="size-4" />
            <span className="hidden sm:inline">Update password</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel htmlFor="current-password">Current password</FieldLabel>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              endIcon={
                verificationStatus === "valid" ? (
                  <Check className="size-4 text-brand-teal" aria-hidden />
                ) : undefined
              }
              {...form.register("currentPassword")}
            />
            {verificationStatus === "verifying" ? (
              <p className="text-xs text-muted-foreground">
                Checking current password...
              </p>
            ) : null}
            <FieldError errors={[form.formState.errors.currentPassword]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={!canEditNewPasswords}
              endIcon={
                canEditNewPasswords ? (
                  <button
                    type="button"
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                    className="text-brand-text-muted transition-colors hover:text-brand-text-heading"
                    onClick={() =>
                      form.setValue("showNewPassword", !showNewPassword, {
                        shouldDirty: false,
                      })
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-[18px]" aria-hidden />
                    ) : (
                      <Eye className="size-[18px]" aria-hidden />
                    )}
                  </button>
                ) : undefined
              }
              {...form.register("newPassword")}
            />
            {canEditNewPasswords ? (
              <PasswordRequirements password={newPassword} />
            ) : null}
            <FieldError errors={[form.formState.errors.newPassword]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={!canEditNewPasswords}
              endIcon={
                canEditNewPasswords ? (
                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    className="text-brand-text-muted transition-colors hover:text-brand-text-heading"
                    onClick={() =>
                      form.setValue(
                        "showConfirmPassword",
                        !showConfirmPassword,
                        { shouldDirty: false }
                      )
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-[18px]" aria-hidden />
                    ) : (
                      <Eye className="size-[18px]" aria-hidden />
                    )}
                  </button>
                ) : undefined
              }
              {...form.register("confirmPassword")}
            />
            <FieldError errors={[form.formState.errors.confirmPassword]} />
          </Field>

          {form.formState.errors.root?.message ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          ) : null}
        </CardContent>
      </form>
    </Card>
  )
}
