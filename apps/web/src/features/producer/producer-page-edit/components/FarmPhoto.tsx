import { useState } from 'react'
import { ImageOff, ImagePlus } from 'lucide-react'
import { cn } from '@/components/ui/utils'

interface FarmPhotoProps {
  src: string
  alt: string
  className?: string
  emptyLabel?: string
}

export function FarmPhoto({
  src,
  alt,
  className,
  emptyLabel = 'No photo yet',
}: FarmPhotoProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = failedSrc === src

  if (!src) {
    return (
      <div
        className={cn('flex aspect-video w-full flex-col items-center justify-center gap-2 bg-wash p-4 text-center text-sm text-dim', className)}
      >
        <ImagePlus size={24} aria-hidden="true" />
        <span>{emptyLabel}</span>
      </div>
    )
  }

  if (failed) {
    return (
      <div
        role="status"
        className={cn('flex aspect-video w-full flex-col items-center justify-center gap-2 bg-wash p-4 text-center text-sm text-dim', className)}
      >
        <ImageOff size={24} aria-hidden="true" />
        <span>This image could not be loaded. Check the URL.</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={cn('block aspect-video w-full object-cover', className)}
    />
  )
}
