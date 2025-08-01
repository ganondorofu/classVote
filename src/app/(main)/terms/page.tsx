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
            <h2 className="text-xl font-semibold mb-2">第4条（公正性と透明性）</h2>
            <p>
              開発者は、本アプリにおける投票プロセスの公正性および透明性を重視します。開発者が投票結果を不正に操作すること、または投票プロセスに不当に介入することは一切ありません。本アプリの全ソースコードはGitHub上で公開されており、誰でもその動作を確認できます。これにより、本アプリの挙動が透明であることを保証します。
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">第5条（サービス内容の変更等）</h2>
            <p>
              開発者は、利用者に通知することなく、本アプリの内容を変更しまたは本アプリの提供を中止することができるものとし、これによって利用者に生じた損害について一切の責任を負いません。
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">第6条（利用規約の変更）</h2>
            <p>
              開発者は、必要と判断した場合には、利用者に通知することなくいつでも本規約を変更することができるものとします。
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">第7条（AI機能の利用）</h2>
            <p>
              本アプリは、利用者の利便性向上を目的として、Google, LLCが提供する生成AI技術（以下「AI技術」といいます）を利用した機能を含みます。現在、自由記述形式の投票結果を要約する機能にAI技術を利用しています。
            </p>
            <p className="mt-2">
              AI技術によって生成される情報は、不完全、不正確、または不適切な内容を含む可能性があります。開発者は、AI機能によって生成された情報の正確性、完全性、特定目的への適合性について、一切の保証を行いません。利用者は、自身の判断と責任においてAI機能を利用するものとし、生成された情報を利用する際には、必ず元のデータと照らし合わせて内容を検証してください。
            </p>
            <p className="mt-2">
              AI機能によって生成されたコンテンツは、開発者の見解を示すものではありません。開発者は、AI機能の利用に起因して利用者に生じたあらゆる損害について、一切の責任を負いません。
            </p>
          </section>
          <section>
            <p className="text-sm text-muted-foreground mt-8">
              最終更新日：2024年7月27日
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
