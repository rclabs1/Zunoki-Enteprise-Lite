import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#1a1a1a]", className)}
      {...props}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      {/* Time Filter Skeleton */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] rounded-lg">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-7 w-12" />
          ))}
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Metrics Groups Skeleton */}
      <div className="space-y-6">
        {[...Array(2)].map((_, groupIndex) => (
          <div key={groupIndex} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, cardIndex) => (
                <div key={cardIndex} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-3 w-3" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] rounded-lg">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-7 w-8" />
              ))}
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          
          <Skeleton className="h-80 w-full" />
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 bg-[#1a1a1a] rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-12" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCardSkeleton() {
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  DashboardSkeleton, 
  MetricCardSkeleton, 
  ChartSkeleton 
}
