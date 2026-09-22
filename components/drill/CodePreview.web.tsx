import { buildPreviewDocument } from '@/lib/quiz/previewDocument';
export default function CodePreview({ code }: { code: string }) {
  return <iframe title="カードの表示結果" sandbox="" referrerPolicy="no-referrer" srcDoc={buildPreviewDocument(code)} style={{ width: '100%', height: 430, border: 0, borderRadius: 12, background: '#111827' }} />;
}
