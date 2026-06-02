import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SignOutButton } from "@/components/auth/sign-out-button"

export default function AdminDashboardPage() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
      <div className="flex md:col-span-3 md:justify-end">
        <SignOutButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Initial workspace shell for administrators.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operations Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Metrics widgets will be connected in later feature work.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action Center</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Queue and workflows are reserved for future implementation.
        </CardContent>
      </Card>
    </section>
  )
}
