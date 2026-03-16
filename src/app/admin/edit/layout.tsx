import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '编辑文章 | 博客管理后台',
};

export default function EditPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
