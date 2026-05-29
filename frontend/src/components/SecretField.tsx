import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

interface Props {
  label: string;
  fetchSecret: () => Promise<string>;
  canReveal: boolean;
}

export function SecretField({ label, fetchSecret, canReveal }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const reveal = async () => {
    if (value === null) {
      setLoading(true);
      try {
        const v = await fetchSecret();
        setValue(v);
      } finally {
        setLoading(false);
      }
    }
    setRevealed((r) => !r);
  };

  const copy = async () => {
    const v = value ?? (await fetchSecret().then((s) => { setValue(s); return s; }));
    await navigator.clipboard.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      <span className="font-mono text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 min-w-[180px]">
        {revealed && value !== null ? value : "••••••••"}
      </span>
      {canReveal && (
        <>
          <button
            onClick={reveal}
            disabled={loading}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button
            onClick={copy}
            disabled={loading}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="Copy"
          >
            {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
          </button>
        </>
      )}
    </div>
  );
}
