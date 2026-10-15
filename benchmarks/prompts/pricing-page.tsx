import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Plan {
  name: string
  description: string
  price: string
  popular?: boolean
  features: string[]
}

interface PricingPageProps {
  plans: Plan[]
  onSelect: () => void
}

export default function PricingPage({ plans, onSelect }: PricingPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
      <p className="text-sm text-muted-foreground">Choose the plan that fits your team. Cancel anytime.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <h2 className="text-3xl font-semibold tracking-tight">{plan.price}</h2>
              {plan.popular && <Badge>Most popular</Badge>}
              {plan.features.map((feature) => (
                <p key={feature} className="text-sm">
                  {feature}
                </p>
              ))}
              <Button className="w-fit" onClick={onSelect}>
                Get started
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
