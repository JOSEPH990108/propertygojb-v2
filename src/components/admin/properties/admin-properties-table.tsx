import {
  ProStatusBadge,
  ProTable,
  ProTableEmptyState,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/pro-ui"
import type { AdminPropertyListItem } from "@/lib/admin/properties/actions"

type AdminPropertiesTableProps = {
  properties: AdminPropertyListItem[]
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatMoney(value: string | null): string {
  if (!value) {
    return "-"
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return value
  }

  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(parsed)
}

function renderTowerMeta(property: AdminPropertyListItem): string {
  const items = [property.layoutName, property.phaseName, property.towerName].filter(Boolean)
  return items.length > 0 ? items.join(" / ") : "-"
}

export function AdminPropertiesTable({ properties }: AdminPropertiesTableProps) {
  if (properties.length === 0) {
    return <ProTableEmptyState title="No properties found" description="Try widening your filters." />
  }

  return (
    <ProTable>
      <TableHeader>
        <TableRow>
          <TableHead>Unit</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Booking</TableHead>
          <TableHead>Lot Type</TableHead>
          <TableHead>Layout / Phase / Tower</TableHead>
          <TableHead>Floor / Stack</TableHead>
          <TableHead>Base Price</TableHead>
          <TableHead>Final Price</TableHead>
          <TableHead>Built-up (sqft)</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map((property) => (
          <TableRow key={property.id}>
            <TableCell className="font-medium">{property.unitNo}</TableCell>
            <TableCell>{property.projectName ?? "-"}</TableCell>
            <TableCell>
              <ProStatusBadge label={property.bookingStatusName ?? property.bookingStatusCode ?? "-"} status="pending" />
            </TableCell>
            <TableCell>{property.lotTypeName ?? property.lotTypeCode ?? "-"}</TableCell>
            <TableCell>{renderTowerMeta(property)}</TableCell>
            <TableCell>
              {property.floor ?? "-"} / {property.stack ?? "-"}
            </TableCell>
            <TableCell>{formatMoney(property.basePrice)}</TableCell>
            <TableCell>{formatMoney(property.finalPrice)}</TableCell>
            <TableCell>{property.builtUpSqft ?? "-"}</TableCell>
            <TableCell>{formatDateTime(property.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </ProTable>
  )
}
