'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface SidebarLinksProps {
    links: {
        name: string;
        href: string;
        icon: LucideIcon;
    }[];
}

// ⚡ Bolt: Memoize individual static link items to prevent O(N) re-renders during navigation
const SidebarLinkItem = React.memo(({ link, isActive }: { link: SidebarLinksProps['links'][0], isActive: boolean }) => (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className="w-full justify-start hover:bg-muted/50 transition-colors"
      asChild
    >
      {/* Disable prefetch to prevent unnecessary background requests for all sidebar items */}
      <Link href={link.href} aria-current={isActive ? 'page' : undefined} prefetch={false} title={link.name}>
        <link.icon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate min-w-0">{link.name}</span>
      </Link>
    </Button>
), (prevProps, nextProps) => {
    return prevProps.isActive === nextProps.isActive &&
           prevProps.link.href === nextProps.link.href &&
           prevProps.link.name === nextProps.link.name;
});
SidebarLinkItem.displayName = 'SidebarLinkItem';

export function SidebarLinks({ links }: SidebarLinksProps) {
    const pathname = usePathname();

    return (
        <>
        {links.map((link) => (
            <SidebarLinkItem
                key={link.href}
                link={link}
                isActive={pathname === link.href}
            />
        ))}
        </>
    )
}
