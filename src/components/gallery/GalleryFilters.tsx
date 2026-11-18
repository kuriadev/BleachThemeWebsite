/**
 * Shared SVG filters for the gallery, defined once per page.
 * - #gallery-ripple: living water-surface distortion on hover (SMIL-animated
 *   turbulence, so no JS runs per frame).
 * - #ink-wash: luminance → posterised ink tones with a faint warm paper cast,
 *   approximating a high-contrast manga ink print.
 */
export function GalleryFilters() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id="gallery-ripple" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="3" result="n">
          <animate attributeName="baseFrequency" dur="6s" values="0.012 0.04;0.016 0.05;0.012 0.04" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="12" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      <filter id="ink-wash" colorInterpolationFilters="sRGB">
        {/* Luminance */}
        <feColorMatrix type="matrix" values="0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0 0 0 1 0" />
        {/* Crush blacks, lift whites, then posterise into ink tones */}
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0 0 0.08 0.35 0.82 1 1" />
          <feFuncG type="table" tableValues="0 0 0.08 0.35 0.82 1 1" />
          <feFuncB type="table" tableValues="0 0 0.07 0.33 0.80 0.98 0.98" />
        </feComponentTransfer>
        <feComponentTransfer>
          <feFuncR type="discrete" tableValues="0.02 0.18 0.45 0.78 0.97" />
          <feFuncG type="discrete" tableValues="0.02 0.18 0.45 0.77 0.96" />
          <feFuncB type="discrete" tableValues="0.02 0.17 0.43 0.74 0.93" />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}
