import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  variant?: 'mark' | 'full' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  className?: string;
  priority?: boolean;
  responsive?: boolean;
}

const sizeMap = {
  sm: { mark: 36, height: 36, text: 'text-lg' },
  md: { mark: 44, height: 44, text: 'text-xl' },
  lg: { mark: 56, height: 56, text: 'text-2xl' },
  xl: { mark: 72, height: 72, text: 'text-3xl' },
};

const responsiveSizeMap = {
  sm: 'w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11',
  md: 'w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14',
  lg: 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28',
};

const responsiveTextMap = {
  sm: 'text-lg sm:text-xl md:text-2xl',
  md: 'text-xl sm:text-2xl md:text-3xl',
  lg: 'text-2xl sm:text-3xl md:text-4xl',
  xl: 'text-3xl sm:text-4xl md:text-5xl',
};

export default function Logo({
  variant = 'auto',
  size = 'md',
  href = '/',
  className = '',
  priority = false,
  responsive = true,
}: LogoProps) {
  const s = sizeMap[size];
  const sizeClasses = responsive ? responsiveSizeMap[size] : '';
  const textClasses = responsive ? responsiveTextMap[size] : s.text;

  const logoMark = (
    <Image
      src="/logo.png"
      alt="ORIN"
      width={responsive ? 256 : s.mark}
      height={responsive ? 256 : s.height}
      priority={priority}
      sizes={responsive ? "(max-width: 640px) 44px, (max-width: 768px) 56px, 80px" : undefined}
      className={`object-contain ${sizeClasses}`}
    />
  );

  const logoFull = (
    <div className="flex items-center gap-2 sm:gap-3">
      {logoMark}
      <span className={`font-bold tracking-tight ${textClasses}`} style={{ color: 'var(--color-ink)' }}>
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
