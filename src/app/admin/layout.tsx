import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isCmsAvailable } from '@/lib/cms-access';

export const metadata: Metadata = {
  title: '博客管理后台 | Taffy CMS',
  description: '博客内容管理系统',
  icons: {
    icon: '/admin-favicon.svg',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isCmsAvailable()) notFound();

  return <>{children}</>;
}
