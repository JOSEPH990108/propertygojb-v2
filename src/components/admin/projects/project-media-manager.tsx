"use client"

import { useActionState, useMemo, useState } from "react"

import {
  ActionCard,
  ProButton,
  ProEmptyState,
  ProField,
  ProInput,
  ProLoadingState,
  ProSelect,
  ProStatusBadge,
  ProValidationMessage,
  ProTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/pro-ui"
import type {
  AdminProjectFormOption,
  AdminProjectMediaListItem,
} from "@/lib/admin/projects/actions"
import {
  attachAdminProjectMediaAction,
  removeAdminProjectMediaAction,
} from "@/lib/admin/projects/server-actions"
import type { ProjectMediaActionState } from "@/lib/admin/projects/server-actions"

const INITIAL_PROJECT_MEDIA_ACTION_STATE: ProjectMediaActionState = {
  fieldErrors: {},
}

type ProjectMediaManagerProps = {
  projectId: string
  mediaItems: AdminProjectMediaListItem[]
  fileOptions: AdminProjectFormOption[]
  mediaTypeOptions: AdminProjectFormOption[]
}

function getFieldError(
  fieldErrors: Partial<Record<string, string>> | undefined,
  key: string,
): string | undefined {
  return fieldErrors?.[key]
}

function getScanStatusBadgeVariant(scanStatus: string | null): "success" | "error" | "pending" | "neutral" {
  if (scanStatus === "CLEAN") {
    return "success"
  }

  if (scanStatus === "INFECTED") {
    return "error"
  }

  if (scanStatus === "PENDING") {
    return "pending"
  }

  return "neutral"
}

export function ProjectMediaManager({
  projectId,
  mediaItems,
  fileOptions,
  mediaTypeOptions,
}: ProjectMediaManagerProps) {
  const [attachState, attachFormAction, isAttachPending] = useActionState(
    attachAdminProjectMediaAction,
    INITIAL_PROJECT_MEDIA_ACTION_STATE,
  )

  const [removeState, removeFormAction, isRemovePending] = useActionState(
    removeAdminProjectMediaAction,
    INITIAL_PROJECT_MEDIA_ACTION_STATE,
  )

  const [fileId, setFileId] = useState("")
  const [mediaTypeId, setMediaTypeId] = useState("")

  const isBusy = isAttachPending || isRemovePending
  const fileSelectOptions = useMemo(
    () => fileOptions.map((file) => ({ value: file.id, label: file.name })),
    [fileOptions],
  )
  const mediaTypeSelectOptions = useMemo(
    () => mediaTypeOptions.map((option) => ({ value: option.id, label: option.name })),
    [mediaTypeOptions],
  )

  return (
    <ActionCard
      title="Project Media"
      description="Link existing files to this project and manage relation records."
    >
      <div className="space-y-4">
        {isBusy ? <ProLoadingState label="Updating media relation..." /> : null}

        {attachState.message ? (
          <ProValidationMessage tone="error" message={attachState.message} />
        ) : null}

        {removeState.message ? (
          <ProValidationMessage tone="error" message={removeState.message} />
        ) : null}

        <form action={attachFormAction} className="space-y-3 rounded-2xl border border-border/70 bg-surface-glass p-4 shadow-[var(--shadow-xs)]">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="fileId" value={fileId} />
          <input type="hidden" name="mediaTypeId" value={mediaTypeId} />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ProField
              label="File"
              required
              errorMessage={getFieldError(attachState.fieldErrors, "fileId")}
            >
              <ProSelect
                value={fileId || undefined}
                onValueChange={setFileId}
                placeholder="Select file"
                options={fileSelectOptions}
                disabled={isBusy || fileOptions.length === 0}
                tone={getFieldError(attachState.fieldErrors, "fileId") ? "error" : "default"}
              />
              {fileOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No active files available. Seed or upload files before linking media.
                </p>
              ) : null}
            </ProField>

            <ProField
              label="Media Type"
              errorMessage={getFieldError(attachState.fieldErrors, "mediaTypeId")}
            >
              <ProSelect
                value={mediaTypeId || undefined}
                onValueChange={setMediaTypeId}
                placeholder="No media type"
                options={mediaTypeSelectOptions}
                disabled={isBusy}
                tone={getFieldError(attachState.fieldErrors, "mediaTypeId") ? "error" : "default"}
              />
            </ProField>

            <ProField
              label="Caption"
              errorMessage={getFieldError(attachState.fieldErrors, "caption")}
            >
              <ProInput
                id="caption"
                name="caption"
                defaultValue=""
                placeholder="Optional caption"
                tone={getFieldError(attachState.fieldErrors, "caption") ? "error" : "default"}
              />
            </ProField>

            <ProField
              label="Sort Order"
              errorMessage={getFieldError(attachState.fieldErrors, "sortOrder")}
            >
              <ProInput
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue=""
                placeholder="Auto"
                tone={getFieldError(attachState.fieldErrors, "sortOrder") ? "error" : "default"}
              />
            </ProField>
          </div>

          {getFieldError(attachState.fieldErrors, "form") ? (
            <ProValidationMessage tone="error" message={getFieldError(attachState.fieldErrors, "form") ?? "Unable to link file."} />
          ) : null}

          <div className="flex items-center justify-end">
            <ProButton type="submit" size="sm" disabled={isBusy || fileOptions.length === 0}>
              {isAttachPending ? "Linking..." : "Link File"}
            </ProButton>
          </div>
        </form>

        {mediaItems.length === 0 ? (
          <ProEmptyState
            title="No linked media"
            description="No linked media exists for this project yet. Link a file to start building the media gallery."
          />
        ) : (
          <ProTable>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Media Type</TableHead>
                <TableHead>Caption</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead>Scan</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mediaItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="max-w-[28rem] space-y-1">
                      <p className="truncate text-sm">{item.fileKey ?? item.fileId}</p>
                      {item.fileDeletedAt ? (
                        <ProStatusBadge label="File deleted" status="rejected" />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{item.mediaTypeName ?? "-"}</TableCell>
                  <TableCell>
                    <span className="max-w-[14rem] truncate block">{item.caption ?? "-"}</span>
                  </TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell>
                    <ProStatusBadge
                      label={item.fileScanStatus ?? "UNKNOWN"}
                      status={getScanStatusBadgeVariant(item.fileScanStatus)}
                    />
                  </TableCell>
                  <TableCell>
                    <ProStatusBadge label={item.fileVisibilityScope ?? "-"} status="neutral" mode="outline" />
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={removeFormAction} className="inline-flex">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="projectMediaId" value={item.id} />
                      <ProButton type="submit" size="sm" variant="danger" disabled={isBusy}>
                        {isRemovePending ? "Removing..." : "Remove"}
                      </ProButton>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ProTable>
        )}
      </div>
    </ActionCard>
  )
}
