"use client"

import * as React from "react"
import {
  Bell,
  Building2,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  CircleDot,
  CircleHelp,
  Home,
  LayoutDashboard,
  Mail,
  Search,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react"

const DAY_MS = 86400000
const CALENDAR_PREVIEW_DATE = new Date(2026, 0, 15)
const CALENDAR_RANGE = {
  from: new Date(2026, 0, 15),
  to: new Date(2026, 0, 15 + 3),
}
const CALENDAR_DISABLE_BEFORE = new Date(CALENDAR_PREVIEW_DATE.getTime() - DAY_MS)

import {
  ActionCard,
  EmptyStateCard,
  GlassCard,
  MetricCard,
  ProAlert,
  ProApprovalChecklist,
  ProBookingPipeline,
  ProButton,
  ProCalendar,
  ProCarousel,
  ProCheckbox,
  ProCommandPalette,
  ProCommandPreviewRow,
  ProConfirmModal,
  ProDatePicker,
  ProDrawer,
  ProDropdown,
  ProDropdownItem,
  ProEmptyState,
  ProField,
  ProFileUpload,
  ProFloatingActionButton,
  ProInput,
  ProLoadingState,
  ProMobileBottomNav,
  ProMobileCardList,
  ProMobileDrawer,
  ProModal,
  ProOtpInput,
  ProPanel,
  ProRadioGroup,
  ProRadioItem,
  ProSearchInput,
  ProSelect,
  ProSideDrawer,
  ProSidebarContainer,
  ProSidebarItem,
  ProSidebarRoleTag,
  ProSidebarSection,
  ProSidebarWorkspace,
  ProSkeleton,
  ProStatusBadge,
  ProStepper,
  ProSuccessConfirmation,
  ProSwipeActionCard,
  ProSwitch,
  ProTab,
  ProTabList,
  ProTabPanel,
  ProTable,
  ProTableActions,
  ProTableFilter,
  ProTableSearch,
  ProTableStatusBadge,
  ProTableToolbar,
  ProTabs,
  ProTextarea,
  ProToastTrigger,
  ProTooltip,
  ProValidationMessage,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/pro-ui"

const selectOptions = [
  { value: "all", label: "All Projects" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived", disabled: true },
]

const fileItems = [
  { id: "1", name: "property-floorplan.pdf", size: "2.4MB", state: "success" as const },
  { id: "2", name: "brochure-v2.pdf", size: "4.1MB", state: "uploading" as const, progress: 65 },
  { id: "3", name: "media-pack.zip", size: "11MB", state: "error" as const },
]

const commandItems = [
  { group: "Navigation", label: "Open Dashboard", shortcut: "G D", icon: LayoutDashboard },
  { group: "Navigation", label: "Open Projects", shortcut: "G P", icon: Building2 },
  { group: "Actions", label: "Create Lead", shortcut: "N L", icon: User },
  { group: "Actions", label: "Create Booking", shortcut: "N B", icon: Bell },
]

const carouselSlides = [
  {
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1000&q=80",
    title: "Cypress Villa",
    subtitle: "4 Bed | 3 Bath | Bukit Jalil",
    cta: "View Detail",
  },
  {
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1000&q=80",
    title: "Aurora Tower",
    subtitle: "2 Bed | KL City",
    cta: "Schedule Visit",
  },
  {
    image: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1000&q=80",
    title: "Lakeside Residences",
    subtitle: "Townhouse | Shah Alam",
    cta: "Explore Units",
  },
]

export function ProUiShowcase() {
  const [otp, setOtp] = React.useState("123456")
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false)
  const [selectedRow, setSelectedRow] = React.useState("sunset")
  const [dropdownValue, setDropdownValue] = React.useState("edit")
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [calendarDate, setCalendarDate] = React.useState<Date | undefined>(new Date())
  const [radioValue, setRadioValue] = React.useState("standard")
  const [switchOn, setSwitchOn] = React.useState(true)
  const [searchValue, setSearchValue] = React.useState("Sunset")

  return (
    <div className="space-y-6 pb-20">
      <ActionCard title="PropertyGoJB Pro UI Showcase" description="Internal QA board mapped to 2026 reference component boards." />

      <ActionCard title="1. Buttons" description="Matrix by variant and state.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <th className="py-2">Variant</th>
                <th className="py-2">Default</th>
                <th className="py-2">Hover</th>
                <th className="py-2">Active</th>
                <th className="py-2">Focus</th>
                <th className="py-2">Disabled</th>
                <th className="py-2">Loading</th>
              </tr>
            </thead>
            <tbody className="align-middle">
              {(["primary", "secondary", "success", "danger", "ghost"] as const).map((variant) => (
                <tr key={variant}>
                  <td className="py-2 pr-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{variant}</td>
                  <td className="py-2"><ProButton variant={variant}>{variant}</ProButton></td>
                  <td className="py-2"><ProButton variant={variant} className="brightness-105">Hover</ProButton></td>
                  <td className="py-2"><ProButton variant={variant} className="translate-y-px shadow-[var(--shadow-xs)]">Active</ProButton></td>
                  <td className="py-2"><ProButton variant={variant} className="ring-4 ring-ring/30">Focus</ProButton></td>
                  <td className="py-2"><ProButton variant={variant} disabled>Disabled</ProButton></td>
                  <td className="py-2"><ProButton variant={variant} loading>Loading</ProButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ActionCard>

      <ActionCard title="2. Inputs" description="Text/email/password/textarea matrix by state.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ProInput defaultValue="Default" />
          <ProInput defaultValue="Hover" className="hover:border-ring/35" />
          <ProInput defaultValue="Active" className="border-primary/40 bg-primary/10" />
          <ProInput defaultValue="Focus" className="border-ring bg-[#f8f7ff] ring-4 ring-ring/30" />
          <ProInput defaultValue="Disabled" disabled />
          <ProInput defaultValue="Error" tone="error" />
          <ProInput defaultValue="Success" tone="success" />
          <ProTextarea defaultValue="Textarea" />
        </div>
      </ActionCard>

      <ActionCard title="3. Search Bar" description="State matrix for search interactions.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ProSearchInput value={searchValue} onChange={(event) => setSearchValue(event.target.value)} showClearButton onClear={() => setSearchValue("")} />
          <ProSearchInput defaultValue="Hover state" className="hover:border-ring/35" />
          <ProSearchInput defaultValue="Active state" className="border-primary/40 bg-primary/10" />
          <ProSearchInput defaultValue="Focus state" className="border-ring bg-[#f8f7ff] ring-4 ring-ring/30" />
          <ProSearchInput defaultValue="Loading" loading />
          <ProSearchInput defaultValue="Disabled" disabled />
        </div>
      </ActionCard>

      <ActionCard title="4. Dropdown / Select" description="Default, hover, open, focus, disabled, selected, error, success.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <ProField label="ProSelect Default"><ProSelect options={selectOptions} value="active" onValueChange={() => undefined} /></ProField>
            <ProField label="ProSelect Focus Simulated"><ProSelect options={selectOptions} value="draft" onValueChange={() => undefined} triggerClassName="ring-4 ring-ring/30 border-ring" /></ProField>
            <ProField label="ProSelect Disabled"><ProSelect options={selectOptions} value="all" disabled /></ProField>
            <ProField label="ProSelect Error" errorMessage="Please pick one option"><ProSelect options={selectOptions} value="" tone="error" onValueChange={() => undefined} /></ProField>
            <ProField label="ProSelect Success" successMessage="Selection valid"><ProSelect options={selectOptions} value="active" tone="success" onValueChange={() => undefined} /></ProField>
          </div>
          <div className="space-y-3">
            <ProDropdown trigger={<span>Open Dropdown</span>} value={dropdownValue} onSelect={setDropdownValue}>
              <ProDropdownItem value="edit" label="Edit project" shortcut="E" icon={<Settings className="size-3.5" />} />
              <ProDropdownItem value="duplicate" label="Duplicate" shortcut="D" icon={<CircleDot className="size-3.5" />} />
              <ProDropdownItem value="delete" label="Delete" shortcut="Del" destructive icon={<CircleAlert className="size-3.5" />} />
            </ProDropdown>
            <ProDropdown trigger={<span className="text-muted-foreground">Hover Simulated</span>} className="border-ring/35 bg-[#f6f3ff]" value={dropdownValue} onSelect={setDropdownValue}>
              <ProDropdownItem value="publish" label="Publish" icon={<CheckCircle2 className="size-3.5" />} />
              <ProDropdownItem value="archive" label="Archive" icon={<CircleDashed className="size-3.5" />} />
            </ProDropdown>
          </div>
        </div>
      </ActionCard>

      <ActionCard title="5. Checkbox" description="Unchecked/checked/indeterminate/focus/hover/disabled matrix.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ProCheckbox label="Unchecked default" checked={false} />
          <ProCheckbox label="Unchecked hover" checked={false} className="rounded-lg bg-[#f6f3ff] px-2 py-1" />
          <ProCheckbox label="Unchecked focus" checked={false} className="rounded-lg ring-4 ring-ring/30 px-2 py-1" />
          <ProCheckbox label="Checked default" checked />
          <ProCheckbox label="Checked hover" checked className="rounded-lg bg-[#f3efff] px-2 py-1" />
          <ProCheckbox label="Checked focus" checked className="rounded-lg ring-4 ring-ring/30 px-2 py-1" />
          <ProCheckbox label="Indeterminate" indeterminate />
          <ProCheckbox label="Disabled unchecked" checked={false} disabled />
          <ProCheckbox label="Disabled checked" checked disabled />
        </div>
      </ActionCard>

      <ActionCard title="6. Radio Button" description="State matrix for selection and focus.">
        <div className="grid gap-4 lg:grid-cols-2">
          <ProRadioGroup value={radioValue} onValueChange={setRadioValue}>
            <ProRadioItem value="standard" label="Unselected default" />
            <ProRadioItem value="hover" label="Hover simulated" className="rounded-lg bg-[#f6f3ff] px-2 py-1" />
            <ProRadioItem value="focus" label="Focus simulated" className="rounded-lg ring-4 ring-ring/30 px-2 py-1" />
            <ProRadioItem value="selected" label="Selected" />
            <ProRadioItem value="selected-focus" label="Selected focus" className="rounded-lg ring-4 ring-ring/30 px-2 py-1" />
            <ProRadioItem value="disabled" label="Disabled" disabled />
          </ProRadioGroup>
          <div className="rounded-xl border border-border/70 bg-surface-glass p-3 text-sm text-muted-foreground">Selected value: <span className="font-semibold text-foreground">{radioValue}</span></div>
        </div>
      </ActionCard>

      <ActionCard title="7. Toggle Switch" description="Off/on/hover/focus/disabled matrix.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ProSwitch checked={false} label="Off default" />
          <ProSwitch checked={false} label="Off hover" className="rounded-lg bg-[#f6f3ff] px-2 py-1" />
          <ProSwitch checked={switchOn} onCheckedChange={setSwitchOn} label="On default" />
          <ProSwitch checked label="On hover" className="rounded-lg bg-[#f3efff] px-2 py-1" />
          <ProSwitch checked label="Focus" className="rounded-lg ring-4 ring-ring/30 px-2 py-1" />
          <ProSwitch checked={false} label="Disabled off" disabled />
          <ProSwitch checked label="Disabled on" disabled />
        </div>
      </ActionCard>

      <ActionCard title="8. Tabs" description="Pill and underline variants, with icon and disabled tab.">
        <div className="grid gap-4 xl:grid-cols-2">
          <ProTabs defaultValue="overview" className="gap-3">
            <ProTabList variant="default">
              <ProTab value="overview" label="Overview" icon={LayoutDashboard} />
              <ProTab value="team" label="Team" icon={Users} />
              <ProTab value="settings" label="Settings" icon={Settings} />
              <ProTab value="disabled" label="Disabled" disabled />
            </ProTabList>
            <ProTabPanel value="overview">Pill variant active tab content.</ProTabPanel>
            <ProTabPanel value="team">Team tab panel content.</ProTabPanel>
            <ProTabPanel value="settings">Settings tab panel content.</ProTabPanel>
            <ProTabPanel value="disabled">Disabled tab content.</ProTabPanel>
          </ProTabs>
          <ProTabs defaultValue="details" className="gap-3">
            <ProTabList variant="line">
              <ProTab value="details" label="Details" />
              <ProTab value="activity" label="Activity" />
              <ProTab value="billing" label="Billing" />
            </ProTabList>
            <ProTabPanel value="details">Underline variant details.</ProTabPanel>
            <ProTabPanel value="activity">Underline variant activity.</ProTabPanel>
            <ProTabPanel value="billing">Underline variant billing.</ProTabPanel>
          </ProTabs>
        </div>
      </ActionCard>

      <ActionCard title="9. Badges" description="Full status matrix.">
        <div className="flex flex-wrap gap-2">
          <ProStatusBadge label="Default" status="neutral" />
          <ProStatusBadge label="Dot" status="neutral" dot />
          <ProStatusBadge label="Icon" status="info" icon={<CircleHelp className="size-3.5" />} />
          <ProStatusBadge label="Count" status="purple" count={12} />
          <ProStatusBadge label="Soft" status="success" mode="soft" />
          <ProStatusBadge label="Outline" status="success" mode="outline" />
          <ProStatusBadge label="Success" status="success" />
          <ProStatusBadge label="Warning" status="warning" />
          <ProStatusBadge label="Error" status="error" />
          <ProStatusBadge label="Info" status="info" />
          <ProStatusBadge label="Neutral" status="neutral" />
          <ProStatusBadge label="Published" status="published" />
          <ProStatusBadge label="Draft" status="draft" />
          <ProStatusBadge label="Pending" status="pending" />
          <ProStatusBadge label="Reserved" status="reserved" />
          <ProStatusBadge label="Sold" status="sold" />
          <ProStatusBadge label="Rejected" status="rejected" />
        </div>
      </ActionCard>

      <ActionCard title="10. Tooltip" description="Top, bottom, left, right, icon and disabled-target wrappers.">
        <div className="flex flex-wrap items-center gap-3">
          <ProTooltip content="Top tooltip" side="top"><ProButton variant="outline" size="sm">Top</ProButton></ProTooltip>
          <ProTooltip content="Bottom tooltip" side="bottom"><ProButton variant="outline" size="sm">Bottom</ProButton></ProTooltip>
          <ProTooltip content="Left tooltip" side="left"><ProButton variant="outline" size="sm">Left</ProButton></ProTooltip>
          <ProTooltip content="Right tooltip" side="right"><ProButton variant="outline" size="sm">Right</ProButton></ProTooltip>
          <ProTooltip content="Icon helper" side="top"><span className="grid size-9 place-content-center rounded-xl border border-border/70 bg-surface-glass"><CircleHelp className="size-4" /></span></ProTooltip>
          <ProTooltip content="Disabled action info" side="top"><span><ProButton variant="secondary" size="sm" disabled>Disabled target</ProButton></span></ProTooltip>
        </div>
      </ActionCard>

      <ActionCard title="11. Toast / Alerts" description="Toast triggers + semantic alerts.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <ProToastTrigger tone="success" message="Saved" description="Project has been updated">Success Toast</ProToastTrigger>
            <ProToastTrigger tone="error" message="Error" description="Action failed">Error Toast</ProToastTrigger>
            <ProToastTrigger tone="warning" message="Warning" description="Please review fields">Warning Toast</ProToastTrigger>
            <ProToastTrigger tone="info" message="Info" description="New release available">Info Toast</ProToastTrigger>
            <ProToastTrigger tone="loading" message="Loading" description="Sync in progress">Loading Toast</ProToastTrigger>
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            <ProAlert tone="success" title="Project saved" description="Changes have been published." />
            <ProAlert tone="warning" title="Review required" description="One section is incomplete." />
            <ProAlert tone="error" title="Upload failed" description="Try uploading again." />
            <ProAlert tone="info" title="Heads up" description="Deployment starts in 5 minutes." />
          </div>
        </div>
      </ActionCard>

      <ActionCard title="12. Cards / Metrics" description="Glass cards and metric tiles.">
        <div className="grid gap-4 xl:grid-cols-3">
          <MetricCard label="Active Projects" value="128" hint="+12 this month" />
          <MetricCard label="Reservations" value="36" accent="blue" hint="8 in progress" />
          <MetricCard label="Completed Sales" value="19" accent="green" hint="Conversion 52%" />
        </div>
      </ActionCard>

      <ActionCard title="13. Data Table" description="Toolbar, badges, selected rows, actions.">
        <div className="space-y-3">
          <ProTableToolbar>
            <ProTableSearch defaultValue="Sunset" />
            <ProTableFilter>Filters</ProTableFilter>
          </ProTableToolbar>
          <ProTable>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Publish</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow data-state={selectedRow === "sunset" ? "selected" : undefined} onClick={() => setSelectedRow("sunset")} className="cursor-pointer">
                <TableCell>Sunset Ville</TableCell>
                <TableCell><ProTableStatusBadge status="Active" /></TableCell>
                <TableCell><ProTableStatusBadge status="Published" /></TableCell>
                <TableCell>Kuala Lumpur</TableCell>
                <TableCell><ProTableActions actions={[{ label: "Edit" }, { label: "View" }]} /></TableCell>
              </TableRow>
              <TableRow data-state={selectedRow === "vista" ? "selected" : undefined} onClick={() => setSelectedRow("vista")} className="cursor-pointer">
                <TableCell>Vista Tower</TableCell>
                <TableCell><ProTableStatusBadge status="Pending" /></TableCell>
                <TableCell><ProTableStatusBadge status="Draft" /></TableCell>
                <TableCell>Selangor</TableCell>
                <TableCell><ProTableActions actions={[{ label: "Edit" }, { label: "View" }]} /></TableCell>
              </TableRow>
            </TableBody>
          </ProTable>
        </div>
      </ActionCard>

      <ActionCard title="14. Modal" description="Default, danger confirm, success, and loading action.">
        <div className="flex flex-wrap gap-2">
          <ProModal trigger={<ProButton variant="outline">Default Modal</ProButton>} title="Invite Team Member" description="Send invitation by email" footer={<><ProButton variant="outline">Cancel</ProButton><ProButton>Send Invite</ProButton></>}>
            <ProInput type="email" placeholder="name@company.com" leftIcon={<Mail className="size-4" />} />
          </ProModal>
          <ProConfirmModal trigger={<ProButton variant="danger">Danger Confirm</ProButton>} title="Delete Project" description="This action cannot be undone." tone="danger" />
          <ProConfirmModal trigger={<ProButton variant="success">Success Modal</ProButton>} title="Publish Project" description="Project will be visible publicly." tone="success" />
          <ProConfirmModal trigger={<ProButton variant="secondary">Loading Action</ProButton>} title="Sync Project" description="Please wait while syncing." tone="success" loading />
        </div>
      </ActionCard>

      <ActionCard title="15. Side Drawer" description="Right drawer with loading/success/form layouts.">
        <div className="flex flex-wrap gap-2">
          <ProDrawer trigger={<ProButton variant="outline">Open Drawer</ProButton>} title="Project Drawer" description="Default right-side panel" footer={<><ProButton variant="outline">Cancel</ProButton><ProButton>Save</ProButton></>}>
            <div className="space-y-3 py-3"><ProInput placeholder="Project Name" /><ProInput placeholder="Developer" /><ProTextarea placeholder="Notes" /></div>
          </ProDrawer>
          <ProSideDrawer trigger={<ProButton variant="secondary">Loading Drawer</ProButton>} state="loading" />
          <ProSideDrawer trigger={<ProButton variant="success">Success Drawer</ProButton>} state="success" />
        </div>
      </ActionCard>

      <ActionCard title="16. Command Palette" description="Search, grouped suggestions, shortcuts, selected row and empty state.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <ProButton variant="outline" onClick={() => setCommandOpen(true)}>Open Command Palette</ProButton>
            <ProButton variant="ghost" onClick={() => setCommandOpen(true)} leftIcon={<Search className="size-4" />}>Search Command</ProButton>
          </div>
          <div className="grid gap-2 rounded-xl border border-border/70 bg-surface-glass p-3 md:grid-cols-2">
            <ProCommandPreviewRow title="Open Dashboard" shortcut="G D" selected />
            <ProCommandPreviewRow title="Create Booking" shortcut="N B" />
            <ProCommandPreviewRow title="View Customers" shortcut="G C" />
            <ProCommandPreviewRow title="No result preview" shortcut="--" />
          </div>
          <ProCommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={commandItems} />
        </div>
      </ActionCard>

      <ActionCard title="17. Calendar Date Picker" description="Default, selected, range, disabled date, error state.">
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Click the center month-year title (for example, June 2026) to switch into month picker mode (Jan-Dec), then choose a month to return to the date grid.</p>
            <ProDatePicker value={calendarDate} onChange={setCalendarDate} />
            <ProDatePicker value={undefined} onChange={() => undefined} tone="error" />
          </div>
          <div className="space-y-3">
            <ProCalendar selected={CALENDAR_PREVIEW_DATE} onSelect={() => undefined} />
            <ProCalendar mode="range" selected={CALENDAR_RANGE} onSelect={() => undefined} disabled={(date) => date < CALENDAR_DISABLE_BEFORE} />
          </div>
        </div>
      </ActionCard>

      <ActionCard title="18. Carousel" description="Property cards with arrows, dots, active slide and CTA."><ProCarousel slides={carouselSlides} /></ActionCard>

      <ActionCard title="19. Sidebar States" description="Expanded, active indicator, icon bubble, badge, workspace/profile, collapsed, mobile drawer.">
        <div className="grid gap-4 xl:grid-cols-2">
          <ProSidebarContainer>
            <div className="space-y-3">
              <ProSidebarWorkspace name="Admin Portal" plan="Premium Plan" />
              <ProSidebarRoleTag role="Admin" />
              <ProSidebarSection title="Main">
                <ProSidebarItem href="#" label="Dashboard" icon={<LayoutDashboard className="size-4" />} active />
                <ProSidebarItem href="#" label="Projects" icon={<Building2 className="size-4" />} badge={12} />
                <ProSidebarItem href="#" label="Leads" icon={<Users className="size-4" />} />
                <ProSidebarItem href="#" label="Settings" icon={<Settings className="size-4" />} disabled />
              </ProSidebarSection>
              <div className="rounded-xl border border-border/70 bg-surface-glass px-3 py-2"><p className="text-sm font-semibold text-foreground">Michael Anderson</p><p className="text-xs text-muted-foreground">Admin</p></div>
            </div>
          </ProSidebarContainer>
          <div className="space-y-3">
            <ProPanel className="flex items-center justify-center gap-2">
              <span className="grid size-11 place-content-center rounded-xl border border-border/70 bg-surface-glass"><Home className="size-4" /></span>
              <span className="grid size-11 place-content-center rounded-xl border border-primary/25 bg-primary/12 text-primary"><Building2 className="size-4" /></span>
              <span className="grid size-11 place-content-center rounded-xl border border-border/70 bg-surface-glass"><Users className="size-4" /></span>
            </ProPanel>
            <ProButton variant="outline" onClick={() => setMobileDrawerOpen(true)}>Open Mobile Drawer</ProButton>
          </div>
        </div>
      </ActionCard>

      <ActionCard title="20. Workflow" description="Stepper matrix, upload, OTP, checklist, pipeline, validation, success confirmation.">
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <ProField label="Horizontal Stepper"><ProStepper steps={[{ label: "Default", state: "default" }, { label: "Active", state: "active" }, { label: "Completed", state: "completed" }, { label: "Error", state: "error" }, { label: "Disabled", state: "disabled" }]} /></ProField>
              <ProField label="Vertical Stepper"><ProStepper orientation="vertical" steps={[{ label: "Details", state: "completed" }, { label: "Verification", state: "active" }, { label: "Publish", state: "default" }, { label: "Archive", state: "disabled" }]} /></ProField>
            </div>
            <ProFileUpload files={fileItems} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ProField label="OTP Code"><ProOtpInput value={otp} onChange={setOtp} /></ProField>
            <ProApprovalChecklist items={[{ id: "1", label: "Property documents", checked: true }, { id: "2", label: "Owner verification", checked: true }, { id: "3", label: "Final approval", checked: false }]} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ProBookingPipeline steps={[{ label: "Booking Initiated", state: "completed", date: "May 12, 10:30 AM" }, { label: "Payment Confirmed", state: "active", date: "May 12, 11:45 AM" }, { label: "Project Reserved", state: "default" }]} />
            <div className="space-y-3">
              <ProValidationMessage tone="info" message="Info message with soft blue style." />
              <ProValidationMessage tone="error" message="Validation failed for one field." />
              <ProSuccessConfirmation title="Booking Confirmed" description="Your booking was submitted successfully." />
            </div>
          </div>
        </div>
      </ActionCard>

      <ActionCard title="21. Mobile Components" description="Bottom nav, drawer, cards, swipe states, FAB states.">
        <div className="rounded-3xl border border-border/70 bg-surface-glass p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Mobile Preview</p>
          <div className="relative mx-auto h-[360px] max-w-[340px] overflow-hidden rounded-2xl border border-border/70 bg-background/70 p-3">
            <ProMobileCardList>
              <div className="rounded-2xl border border-border/70 bg-surface-glass p-3"><p className="text-sm font-semibold">Modern Villa</p><p className="text-xs text-muted-foreground">$1,850,000</p></div>
              <ProSwipeActionCard title="Default" subtitle="Swipe actions" state="default" leftAction={<span className="rounded-lg bg-destructive-soft px-2 py-1 text-[10px] text-destructive">Delete</span>} rightAction={<span className="rounded-lg bg-success-soft px-2 py-1 text-[10px] text-success-foreground">Save</span>} />
              <ProSwipeActionCard title="Swipe Left" subtitle="Delete path" state="swipe-left" leftAction={<span className="rounded-lg bg-destructive-soft px-2 py-1 text-[10px] text-destructive">Delete</span>} />
              <ProSwipeActionCard title="Swipe Right" subtitle="Save path" state="swipe-right" rightAction={<span className="rounded-lg bg-success-soft px-2 py-1 text-[10px] text-success-foreground">Save</span>} />
              <ProSwipeActionCard title="Completed" subtitle="Action done" state="completed" />
            </ProMobileCardList>
            <ProMobileBottomNav activeHref="#projects" items={[{ href: "#home", label: "Home", icon: <Home className="size-4" /> }, { href: "#projects", label: "Projects", icon: <Building2 className="size-4" />, badge: 3 }, { href: "#leads", label: "Leads", icon: <Users className="size-4" /> }, { href: "#alerts", label: "Alerts", icon: <Bell className="size-4" />, badge: 5 }]} />
            <ProFloatingActionButton />
          </div>
        </div>
      </ActionCard>

      <ActionCard title="22. Empty / Loading Helpers" description="Skeleton, loading states, empty states.">
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <ProLoadingState label="Syncing data..." />
            <ProSkeleton className="h-10 w-full" />
            <ProSkeleton className="h-20 w-full" />
            <ProEmptyState title="No leads yet" description="Create your first campaign to capture leads." action={<ProButton size="sm">Create lead</ProButton>} />
          </div>
          <GlassCard className="space-y-3">
            <h3 className="text-lg font-semibold">Fallback Cards</h3>
            <EmptyStateCard title="No files uploaded" description="Upload brochure or gallery assets to continue." icon={<Bell className="size-5" />} action={<ProButton size="sm" variant="outline">Upload</ProButton>} />
            <div className="grid gap-2 sm:grid-cols-2"><MetricCard label="Pending" value="08" accent="amber" /><MetricCard label="Verified" value="24" accent="green" /></div>
          </GlassCard>
        </div>
      </ActionCard>

      <ProMobileDrawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <div className="space-y-3">
          <ProSidebarWorkspace name="Mobile Workspace" plan="Premium" />
          <ProSidebarSection title="Main">
            <ProSidebarItem href="#" label="Dashboard" icon={<LayoutDashboard className="size-4" />} active />
            <ProSidebarItem href="#" label="Projects" icon={<Building2 className="size-4" />} />
            <ProSidebarItem href="#" label="Customers" icon={<Users className="size-4" />} />
            <ProSidebarItem href="#" label="Security" icon={<Shield className="size-4" />} />
          </ProSidebarSection>
        </div>
      </ProMobileDrawer>
    </div>
  )
}
