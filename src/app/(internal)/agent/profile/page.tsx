import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Unable to load profile for the active session.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    )
  }

  return (
    <section className="internal-page max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Personal and professional account fields used across your assigned workflow modules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Role</div>
              <div className="pt-1">
                <Badge variant="outline">{profile.roleCode ?? "AGENT"}</Badge>
              </div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Phone Verification</div>
              <div className="pt-1">
                <Badge variant={profile.phoneNumberVerified ? "default" : "outline"}>
                  {profile.phoneNumberVerified ? "Verified" : "Not verified"}
                </Badge>
              </div>
            </div>
            <div className="internal-metric-tile">
              <div className="text-xs text-muted-foreground">Profile Updated</div>
              <div className="pt-1 font-medium">{formatDateTime(profile.updatedAt)}</div>
            </div>
          </div>

          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div>Email: {profile.email}</div>
            <div>Created: {formatDateTime(profile.createdAt)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>
            Save contact and professional fields used by internal assignment and reporting views.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateAgentProfileBasicsFormAction} className="space-y-4">
            <input type="hidden" name="nextPath" value={ROUTES.agent.profile} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={profile.name} required maxLength={150} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  defaultValue={profile.phoneNumber ?? ""}
                  placeholder="+60123456789"
                  maxLength={30}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  name="nationality"
                  defaultValue={profile.nationality ?? ""}
                  placeholder="Malaysian"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="renNumber">REN Number</Label>
                <Input
                  id="renNumber"
                  name="renNumber"
                  defaultValue={profile.renNumber ?? ""}
                  placeholder="REN00000"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
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
              <Button type="submit">Save Profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
