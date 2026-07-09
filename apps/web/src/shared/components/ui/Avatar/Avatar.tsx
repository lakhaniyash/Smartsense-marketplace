import * as RadixAvatar from '@radix-ui/react-avatar'
import { cn } from '@shared/utils'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps {
  src?: string
  alt?: string
  initials: string
  size?: AvatarSize
  className?: string
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'size-6 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-10 text-base',
}

// Radix's image-load-failure detection backs the "falls back to initials...
// never a broken image icon" rule (docs/ui-guidelines.md § Icons & Images).
export function Avatar({ src, alt = '', initials, size = 'md', className }: AvatarProps) {
  return (
    <RadixAvatar.Root
      className={cn(
        // Fallback background is a recessed neutral circle; text uses the
        // secondary foreground role (closest match — no dedicated avatar token).
        'bg-surface-subtle text-fg-secondary inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium select-none',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {src !== undefined && (
        <RadixAvatar.Image className="size-full object-cover" src={src} alt={alt} />
      )}
      <RadixAvatar.Fallback delayMs={src !== undefined ? 300 : 0}>{initials}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  )
}
