import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("h-32 bg-gray-100 rounded-xl animate-pulse", className)} />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-48" />
      <div className="h-4 bg-gray-100 rounded animate-pulse w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <CardSkeleton className="h-48" />
      <CardSkeleton className="h-48" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export function LessonSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
      <div className="h-1 bg-gray-100 rounded-full animate-pulse" />
      <div className="bg-gray-100 rounded-xl animate-pulse h-64" />
      <div className="space-y-2">
        <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}
