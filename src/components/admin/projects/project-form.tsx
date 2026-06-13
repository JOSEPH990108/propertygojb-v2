"use client"

import Link from "next/link"
import { useActionState, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        aria-invalid={fieldError ? true : undefined}
      />
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      {fieldError ? <p className="text-xs text-destructive">{fieldError}</p> : null}
    </div>
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
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="internal-form-select"
        aria-invalid={fieldError ? true : undefined}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      {fieldError ? <p className="text-xs text-destructive">{fieldError}</p> : null}
    </div>
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          {mode === "edit" ? <input type="hidden" name="projectId" value={project?.id ?? ""} /> : null}

          {state.message ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </div>
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

          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project?.description ?? ""}
              placeholder="Internal project description"
              aria-invalid={getFieldError(fieldErrors, "description") ? true : undefined}
            />
            {getFieldError(fieldErrors, "description") ? (
              <p className="text-xs text-destructive">{getFieldError(fieldErrors, "description")}</p>
            ) : null}
          </div>

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
            <div className="space-y-1">
              <label htmlFor="areaId" className="text-sm font-medium">
                Area
              </label>
              <select
                id="areaId"
                name="areaId"
                defaultValue={project?.areaId ?? ""}
                className="internal-form-select"
                aria-invalid={getFieldError(fieldErrors, "areaId") ? true : undefined}
              >
                <option value="">No area</option>
                {options.areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                    {regionNameById.get(area.regionId) ? ` (${regionNameById.get(area.regionId)})` : ""}
                  </option>
                ))}
              </select>
              {getFieldError(fieldErrors, "areaId") ? (
                <p className="text-xs text-destructive">{getFieldError(fieldErrors, "areaId")}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label htmlFor="featuredFileId" className="text-sm font-medium">
                Featured File
              </label>
              <select
                id="featuredFileId"
                name="featuredFileId"
                defaultValue={project?.featuredFileId ?? ""}
                className="internal-form-select"
                aria-invalid={getFieldError(fieldErrors, "featuredFileId") ? true : undefined}
              >
                <option value="">No featured file</option>
                {options.featuredFiles.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
              {options.featuredFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No files available yet. Keep this empty until file records exist.
                </p>
              ) : null}
              {getFieldError(fieldErrors, "featuredFileId") ? (
                <p className="text-xs text-destructive">{getFieldError(fieldErrors, "featuredFileId")}</p>
              ) : null}
            </div>
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

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : mode === "create" ? "Create Project" : "Save Changes"}
            </Button>
            <Button asChild type="button" variant="outline" disabled={isPending}>
              <Link href={ROUTES.admin.projects}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
