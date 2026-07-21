"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { ArrowRight, AtSign, Eye, EyeOff, Lock, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { PasswordRequirements } from "@/app/(auth)/_components/password-requirements"
import { AuthSubmitButton } from "@/app/(auth)/_components/auth-submit-button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { buildAuthHref } from "@/lib/auth/email-search-param"
import { ApiError, apiClient } from "@/lib/api/client"
import {
  signUpSchema,
  type SignUpInput,
  type SignUpResponse,
} from "@/schemas/auth/sign-up"

export interface SignUpFormProps {
  defaultEmail?: string
}

export function SignUpForm({ defaultEmail = "" }: SignUpFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: defaultEmail,
      password: "",
    },
  })

  const emailValue = form.watch("email")
  const passwordValue = form.watch("password")

  const signUpMutation = useMutation({
    mutationFn: (data: SignUpInput) =>
      apiClient<SignUpResponse>("/api/auth/sign-up", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      form.clearErrors("root")

      if (data.needsEmailConfirmation) {
        const loginHref = buildAuthHref("/login", variables.email)
        const separator = loginHref.includes("?") ? "&" : "?"
        router.push(`${loginHref}${separator}notice=confirm_email`)
        return
      }

      router.push("/dashboard")
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "EMAIL_ALREADY_EXISTS") {
        form.setError("email", { message: error.message })
        return
      }

      form.setError("root", {
        message:
          error instanceof Error ? error.message : "Something went wrong",
      })
    },
  })

  function onSubmit(values: SignUpInput) {
    signUpMutation.mutate(values)
  }

  return (
    <Card className="relative gap-0 overflow-hidden rounded-xl border-0 border-brand-input-border bg-brand-surface shadow-[0_8px_30px_var(--brand-shadow)]">
      <div
        className="absolute top-0 left-1/2 h-[2px] w-[80%] -translate-x-1/2 rounded-full"
        style={{
          background:
            "linear-gradient(to right, transparent, var(--brand-primary), transparent)",
          boxShadow: "0 0 8px rgba(37,99,235,.45)",
        }}
      />
      <CardHeader className="items-center gap-2 border-b-0 px-8 pt-8 pb-0 text-center">
        <CardTitle className="text-3xl text-brand-text-heading">
          Create your account
        </CardTitle>
        <p className="text-xs text-brand-text-muted">
          Create an account to build PDF templates and integrate document
          generation into your apps.
        </p>
      </CardHeader>

      <CardContent className="px-8 pt-6 pb-8">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          noValidate
        >
          <Field data-invalid={!!form.formState.errors.fullName}>
            <FieldLabel
              htmlFor="fullName"
              className="text-xs font-bold tracking-wider text-brand-text-label uppercase"
            >
              Full Name
            </FieldLabel>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              startIcon={<UserRound aria-hidden />}
              aria-invalid={!!form.formState.errors.fullName}
              {...form.register("fullName")}
            />
            <FieldError errors={[form.formState.errors.fullName]} />
          </Field>

          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel
              htmlFor="email"
              className="text-xs font-bold tracking-wider text-brand-text-label uppercase"
            >
              Work Email
            </FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@enterprise.com"
              startIcon={<AtSign aria-hidden />}
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>

          <Field data-invalid={!!form.formState.errors.password}>
            <FieldLabel
              htmlFor="password"
              className="text-xs font-bold tracking-wider text-brand-text-label uppercase"
            >
              Create Password
            </FieldLabel>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter your password"
              startIcon={<Lock aria-hidden />}
              endIcon={
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-brand-text-muted transition-colors hover:text-brand-text-heading"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden />
                  ) : (
                    <Eye aria-hidden />
                  )}
                </button>
              }
              aria-invalid={!!form.formState.errors.password}
              {...form.register("password")}
            />
            <PasswordRequirements password={passwordValue} />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>

          {form.formState.errors.root?.message && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}

          <AuthSubmitButton
            pending={signUpMutation.isPending}
            label="Create Account"
            icon={<ArrowRight aria-hidden />}
          />
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center border-t-0 bg-transparent p-0 px-8 pb-5">
        <div className="w-full border-t border-brand-input-border" />
        <p className="pt-5 text-sm text-brand-text-muted">
          Already have an account?{" "}
          <Link
            href={buildAuthHref("/login", emailValue)}
            className="font-semibold tracking-wide text-brand-link uppercase hover:underline"
          >
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
