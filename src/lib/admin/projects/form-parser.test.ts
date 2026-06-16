import { describe, expect, it } from "vitest"

import {
  buildAttachProjectMediaInputFromFormData,
  buildProjectMutationInputFromFormData,
  buildRemoveProjectMediaInputFromFormData,
} from "@/lib/admin/projects/form-parser"

describe("buildProjectMutationInputFromFormData", () => {
  it("maps project fields and uses latest checkbox value", () => {
    const formData = new FormData()
    formData.set("projectId", "proj-1")
    formData.set("name", "Project Alpha")
    formData.set("slug", "project-alpha")
    formData.set("featuredFileId", "file-1")
    formData.set("totalUnits", "120")
    formData.set("launchYear", "2027")
    formData.append("isPublished", "on")
    formData.append("isPublished", "off")

    const result = buildProjectMutationInputFromFormData(formData)

    expect(result).toMatchObject({
      projectId: "proj-1",
      name: "Project Alpha",
      slug: "project-alpha",
      featuredFileId: "file-1",
      totalUnits: "120",
      launchYear: "2027",
      isPublished: false,
    })
  })

  it("parses boolean variants and unknown values safely", () => {
    const trueData = new FormData()
    trueData.set("isPublished", "1")
    expect(buildProjectMutationInputFromFormData(trueData).isPublished).toBe(true)

    const falseData = new FormData()
    falseData.set("isPublished", "0")
    expect(buildProjectMutationInputFromFormData(falseData).isPublished).toBe(false)

    const invalidData = new FormData()
    invalidData.set("isPublished", "not-bool")
    expect(buildProjectMutationInputFromFormData(invalidData).isPublished).toBeUndefined()
  })

  it("ignores non-string FormData values for text fields", () => {
    const formData = new FormData()
    formData.set("name", new Blob(["abc"]), "name.txt")

    const result = buildProjectMutationInputFromFormData(formData)

    expect(result.name).toBeUndefined()
  })
})

describe("project media FormData parsers", () => {
  it("builds attach media input payload", () => {
    const formData = new FormData()
    formData.set("projectId", "proj-1")
    formData.set("fileId", "file-1")
    formData.set("mediaTypeId", "media-1")
    formData.set("caption", "Hero image")
    formData.set("sortOrder", "3")

    expect(buildAttachProjectMediaInputFromFormData(formData)).toEqual({
      projectId: "proj-1",
      fileId: "file-1",
      mediaTypeId: "media-1",
      caption: "Hero image",
      sortOrder: "3",
    })
  })

  it("builds remove media input payload", () => {
    const formData = new FormData()
    formData.set("projectId", "proj-1")
    formData.set("projectMediaId", "pm-1")

    expect(buildRemoveProjectMediaInputFromFormData(formData)).toEqual({
      projectId: "proj-1",
      projectMediaId: "pm-1",
    })
  })
})
