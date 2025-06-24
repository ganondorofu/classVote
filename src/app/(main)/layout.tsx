
import { Header } from '@/components/layout/header';
import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="py-6 md:px-8 md:py-0 bg-background border-t">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 md:h-24">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            <a
              href="https://github.com/ganondorofu/classVote"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 hover:text-primary"
            >
              ソースコードはGitHubで公開
            </a>
          </p>
          <div className="flex items-center gap-x-6 text-sm text-muted-foreground">
            <Link href="/terms" className="font-medium underline underline-offset-4 hover:text-primary">
              利用規約
            </Link>
            <Link href="/licenses" className="font-medium underline underline-offset-4 hover:text-primary">
              ライセンス
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
