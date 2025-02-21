'use client'

import Link from 'next/link';
import { Button } from './Button';

export function HomeBox({ title, description, href, buttonText }: { title: string, description: string, href: string, buttonText: string }) {
  return (
    <div className="bg-black/5 p-8 rounded-[32px] backdrop-blur-sm hover:bg-black/10 transition-all duration-200">
      <h2 className="text-3xl font-light text-black mb-4">{title}</h2>
      <p className="text-gray-600 mb-8">{description}</p>
      <Link href={href} className="block">
        <Button onClick={() => {}} className="w-full">
          {buttonText}
        </Button>
      </Link>
    </div>
  );
}