import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '写新文章 | 博客管理后台',
};

export default function NewPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
