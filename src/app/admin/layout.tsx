import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '博客管理后台 | Taffy CMS',
  description: '博客内容管理系统',
  icons: {
    icon: '/admin-favicon.ico',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
