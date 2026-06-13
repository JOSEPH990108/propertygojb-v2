import { describe, expect, it } from "vitest"

import { validateProjectMutationInput } from "@/lib/admin/projects/validation"

describe("validateProjectMutationInput", () => {
  it("normalizes required create payload and applies defaults", () => {
    const result = validateProjectMutationInput(
      {
        name: "  Riverside Residences  ",
        developerId: "  dev-1  ",
        projectStatusId: " status-1 ",
        tenureTypeId: " tenure-1 ",
      },
      "create",
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.payload).toMatchObject({
      name: "Riverside Residences",
      slug: "riverside-residences",
      developerId: "dev-1",
      projectStatusId: "status-1",
      tenureTypeId: "tenure-1",
      totalUnits: 0,
      isPublished: false,
    })
  })

  it("normalizes optional fields including featuredFileId and nullable text", () => {
    const result = validateProjectMutationInput(
      {
        name: "Project X",
        developerId: "dev-1",
        projectStatusId: "status-1",
        tenureTypeId: "tenure-1",
        propertyCategoryId: "",
        featuredFileId: " file-123 ",
        displayName: "   ",
        description: "  Sample description  ",
        landAreaAcres: "",
        latitude: "",
        longitude: "",
        isPublished: "true",
      },
      "create",
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.payload).toMatchObject({
      propertyCategoryId: null,
      featuredFileId: "file-123",
      displayName: null,
      description: "Sample description",
      landAreaAcres: null,
      latitude: null,
      longitude: null,
      isPublished: true,
    })
  })

  it("returns field errors for invalid create input", () => {
    const result = validateProjectMutationInput(
      {
        name: " ",
        developerId: "",
        projectStatusId: "",
        tenureTypeId: "",
        totalUnits: "1.5",
        launchYear: "not-a-year",
        landAreaAcres: "-1",
        latitude: "100",
        longitude: "-190",
      },
      "create",
    )

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }

    expect(result.fieldErrors).toMatchObject({
      name: "Project name is required.",
      developerId: "developerId is required.",
      projectStatusId: "projectStatusId is required.",
      tenureTypeId: "tenureTypeId is required.",
      totalUnits: "Total units must be an integer.",
      launchYear: "Launch year must be an integer.",
      landAreaAcres: "Land area must be 0 or greater.",
      latitude: "Latitude must be between -90 and 90.",
      longitude: "Longitude must be between -180 and 180.",
    })
  })

  it("requires projectId and at least one update field in update mode", () => {
    const missingProjectId = validateProjectMutationInput(
      {
        name: "Renamed",
      },
      "update",
    )

    expect(missingProjectId.ok).toBe(false)
    if (!missingProjectId.ok) {
      expect(missingProjectId.fieldErrors.projectId).toBe("Project id is required.")
    }

    const noUpdateFields = validateProjectMutationInput(
      {
        projectId: "proj-1",
      },
      "update",
    )

    expect(noUpdateFields.ok).toBe(false)
    if (!noUpdateFields.ok) {
      expect(noUpdateFields.fieldErrors.form).toBe("Provide at least one field to update.")
    }
  })

  it("normalizes update payload values", () => {
    const result = validateProjectMutationInput(
      {
        projectId: " proj-1 ",
        slug: "  New Project Name  ",
        featuredFileId: "",
        totalUnits: "25",
        launchYear: "",
        isPublished: "false",
        latitude: "3.139",
        longitude: "101.6869",
      },
      "update",
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.payload).toMatchObject({
      projectId: "proj-1",
      slug: "new-project-name",
      featuredFileId: null,
      totalUnits: 25,
      launchYear: null,
      isPublished: false,
      latitude: "3.139",
      longitude: "101.6869",
    })
  })
})
