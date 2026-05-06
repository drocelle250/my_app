import React from "react";

// ─── Base skeleton block ──────────────────────────────────────────────────────
export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

// ─── Product card skeleton ────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden animate-fade-in">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ─── Product grid skeleton ────────────────────────────────────────────────────
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Table row skeleton ───────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-t">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// ─── Stat card skeleton ───────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-6 bg-gray-100 animate-pulse space-y-3">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// ─── Chat message skeleton ────────────────────────────────────────────────────
export function ChatMessageSkeleton() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
