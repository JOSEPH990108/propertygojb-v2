"use client"

import { useActionState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

function getScanStatusBadgeVariant(scanStatus: string | null): "secondary" | "outline" {
  if (scanStatus === "CLEAN") {
    return "secondary"
  }

  return "outline"
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

  const isBusy = isAttachPending || isRemovePending

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Media</CardTitle>
        <CardDescription>
          Link existing files to this project and manage relation records.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {attachState.message ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {attachState.message}
          </div>
        ) : null}

        {removeState.message ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {removeState.message}
          </div>
        ) : null}

        <form action={attachFormAction} className="space-y-3 rounded-lg border p-3">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <label htmlFor="fileId" className="text-sm font-medium">
                File <span className="text-destructive">*</span>
              </label>
              <select
                id="fileId"
                name="fileId"
                defaultValue=""
                className="internal-form-select"
                aria-invalid={getFieldError(attachState.fieldErrors, "fileId") ? true : undefined}
              >
                <option value="">Select file</option>
                {fileOptions.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
              {fileOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No active files available. Seed or upload files before linking media.
                </p>
              ) : null}
              {getFieldError(attachState.fieldErrors, "fileId") ? (
                <p className="text-xs text-destructive">{getFieldError(attachState.fieldErrors, "fileId")}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="mediaTypeId" className="text-sm font-medium">
                Media Type
              </label>
              <select
                id="mediaTypeId"
                name="mediaTypeId"
                defaultValue=""
                className="internal-form-select"
                aria-invalid={getFieldError(attachState.fieldErrors, "mediaTypeId") ? true : undefined}
              >
                <option value="">No media type</option>
                {mediaTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              {getFieldError(attachState.fieldErrors, "mediaTypeId") ? (
                <p className="text-xs text-destructive">{getFieldError(attachState.fieldErrors, "mediaTypeId")}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="caption" className="text-sm font-medium">
                Caption
              </label>
              <Input
                id="caption"
                name="caption"
                defaultValue=""
                placeholder="Optional caption"
                aria-invalid={getFieldError(attachState.fieldErrors, "caption") ? true : undefined}
              />
              {getFieldError(attachState.fieldErrors, "caption") ? (
                <p className="text-xs text-destructive">{getFieldError(attachState.fieldErrors, "caption")}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="sortOrder" className="text-sm font-medium">
                Sort Order
              </label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue=""
                placeholder="Auto"
                aria-invalid={getFieldError(attachState.fieldErrors, "sortOrder") ? true : undefined}
              />
              {getFieldError(attachState.fieldErrors, "sortOrder") ? (
                <p className="text-xs text-destructive">{getFieldError(attachState.fieldErrors, "sortOrder")}</p>
              ) : null}
            </div>
          </div>

          {getFieldError(attachState.fieldErrors, "form") ? (
            <p className="text-xs text-destructive">{getFieldError(attachState.fieldErrors, "form")}</p>
          ) : null}

          <div className="flex items-center justify-end">
            <Button type="submit" size="sm" disabled={isBusy || fileOptions.length === 0}>
              {isAttachPending ? "Linking..." : "Link File"}
            </Button>
          </div>
        </form>

        {mediaItems.length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            No linked media yet for this project.
          </div>
        ) : (
          <Table>
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
                        <Badge variant="destructive">File deleted</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{item.mediaTypeName ?? "-"}</TableCell>
                  <TableCell>
                    <span className="max-w-[14rem] truncate block">{item.caption ?? "-"}</span>
                  </TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={getScanStatusBadgeVariant(item.fileScanStatus)}>
                      {item.fileScanStatus ?? "UNKNOWN"}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.fileVisibilityScope ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <form action={removeFormAction} className="inline-flex">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="projectMediaId" value={item.id} />
                      <Button type="submit" size="sm" variant="destructive" disabled={isBusy}>
                        {isRemovePending ? "Removing..." : "Remove"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
