import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Helper component for skeleton placeholders
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-neutral-800", className)} />
)

export default function WorkflowLoading() {
  return (
    <div className="p-6 space-y-8 min-h-screen bg-black">
      {/* Header */}
      <Skeleton className="h-6 w-48 mb-2" />
      <Skeleton className="h-9 w-80 mb-6" />
      <Skeleton className="h-5 w-96" />

      {/* Milestone Navigation */}
      <div className="flex justify-between space-x-4 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex-1 text-center">
            <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-3 w-32 mx-auto mt-1" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex justify-between space-x-2 mb-6">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="h-10 flex-1" />
        ))}
      </div>

      {/* Card Content Placeholder */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="bg-neutral-800 border-neutral-700 h-48">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}