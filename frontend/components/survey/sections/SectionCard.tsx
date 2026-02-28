interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

export default function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="rounded-xl border border-white/20 bg-slate-900/25 shadow-sm backdrop-blur-sm">
      <div className="border-b border-white/10 px-6 py-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 px-6 py-5 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}
