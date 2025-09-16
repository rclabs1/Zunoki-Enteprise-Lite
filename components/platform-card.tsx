import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import Image from "next/image"

interface PlatformCardProps {
  name: string
  category: string
  users: string
  minSpend: string
  cpm: string
  ctr: string
  image: string
}

export function PlatformCard({ name, category, users, minSpend, cpm, ctr, image }: PlatformCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:border-fuchsia-200 hover:shadow-md">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-3">
          <Image src={image || "/placeholder.svg"} alt={name} width={40} height={40} className="rounded" />
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground">{category}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Monthly Users</p>
            <p className="font-medium">{users}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Min. Spend</p>
            <p className="font-medium">{minSpend}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg. CPM</p>
            <p className="font-medium">{cpm}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg. CTR</p>
            <p className="font-medium">{ctr}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 p-3">
        <Button size="sm" className="w-full bg-fuchsia-600 hover:bg-fuchsia-700">
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
