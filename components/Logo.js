import Link from 'next/link';
import Image from 'next/image';

const Logo = ({ variant = 'default', ariaLabel = 'Victoria Flooring Outlet Home' }) => {
  return (
    <Link href="/" aria-label={ariaLabel} className="flex items-center justify-start group">
      <div className="relative w-72 h-20 md:w-96 md:h-24 lg:w-[32rem] lg:h-28 xl:w-[36rem] xl:h-32 flex-shrink-0">
        <Image
          src="/images/vfo-logo-final.svg"
          alt="Victoria Flooring Outlet Logo"
          fill
          className="object-cover object-[center_47%]"
        />
      </div>
    </Link>
  );
};

export default Logo;
