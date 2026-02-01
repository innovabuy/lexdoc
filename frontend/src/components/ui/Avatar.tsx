import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, getInitials } from '@/lib/utils/helpers';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  firstName = '',
  lastName = '',
  size = 'md',
  className,
}) => {
  const initials = getInitials(firstName, lastName);

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-100',
        sizes[size],
        className
      )}
    >
      <AvatarPrimitive.Image
        src={src || undefined}
        alt={alt || `${firstName} ${lastName}`}
        className="h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center bg-primary-100 text-primary-700 font-medium"
        delayMs={0}
      >
        {initials || '?'}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
};

export default Avatar;
