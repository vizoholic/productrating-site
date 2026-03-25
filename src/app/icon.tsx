// src/app/icon.tsx
// Next.js auto-generates favicon from this file — no image upload needed

import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #5B4FCF, #7C6FCD)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '-0.5px',
        }}
      >
        PR
      </div>
    ),
    { ...size }
  )
}
