import clsx from "clsx";

const colors: Record<string, string> = {
  production: "bg-red-50 text-red-700 border-red-200",
  staging: "bg-orange-50 text-orange-700 border-orange-200",
  uat: "bg-yellow-50 text-yellow-700 border-yellow-200",
  development: "bg-blue-50 text-blue-700 border-blue-200",
  test: "bg-gray-50 text-gray-600 border-gray-200",
};

export function EnvironmentBadge({ env }: { env: string }) {
  return (
    <span className={clsx(
      "text-xs font-medium px-2 py-0.5 rounded border",
      colors[env.toLowerCase()] ?? "bg-gray-50 text-gray-600 border-gray-200"
    )}>
      {env}
    </span>
  );
}
