import { useId } from 'react'

export default function Logo({ className = 'h-9 w-9' }) {
  const gid = useId().replace(/:/g, '')

  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`logo-g-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8dfe7" />
          <stop offset="0.5" stopColor="#8b97a6" />
          <stop offset="1" stopColor="#39424d" />
        </linearGradient>
      </defs>

      <path
        d="M24 2 L42 8 V24 C42 36 34 43.5 24 47 C14 43.5 6 36 6 24 V8 Z"
        fill={`url(#logo-g-${gid})`}
        stroke="#2b333d"
        strokeWidth="1.5"
      />

      <circle cx="24" cy="25.5" r="8.4" fill="#f1f5f9" stroke="#eef2f6" strokeWidth="0.75" />

      <path d="M24 21.9 L28.38 25.08 L26.7 30.22 L21.3 30.22 L19.62 25.08 Z" fill="#14171c" />
      <path
        d="M24 18.3 L24 21.9 M31.8 23.97 L28.38 25.08 M28.82 33.13 L26.7 30.22 M19.18 33.13 L21.3 30.22 M16.2 23.97 L19.62 25.08"
        stroke="#14171c"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  )
}