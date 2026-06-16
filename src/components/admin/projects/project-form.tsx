"use client"

import Link from "next/link"
import { useActionState, useMemo } from "react"

import {
  ActionCard,
  ProButton,
  ProField,
  ProInput,
  ProSelect,
  ProTextarea,
  ProValidationMessage,
} from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"
import type { AdminProjectEditable, AdminProjectFormOptions } from "@/lib/admin/projects/actions"
import {
  createAdminProjectAction,
  updateAdminProjectAction,
} from "@/lib/admin/projects/server-actions"
import type { ProjectFormActionState } from "@/lib/admin/projects/server-actions"

const INITIAL_PROJECT_FORM_ACTION_STATE: ProjectFormActionState = {
  fieldErrors: {},
}

type ProjectFormMode = "create" | "edit"

type ProjectFormProps = {
  mode: ProjectFormMode
  options: AdminProjectFormOptions
  project?: AdminProjectEditable
}

function getFieldError(
  fieldErrors: Partial<Record<string, string>> | undefined,
  key: string,
): string | undefined {
  return fieldErrors?.[key]
}

function InputField({
  name,
  label,
  defaultValue,
  required,
  placeholder,
  helper,
  type,
  fieldError,
}: {
  name: string
  label: string
  defaultValue?: string | number | null
  required?: boolean
  placeholder?: string
  helper?: string
  type?: string
  fieldError?: string
}) {
  return (
    <ProField
      label={label}
      required={required}
      helperText={helper}
      errorMessage={fieldError}
      successMessage={!fieldError && defaultValue ? "Looks good" : undefined}
    >
      <ProInput
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        tone={fieldError ? "error" : defaultValue ? "success" : "default"}
      />
    </ProField>
  )
}

function SelectField({
  name,
  label,
  required,
  defaultValue,
  fieldError,
  options,
  emptyLabel,
}: {
  name: string
  label: string
  required?: boolean
  defaultValue?: string | null
  fieldError?: string
  options: Array<{ id: string; name: string }>
  emptyLabel: string
}) {
  return (
    <ProField label={label} required={required} errorMessage={fieldError}>
      <ProSelect
        name={name}
        defaultValue={defaultValue ?? ""}
        emptyOptionLabel={emptyLabel}
        options={options.map((option) => ({ value: option.id, label: option.name }))}
        tone={fieldError ? "error" : defaultValue ? "success" : "default"}
      />
    </ProField>
  )
}

export function ProjectForm({ mode, options, project }: ProjectFormProps) {
  const [state, formAction, isPending] = useActionState(
    mode === "create" ? createAdminProjectAction : updateAdminProjectAction,
    INITIAL_PROJECT_FORM_ACTION_STATE,
  )

  const regionNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const region of options.regions) {
      map.set(region.id, region.name)
    }
    return map
  }, [options.regions])

  const title = mode === "create" ? "Create Project" : "Edit Project"
  const description =
    mode === "create"
      ? "Create a new internal project record."
      : "Update the selected project record."

  const fieldErrors = state.fieldErrors

  return (
    <ActionCard title={title} description={description}>
      <div className="space-y-4">
        <form action={formAction} className="space-y-4">
          {mode === "edit" ? <input type="hidden" name="projectId" value={project?.id ?? ""} /> : null}

          {state.message ? (
            <ProValidationMessage tone="error" message={state.message} />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              name="name"
              label="Name"
              required
              defaultValue={project?.name}
              placeholder="Project name"
              fieldError={getFieldError(fieldErrors, "name")}
            />
            <InputField
              name="slug"
              label="Slug"
              defaultValue={project?.slug}
              placeholder="project-slug"
              helper={
                mode === "create"
                  ? "If left blank during create, slug will be generated from the project name."
                  : "Editing name does not change slug automatically. Update slug explicitly to change it."
              }
              fieldError={getFieldError(fieldErrors, "slug")}
            />
            <InputField
              name="displayName"
              label="Display Name"
              defaultValue={project?.displayName}
              placeholder="Optional public-facing name"
              fieldError={getFieldError(fieldErrors, "displayName")}
            />
            <InputField
              name="legalName"
              label="Legal Name"
              defaultValue={project?.legalName}
              placeholder="Optional legal entity name"
              fieldError={getFieldError(fieldErrors, "legalName")}
            />
          </div>

          <ProField
            label="Description"
            errorMessage={getFieldError(fieldErrors, "description")}
          >
            <ProTextarea
              id="description"
              name="description"
              defaultValue={project?.description ?? ""}
              placeholder="Internal project description"
              tone={getFieldError(fieldErrors, "description") ? "error" : "default"}
            />
          </ProField>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              name="developerId"
              label="Developer"
              required
              defaultValue={project?.developerId}
              options={options.developers}
              emptyLabel="Select developer"
              fieldError={getFieldError(fieldErrors, "developerId")}
            />
            <SelectField
              name="projectStatusId"
              label="Project Status"
              required
              defaultValue={project?.projectStatusId}
              options={options.projectStatuses}
              emptyLabel="Select status"
              fieldError={getFieldError(fieldErrors, "projectStatusId")}
            />
            <SelectField
              name="tenureTypeId"
              label="Tenure Type"
              required
              defaultValue={project?.tenureTypeId}
              options={options.tenureTypes}
              emptyLabel="Select tenure type"
              fieldError={getFieldError(fieldErrors, "tenureTypeId")}
            />
            <SelectField
              name="titleTypeId"
              label="Title Type"
              defaultValue={project?.titleTypeId}
              options={options.titleTypes}
              emptyLabel="No title type"
              fieldError={getFieldError(fieldErrors, "titleTypeId")}
            />
            <SelectField
              name="propertyCategoryId"
              label="Property Category"
              defaultValue={project?.propertyCategoryId}
              options={options.propertyCategories}
              emptyLabel="No category"
              fieldError={getFieldError(fieldErrors, "propertyCategoryId")}
            />
            <SelectField
              name="propertyTypeId"
              label="Property Type"
              defaultValue={project?.propertyTypeId}
              options={options.propertyTypes}
              emptyLabel="No type"
              fieldError={getFieldError(fieldErrors, "propertyTypeId")}
            />
            <SelectField
              name="regionId"
              label="Region"
              defaultValue={project?.regionId}
              options={options.regions}
              emptyLabel="No region"
              fieldError={getFieldError(fieldErrors, "regionId")}
            />
            <ProField label="Area" errorMessage={getFieldError(fieldErrors, "areaId")}>
              <ProSelect
                name="areaId"
                defaultValue={project?.areaId ?? ""}
                emptyOptionLabel="No area"
                options={options.areas.map((area) => ({
                  value: area.id,
                  label: regionNameById.get(area.regionId)
                    ? `${area.name} (${regionNameById.get(area.regionId)})`
                    : area.name,
                }))}
                tone={getFieldError(fieldErrors, "areaId") ? "error" : project?.areaId ? "success" : "default"}
              />
            </ProField>
            <ProField
              label="Featured File"
              helperText={
                options.featuredFiles.length === 0
                  ? "No files available yet. Keep this empty until file records exist."
                  : undefined
              }
              errorMessage={getFieldError(fieldErrors, "featuredFileId")}
            >
              <ProSelect
                name="featuredFileId"
                defaultValue={project?.featuredFileId ?? ""}
                emptyOptionLabel="No featured file"
                options={options.featuredFiles.map((file) => ({ value: file.id, label: file.name }))}
                tone={
                  getFieldError(fieldErrors, "featuredFileId")
                    ? "error"
                    : project?.featuredFileId
                      ? "success"
                      : "default"
                }
              />
            </ProField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              name="address"
              label="Address"
              defaultValue={project?.address}
              placeholder="Optional project address"
              fieldError={getFieldError(fieldErrors, "address")}
            />
            <InputField
              name="landAreaAcres"
              label="Land Area (Acres)"
              defaultValue={project?.landAreaAcres}
              placeholder="0.00"
              fieldError={getFieldError(fieldErrors, "landAreaAcres")}
            />
            <InputField
              name="latitude"
              label="Latitude"
              defaultValue={project?.latitude}
              placeholder="e.g. 3.1390"
              fieldError={getFieldError(fieldErrors, "latitude")}
            />
            <InputField
              name="longitude"
              label="Longitude"
              defaultValue={project?.longitude}
              placeholder="e.g. 101.6869"
              fieldError={getFieldError(fieldErrors, "longitude")}
            />
            <InputField
              name="totalUnits"
              label="Total Units"
              defaultValue={project?.totalUnits}
              type="number"
              placeholder="0"
              fieldError={getFieldError(fieldErrors, "totalUnits")}
            />
            <InputField
              name="launchYear"
              label="Launch Year"
              defaultValue={project?.launchYear}
              type="number"
              placeholder="2026"
              fieldError={getFieldError(fieldErrors, "launchYear")}
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface-glass px-3 py-2 shadow-[var(--shadow-xs)]">
            <input type="hidden" name="isPublished" value="false" />
            <input
              id="isPublished"
              name="isPublished"
              type="checkbox"
              value="true"
              defaultChecked={project?.isPublished ?? false}
              className="size-4 rounded border border-input"
            />
            <label htmlFor="isPublished" className="text-sm font-medium">
              Publish this project
            </label>
          </div>

          {getFieldError(fieldErrors, "form") ? (
            <p className="text-xs text-destructive">{getFieldError(fieldErrors, "form")}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <ProButton type="submit" disabled={isPending} loading={isPending}>
              {isPending ? "Saving..." : mode === "create" ? "Create Project" : "Save Changes"}
            </ProButton>
            <ProButton asChild type="button" variant="outline">
              <Link href={ROUTES.admin.projects}>Cancel</Link>
            </ProButton>
          </div>
        </form>
      </div>
    </ActionCard>
  )
}
