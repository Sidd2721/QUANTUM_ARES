import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

interface Props {
  code: string;
  language: string;
  filename?: string;
  title?: string;
}

const LANG_LABELS: Record<string, string> = {
  terraform: 'Terraform HCL', yaml: 'Kubernetes YAML', json: 'IAM Policy JSON', python: 'Python',
};

export default function CodeBlock({ code, language, filename, title }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language === 'terraform' ? '.tf' : language === 'yaml' ? '.yaml' : '.json';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `patch${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between bg-[#0A0F1E]">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-medium">{LANG_LABELS[language] || language}</span>
          {filename && <span className="text-xs text-[#6B7280] font-mono">{filename}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="p-1.5 text-[#6B7280] hover:text-white hover:bg-[#1A2234] rounded transition-all" title="Copy">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleDownload} className="p-1.5 text-[#6B7280] hover:text-white hover:bg-[#1A2234] rounded transition-all" title="Download">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono text-[#9CA3AF]">
            {code.split('\n').map((line, i) => (
              <div key={i} className="flex hover:bg-[#1A2234]/50">
                <span className="w-8 text-right text-[#374151] select-none mr-4 flex-shrink-0">{i + 1}</span>
                <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Footer */}
      {title && (
        <div className="px-4 py-2 border-t border-[#1F2937] text-xs text-[#6B7280]">{title}</div>
      )}
    </div>
  );
}
