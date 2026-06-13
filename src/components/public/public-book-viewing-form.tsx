"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  submitPublicBookViewingFormAction,
  type PublicInquiryFormActionState,
} from "@/lib/public/inquiries/server-actions"
import type { PublicProjectOption } from "@/lib/public/projects/actions"

type PublicBookViewingFormProps = {
  projects: PublicProjectOption[]
  nextPath: string
  defaultProjectId?: string | null
  className?: string
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

export function PublicBookViewingForm({
  projects,
  nextPath,
  defaultProjectId,
  className,
}: PublicBookViewingFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitPublicBookViewingFormAction,
    INITIAL_STATE,
  )

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
          <label htmlFor="viewing-fullName" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Full name <span className="text-destructive">*</span>
          </label>
          <Input
            id="viewing-fullName"
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
          <label htmlFor="viewing-phone" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Phone number <span className="text-destructive">*</span>
          </label>
          <Input
            id="viewing-phone"
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
          <label htmlFor="viewing-email" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Email
          </label>
          <Input
            id="viewing-email"
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

        {!hasFixedProject ? (
          <div className="space-y-1">
            <label htmlFor="viewing-project" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Project to visit
            </label>
            <select
              id="viewing-project"
              name="projectId"
              defaultValue=""
              className="public-form-select"
              aria-invalid={getFieldError(fieldErrors, "projectId") ? true : undefined}
            >
              <option value="">I need recommendations first</option>
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

        <div className="space-y-1">
          <label htmlFor="viewing-date" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preferred date <span className="text-destructive">*</span>
          </label>
          <Input
            id="viewing-date"
            name="preferredVisitDate"
            type="date"
            className="h-10 rounded-xl bg-background/85"
            aria-invalid={getFieldError(fieldErrors, "preferredVisitDate") ? true : undefined}
          />
          {getFieldError(fieldErrors, "preferredVisitDate") ? (
            <p className="text-xs text-destructive">{getFieldError(fieldErrors, "preferredVisitDate")}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="viewing-time" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preferred time
          </label>
          <Input
            id="viewing-time"
            name="preferredVisitTime"
            type="time"
            className="h-10 rounded-xl bg-background/85"
            aria-invalid={getFieldError(fieldErrors, "preferredVisitTime") ? true : undefined}
          />
          {getFieldError(fieldErrors, "preferredVisitTime") ? (
            <p className="text-xs text-destructive">{getFieldError(fieldErrors, "preferredVisitTime")}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="viewing-party" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Party size
          </label>
          <Input
            id="viewing-party"
            name="partySize"
            type="number"
            min={1}
            max={20}
            placeholder="2"
            className="h-10 rounded-xl bg-background/85"
            aria-invalid={getFieldError(fieldErrors, "partySize") ? true : undefined}
          />
          {getFieldError(fieldErrors, "partySize") ? (
            <p className="text-xs text-destructive">{getFieldError(fieldErrors, "partySize")}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="viewing-channel" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preferred contact channel
          </label>
          <select
            id="viewing-channel"
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

        <div className="space-y-1">
          <label htmlFor="viewing-language" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Preferred language
          </label>
          <select
            id="viewing-language"
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
      </div>

      <div className="space-y-1">
        <label htmlFor="viewing-message" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Additional notes
        </label>
        <Textarea
          id="viewing-message"
          name="message"
          placeholder="Share preferred weekday, budget, or accessibility needs."
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
        {isPending ? "Submitting..." : "Book viewing"}
      </Button>
    </form>
  )
}
