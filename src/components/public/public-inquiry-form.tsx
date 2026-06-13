"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  submitPublicContactFormAction,
  type PublicInquiryFormActionState,
} from "@/lib/public/inquiries/server-actions"
import type { PublicProjectOption } from "@/lib/public/projects/actions"

type PublicInquiryFormProps = {
  projects: PublicProjectOption[]
  nextPath: string
  defaultProjectId?: string | null
  className?: string
  submitLabel?: string
}

const INITIAL_STATE: PublicInquiryFormActionState = {
  status: "idle",
  fieldErrors: {},
}

function getFieldError(
  fieldErrors: Partial<Record<string, string>> | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field]
}

export function PublicInquiryForm({
  projects,
  nextPath,
  defaultProjectId,
  className,
  submitLabel = "Send inquiry",
}: PublicInquiryFormProps) {
  const [state, formAction, isPending] = useActionState(submitPublicContactFormAction, INITIAL_STATE)

  const fieldErrors = state.fieldErrors
  const hasFixedProject = typeof defaultProjectId === "string" && defaultProjectId.trim().length > 0

  return (
    <form action={formAction} className={cn("public-copy space-y-5", className)}>
      <input type="hidden" name="nextPath" value={nextPath} />
      {hasFixedProject ? <input type="hidden" name="projectId" value={defaultProjectId ?? ""} /> : null}

      {state.message ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            state.status === "success"
              ? "border-emerald-300 bg-emerald-50/90 text-emerald-800"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="contact-fullName" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Full name <span className="text-destructive">*</span>
          </label>
          <Input
            id="contact-fullName"
            name="fullName"
            placeholder="Your full name"
            className="h-10 rounded-xl bg-background/85"
            aria-invalid={getFieldError(fieldErrors, "fullName") ? true : undefined}
          />
          {getFieldError(fieldErrors, "fullName") ? (
            <p className="text-xs text-destructive">{getFieldError(fieldErrors, "fullName")}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="contact-phone" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Phone number <span className="text-destructive">*</span>
          </label>
          <Input
            id="contact-phone"
            name="phoneNumber"
            placeholder="+6012..."
            className="h-10 rounded-xl bg-background/85"
            aria-invalid={getFieldError(fieldErrors, "phoneNumber") ? true : undefined}
          />
          {getFieldError(fieldErrors, "phoneNumber") ? (
            <p className="text-xs text-destructive">{getFieldError(fieldErrors, "phoneNumber")}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Email
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="h-10 rounded-xl bg-background/85"
            aria-invalid={getFieldError(fieldErrors, "email") ? true : undefined}
          />
          {getFieldError(fieldErrors, "email") ? (
            <p className="text-xs text-destructive">{getFieldError(fieldErrors, "email")}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="contact-language" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preferred language
          </label>
          <select
            id="contact-language"
            name="preferredLanguage"
            defaultValue=""
            className="public-form-select"
            aria-invalid={getFieldError(fieldErrors, "preferredLanguage") ? true : undefined}
          >
            <option value="">No preference</option>
            <option value="EN">English</option>
            <option value="BM">Bahasa Melayu</option>
            <option value="CN">Chinese</option>
          </select>
          {getFieldError(fieldErrors, "preferredLanguage") ? (
            <p className="text-xs text-destructive">{getFieldError(fieldErrors, "preferredLanguage")}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="contact-channel" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preferred contact channel
          </label>
          <select
            id="contact-channel"
            name="preferredContactChannel"
            defaultValue=""
            className="public-form-select"
            aria-invalid={getFieldError(fieldErrors, "preferredContactChannel") ? true : undefined}
          >
            <option value="">No preference</option>
            <option value="PHONE">Phone call</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
          </select>
          {getFieldError(fieldErrors, "preferredContactChannel") ? (
            <p className="text-xs text-destructive">
              {getFieldError(fieldErrors, "preferredContactChannel")}
            </p>
          ) : null}
        </div>

        {!hasFixedProject ? (
          <div className="space-y-1">
            <label htmlFor="contact-project" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Project of interest
            </label>
            <select
              id="contact-project"
              name="projectId"
              defaultValue=""
              className="public-form-select"
              aria-invalid={getFieldError(fieldErrors, "projectId") ? true : undefined}
            >
              <option value="">I am still exploring</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {getFieldError(fieldErrors, "projectId") ? (
              <p className="text-xs text-destructive">{getFieldError(fieldErrors, "projectId")}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Message <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="contact-message"
          name="message"
          placeholder="Share your budget, preferred area, or timeline."
          className="min-h-28 rounded-xl bg-background/85"
          aria-invalid={getFieldError(fieldErrors, "message") ? true : undefined}
        />
        {getFieldError(fieldErrors, "message") ? (
          <p className="text-xs text-destructive">{getFieldError(fieldErrors, "message")}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-10 w-full rounded-xl bg-[color:var(--public-accent-strong)] px-5 text-white hover:bg-[color:var(--public-accent-soft)] md:w-auto"
      >
        {isPending ? "Submitting..." : submitLabel}
      </Button>
    </form>
  )
}
