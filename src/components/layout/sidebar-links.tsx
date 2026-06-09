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

export function SidebarLinks({ links }: SidebarLinksProps) {
    const pathname = usePathname();

    return (
        <>
        {links.map((link) => {
            const isActive = pathname === link.href;
            return (
                <Button
                  key={link.href}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start transition-colors hover:bg-muted/50"
                  asChild
                >
                  {/* Disable prefetch to prevent unnecessary background requests for all sidebar items */}
                  <Link href={link.href} aria-current={isActive ? 'page' : undefined} prefetch={false} title={link.name}>
                    <link.icon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate min-w-0">{link.name}</span>
                  </Link>
                </Button>
            );
        })}
        </>
    )
}
