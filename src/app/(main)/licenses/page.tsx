import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCopy } from 'lucide-react';

export default function LicensesPage() {
  const licenses = [
    { name: 'Next.js', url: 'https://github.com/vercel/next.js/blob/canary/LICENSE.md', license: 'MIT License' },
    { name: 'React', url: 'https://github.com/facebook/react/blob/main/LICENSE', license: 'MIT License' },
    { name: 'Shadcn UI', url: 'https://github.com/shadcn-ui/ui/blob/main/LICENSE.md', license: 'MIT License' },
    { name: 'Tailwind CSS', url: 'https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE', license: 'MIT License' },
    { name: 'Lucide React', url: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE', license: 'ISC License' },
    { name: 'Firebase', url: 'https://firebase.google.com/terms', license: 'Google APIs Terms of Service' },
    { name: 'Genkit', url: 'https://github.com/firebase/genkit/blob/main/LICENSE', license: 'Apache License 2.0' },
    { name: 'React Hook Form', url: 'https://github.com/react-hook-form/react-hook-form/blob/master/LICENSE', license: 'MIT License' },
    { name: 'Zod', url: 'https://github.com/colinhacks/zod/blob/master/LICENSE', license: 'MIT License' },
    { name: 'Recharts', url: 'https://github.com/recharts/recharts/blob/master/LICENSE', license: 'MIT License' },
  ];

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-headline text-primary flex items-center">
            <BookCopy className="mr-3 h-8 w-8" />
            オープンソースライセンス
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>
            このアプリケーションは、以下のオープンソースソフトウェアおよびサードパーティライブラリを使用しています。素晴らしいソフトウェアを提供してくださる開発者の皆様に感謝いたします。
          </p>
          <div className="space-y-4">
            {licenses.map((lib) => (
              <div key={lib.name} className="p-4 border rounded-md bg-secondary/20">
                <h3 className="font-semibold">{lib.name}</h3>
                <p className="text-sm text-muted-foreground">{lib.license}</p>
                <a href={lib.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  ライセンス詳細
                </a>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            上記以外のライブラリについては、プロジェクトの `package.json` ファイルをご参照ください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
