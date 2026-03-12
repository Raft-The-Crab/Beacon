import * as Popover from '@radix-ui/react-popover'
import { Pipette } from 'lucide-react'
import { cn } from '../../lib/cn'

const PRESET_COLORS = [
  '#5865f2', '#3ba55d', '#f0b232', '#ed4245', '#eb459e', '#00b0f4',
  '#2b2d31', '#99aab5', '#faa61a', '#43b581', '#7289da', '#ff73fa',
]

interface RoleColorPickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function RoleColorPicker({ value, onChange, className }: RoleColorPickerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 p-1 transition hover:scale-[1.03] hover:border-white/35"
            aria-label="Pick role color"
            title="Pick role color"
          >
            <span
              className="h-full w-full rounded-lg border border-black/20"
              style={{ backgroundColor: value }}
            />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            className="[z-[200] w-64 rounded-2xl border border-white/15 bg-zinc-950/95 p-3 text-zinc-100 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <Pipette size={14} />
              Role Color
            </div>

            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'h-8 w-8 rounded-lg border transition hover:scale-105',
                    value.toLowerCase() === color.toLowerCase()
                      ? 'border-white ring-2 ring-indigo-400/70'
                      : 'border-white/20',
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onChange(color)}
                  aria-label={`Set color ${color}`}
                />
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
                className="h-9 w-10 cursor-pointer rounded-lg border border-white/20 bg-transparent"
                aria-label="Custom role color"
              />
              <input
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
                className="h-9 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-indigo-400"
                placeholder="#5865f2"
              />
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
