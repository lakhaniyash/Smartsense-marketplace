import { ExportIcon } from '@shared/icons'
import { Button } from '../Button'
import { Menu, MenuItem } from '../Menu'

export type ExportFormat = 'csv' | 'excel'

export interface ExportMenuProps {
  onExport: (format: ExportFormat) => void | Promise<void>
  isExporting?: boolean
  // Default matches the plan's export foundation: CSV is fully implemented
  // today, Excel is a visible, disabled option rather than silently missing,
  // so flipping it on later (once a real implementation lands) is a one-line
  // change to this default, not a new UI.
  disabledFormats?: ExportFormat[]
}

const FORMAT_LABEL: Record<ExportFormat, string> = {
  csv: 'Export as CSV',
  excel: 'Export as Excel',
}

const DISABLED_REASON: Record<ExportFormat, string> = {
  csv: 'CSV export coming soon',
  excel: 'Excel export coming soon',
}

const FORMATS: ExportFormat[] = ['csv', 'excel']

// Pure UI shell - no GraphQL/Apollo knowledge (docs/frontend-architecture.md
// § Feature Module Architecture). It only ever calls `onExport`; the actual
// export mechanics (query + downloadBlob) live in whichever feature composes
// this.
export function ExportMenu({
  onExport,
  isExporting = false,
  disabledFormats = ['excel'],
}: ExportMenuProps) {
  return (
    <Menu
      trigger={
        <Button
          variant="secondary"
          isLoading={isExporting}
          leadingIcon={<ExportIcon className="size-4" />}
        >
          Export
        </Button>
      }
    >
      {FORMATS.map((format) => {
        const isDisabled = disabledFormats.includes(format)

        return (
          <MenuItem key={format} disabled={isDisabled} onSelect={() => void onExport(format)}>
            {isDisabled ? (
              // A disabled MenuItem must not be a silently-dead click - the
              // native `title` attribute makes the reason discoverable on
              // hover/focus without inventing a new tooltip component for it.
              <span title={DISABLED_REASON[format]}>{FORMAT_LABEL[format]}</span>
            ) : (
              FORMAT_LABEL[format]
            )}
          </MenuItem>
        )
      })}
    </Menu>
  )
}
