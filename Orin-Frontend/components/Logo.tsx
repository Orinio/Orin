import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  variant?: 'mark' | 'full' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  className?: string;
  priority?: boolean;
}

const sizeMap = {
  sm: { mark: 28, height: 28, text: 'text-base' },
  md: { mark: 32, height: 32, text: 'text-lg' },
  lg: { mark: 40, height: 40, text: 'text-xl' },
  xl: { mark: 48, height: 48, text: 'text-2xl' },
};

export default function Logo({
  variant = 'auto',
  size = 'md',
  href = '/',
  className = '',
  priority = false,
}: LogoProps) {
  const s = sizeMap[size];

  const logoMark = (
    <Image
      src="/logo.svg"
      alt="ORIN"
      width={s.mark}
      height={s.height}
      priority={priority}
      className="object-contain"
    />
  );

  const logoFull = (
    <div className="flex items-center gap-2">
      {logoMark}
      <span className={`font-bold tracking-tight ${s.text}`} style={{ color: 'var(--color-ink)' }}>
        ORIN
      </span>
    </div>
  );

  const content = variant === 'mark' ? logoMark : variant === 'full' ? logoFull : logoMark;

  if (href) {
    return (
      <Link href={href} className={`flex items-center group ${className}`} aria-label="ORIN home">
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {content}
    </div>
  );
}
