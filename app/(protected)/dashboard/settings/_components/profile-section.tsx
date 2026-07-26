"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { ImageUp, Pencil, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef } from "react"
import { Controller, useForm } from "react-hook-form"

import {
  settingsOutlineButtonClassName,
  settingsPrimaryButtonClassName,
} from "@/app/(protected)/dashboard/settings/_components/settings-button-classes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"
import {
  getInitials,
  type ProfileData,
} from "@/lib/services/settings/parse-profile"
import {
  profileFormUiSchema,
  toProfileFormValues,
  type ProfileFormInput,
  type ProfileFormValues,
} from "@/schemas/settings/profile-form"
import type { UpdateProfileResponse } from "@/schemas/settings/update-profile"
import {
  ALLOWED_AVATAR_MIME_TYPES,
} from "@/schemas/settings/upload-avatar"

type ProfileSectionProps = {
  initialProfile: ProfileData
}

type UpdateProfileApiResponse = {
  data: UpdateProfileResponse
}

const avatarAccept = ALLOWED_AVATAR_MIME_TYPES.join(",")

export function ProfileSection({ initialProfile }: ProfileSectionProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedValuesRef = useRef<ProfileFormInput>(
    toProfileFormValues(initialProfile)
  )

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormUiSchema),
    defaultValues: {
      ...savedValuesRef.current,
      isEditing: false,
    },
  })

  const avatarFile = form.watch("avatar")
  const savedAvatarUrl = form.watch("savedAvatarUrl")
  const firstName = form.watch("firstName")
  const lastName = form.watch("lastName")
  const email = form.watch("email")
  const isEditing = form.watch("isEditing")

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) {
      return null
    }

    return URL.createObjectURL(avatarFile)
  }, [avatarFile])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  const saveMutation = useMutation({
    mutationFn: async (values: ProfileFormInput) => {
      const formData = new FormData()
      formData.append("firstName", values.firstName)
      formData.append("lastName", values.lastName)
      formData.append("email", values.email)

      if (values.avatar) {
        formData.append("avatar", values.avatar)
      }

      const response = await apiClient<UpdateProfileApiResponse>(
        "/api/settings/profile",
        {
          method: "PATCH",
          body: formData,
        }
      )

      return response.data
    },
    onSuccess: (data) => {
      const nextValues = toProfileFormValues(data.profile)
      savedValuesRef.current = nextValues
      form.reset({
        ...nextValues,
        isEditing: false,
      })
      router.refresh()
    },
    onError: (error) => {
      console.error(error)
    },
  })

  function startEditing() {
    form.clearErrors()
    form.setValue("isEditing", true)
  }

  function cancelEditing() {
    form.reset({
      ...savedValuesRef.current,
      isEditing: false,
    })
    form.clearErrors()
  }

  function onSubmit(values: ProfileFormValues) {
    const { isEditing: _isEditing, ...profileValues } = values
    saveMutation.mutate(profileValues)
  }

  function handleUploadClick() {
    if (!isEditing) {
      return
    }

    fileInputRef.current?.click()
  }

  const displayAvatarUrl = avatarPreviewUrl ?? savedAvatarUrl
  const displayInitials = getInitials(firstName, lastName, email)
  const isSaving = saveMutation.isPending

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle>Personal information</CardTitle>
          <CardDescription>
            Your account details used across flowkanvas.{" "}
            {initialProfile.inviteCount}{" "}
            {initialProfile.inviteCount === 1 ? "user" : "users"} invited by you.
          </CardDescription>
        </div>
        {!isEditing ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit personal information"
            className="shrink-0 text-brand-text-muted hover:text-brand-text-heading"
            onClick={startEditing}
          >
            <Pencil className="size-4" />
          </Button>
        ) : null}
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-6">
          <Field data-invalid={!!form.formState.errors.avatar}>
            <div className="flex items-center gap-4">
              <Avatar className="size-14 rounded-sm after:hidden">
                {displayAvatarUrl ? (
                  <AvatarImage
                    src={displayAvatarUrl}
                    alt="Profile photo"
                    className="rounded-sm object-cover"
                  />
                ) : null}
                <AvatarFallback className="rounded-sm bg-brand-teal/15 text-brand-teal">
                  {displayInitials}
                </AvatarFallback>
              </Avatar>

              {isEditing ? (
                <div>
                  <Controller
                    name="avatar"
                    control={form.control}
                    render={({ field: { onChange, ref } }) => (
                      <input
                        ref={(element) => {
                          ref(element)
                          fileInputRef.current = element
                        }}
                        type="file"
                        accept={avatarAccept}
                        className="sr-only"
                        disabled={isSaving}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null
                          onChange(file)
                          event.target.value = ""
                        }}
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    className={settingsOutlineButtonClassName}
                    onClick={handleUploadClick}
                  >
                    <ImageUp className="size-4" aria-hidden />
                    Upload photo
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    JPG, PNG, or WebP up to 2 MB. Saves with Save changes.
                  </p>
                </div>
              ) : null}
            </div>
            <FieldError errors={[form.formState.errors.avatar]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!form.formState.errors.firstName}>
              <FieldLabel htmlFor="first-name">First name</FieldLabel>
              <Input
                id="first-name"
                readOnly={!isEditing}
                aria-readonly={!isEditing}
                disabled={isSaving}
                aria-invalid={!!form.formState.errors.firstName}
                {...form.register("firstName")}
              />
              <FieldError errors={[form.formState.errors.firstName]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.lastName}>
              <FieldLabel htmlFor="last-name">Last name</FieldLabel>
              <Input
                id="last-name"
                readOnly={!isEditing}
                aria-readonly={!isEditing}
                disabled={isSaving}
                aria-invalid={!!form.formState.errors.lastName}
                {...form.register("lastName")}
              />
              <FieldError errors={[form.formState.errors.lastName]} />
            </Field>
          </div>

          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              readOnly={!isEditing}
              aria-readonly={!isEditing}
              disabled={isSaving}
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
        </CardContent>

        {isEditing ? (
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              className={settingsOutlineButtonClassName}
              onClick={cancelEditing}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className={settingsPrimaryButtonClassName}
            >
              Save changes
            </Button>
          </CardFooter>
        ) : null}
      </form>
    </Card>
  )
}
