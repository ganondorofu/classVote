import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-headline text-primary flex items-center">
            <BookText className="mr-3 h-8 w-8" />
            利用規約
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">第1条（適用）</h2>
            <p>
              本規約は、本アプリケーション（以下、「本アプリ」といいます。）の利用に関する一切の関係に適用されます。本アプリを利用することにより、利用者は本規約に同意したものとみなされます。
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">第2条（利用上の注意）</h2>
            <p>
              利用者は、自己の責任において本アプリを利用するものとします。本アプリの利用にあたり、以下の行為を禁止します。
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本アプリのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>他の利用者の個人情報を収集または蓄積する行為</li>
              <li>他の利用者に成りすます行為</li>
              <li>その他、開発者が不適切と判断する行為</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">第3条（免責事項）</h2>
            <p>
              開発者は、本アプリに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
            </p>
            <p className="mt-2">
              開発者は、本アプリに起因して利用者に生じたあらゆる損害について一切の責任を負いません。ただし、本アプリに関する開発者と利用者との間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">第4条（サービス内容の変更等）</h2>
            <p>
              開発者は、利用者に通知することなく、本アプリの内容を変更しまたは本アプリの提供を中止することができるものとし、これによって利用者に生じた損害について一切の責任を負いません。
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">第5条（利用規約の変更）</h2>
            <p>
              開発者は、必要と判断した場合には、利用者に通知することなくいつでも本規約を変更することができるものとします。
            </p>
          </section>
          <section>
            <p className="text-sm text-muted-foreground mt-8">
              最終更新日：2024年7月26日
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
