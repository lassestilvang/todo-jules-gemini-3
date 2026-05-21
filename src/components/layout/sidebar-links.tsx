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
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={link.href} aria-current={isActive ? 'page' : undefined}>
                    <link.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    {link.name}
                  </Link>
                </Button>
            );
        })}
        </>
    )
}
