import { ActionCard, MetricCard, ProButton, ProInput, ProStatusBadge } from "@/components/pro-ui"
import { ROUTES } from "@/config/routes"
import { getAgentProfile } from "@/lib/agent/profile/actions"
import { updateAgentProfileBasicsFormAction } from "@/lib/agent/profile/server-actions"

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function AgentProfilePage() {
  const profile = await getAgentProfile({
    nextPath: ROUTES.agent.profile,
  })

  if (!profile) {
    return (
      <section className="internal-page max-w-4xl">
        <ActionCard title="Profile" description="Unable to load profile for the active session." />
      </section>
    )
  }

  return (
    <section className="internal-page max-w-4xl">
      <ActionCard
        title="Profile"
        description="Personal and professional account fields used across your assigned workflow modules."
      >
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Role" value={<ProStatusBadge label={profile.roleCode ?? "AGENT"} status="info" />} hint="Access scope" />
            <MetricCard
              label="Phone Verification"
              value={<ProStatusBadge label={profile.phoneNumberVerified ? "Verified" : "Not verified"} status={profile.phoneNumberVerified ? "success" : "neutral"} />}
              hint="Auth trust level"
              accent="green"
            />
            <MetricCard label="Profile Updated" value={formatDateTime(profile.updatedAt)} hint="Last profile write" accent="blue" />
          </div>

          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div>Email: {profile.email}</div>
            <div>Created: {formatDateTime(profile.createdAt)}</div>
          </div>
        </div>
      </ActionCard>

      <ActionCard
        title="Update Profile"
        description="Save contact and professional fields used by internal assignment and reporting views."
      >
        <div>
          <form action={updateAgentProfileBasicsFormAction} className="space-y-4">
            <input type="hidden" name="nextPath" value={ROUTES.agent.profile} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <ProInput id="name" name="name" defaultValue={profile.name} required maxLength={150} />
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</label>
                <ProInput
                  id="phoneNumber"
                  name="phoneNumber"
                  defaultValue={profile.phoneNumber ?? ""}
                  placeholder="+60123456789"
                  maxLength={30}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="nationality" className="text-sm font-medium">Nationality</label>
                <ProInput
                  id="nationality"
                  name="nationality"
                  defaultValue={profile.nationality ?? ""}
                  placeholder="Malaysian"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="renNumber" className="text-sm font-medium">REN Number</label>
                <ProInput
                  id="renNumber"
                  name="renNumber"
                  defaultValue={profile.renNumber ?? ""}
                  placeholder="REN00000"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="agencyName" className="text-sm font-medium">Agency Name</label>
                <ProInput
                  id="agencyName"
                  name="agencyName"
                  defaultValue={profile.agencyName ?? ""}
                  placeholder="Agency / Team Name"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="internal-divider flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Availability controls are deferred until dedicated appointment scheduling persistence is introduced.
              </p>
              <ProButton type="submit">Save Profile</ProButton>
            </div>
          </form>
        </div>
      </ActionCard>
    </section>
  )
}
