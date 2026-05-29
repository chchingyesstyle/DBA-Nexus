interface Tag { id: number; name: string }

export function TagList({ items, color = "blue" }: { items: Tag[]; color?: "blue" | "purple" }) {
  if (!items.length) return <span className="text-gray-400 text-xs">—</span>;
  const cls = color === "blue"
    ? "bg-blue-50 text-blue-700 border border-blue-100"
    : "bg-purple-50 text-purple-700 border border-purple-100";
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item.id} className={`text-xs px-2 py-0.5 rounded ${cls}`}>
          {item.name}
        </span>
      ))}
    </div>
  );
}
