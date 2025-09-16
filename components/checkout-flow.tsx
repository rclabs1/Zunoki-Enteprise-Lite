"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Smartphone, Building2, Check, ArrowLeft, ArrowRight, Eye, Users, DollarSign } from "lucide-react"
import type { Brand } from "@/lib/data"
import { useCampaignStore } from "@/lib/campaign-store"
import { toast } from "sonner"

interface CheckoutFlowProps {
  isOpen: boolean
  onClose: () => void
  brand: Brand
}

type PaymentMethod = "upi" | "credit" | "debit"

interface CampaignDetails {
  name: string
  budget: number
  duration: number
  startDate: string
}

export function CheckoutFlow({ isOpen, onClose, brand }: CheckoutFlowProps) {
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi")
  const [isProcessing, setIsProcessing] = useState(false)
  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails>({
    name: `${brand.name} Campaign`,
    budget: Number.parseInt(brand.cpm.replace("₹", "")) * 10,
    duration: 30,
    startDate: new Date().toISOString().split("T")[0],
  })

  const [paymentDetails, setPaymentDetails] = useState({
    upiId: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  })

  const { addCampaign } = useCampaignStore()

  const totalCost = campaignDetails.budget
  const estimatedImpressions = Math.floor((totalCost / Number.parseInt(brand.cpm.replace("₹", ""))) * 1000)

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handlePayment = async () => {
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Create campaign
    const newCampaign = {
      id: `campaign-${Date.now()}`,
      name: campaignDetails.name,
      type: brand.category,
      brand: brand.name,
      status: "active" as const,
      budget: {
        allocated: campaignDetails.budget,
        spent: 0,
      },
      metrics: {
        impressions: "0",
        ctr: "0%",
        reach: "0",
      },
      targetGroup: brand.targetGroup,
      startDate: campaignDetails.startDate,
      duration: campaignDetails.duration,
      cpm: brand.cpm,
      estimatedImpressions: estimatedImpressions.toLocaleString(),
    }

    addCampaign(newCampaign)
    setIsProcessing(false)
    setStep(4) // Success step

    toast.success("Campaign created successfully!")
  }

  const handleClose = () => {
    setStep(1)
    setPaymentMethod("upi")
    setIsProcessing(false)
    setCampaignDetails({
      name: `${brand.name} Campaign`,
      budget: Number.parseInt(brand.cpm.replace("₹", "")) * 10,
      duration: 30,
      startDate: new Date().toISOString().split("T")[0],
    })
    setPaymentDetails({
      upiId: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white text-sm font-bold">
              {brand.name.charAt(0)}
            </div>
            Checkout - {brand.name}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? "bg-red-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {step > stepNum ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              {stepNum < 3 && <div className={`w-12 h-1 mx-2 ${step > stepNum ? "bg-red-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Campaign Details</h3>

                {/* Brand Summary */}
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center text-white text-lg font-bold">
                        {brand.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{brand.name}</h4>
                        <Badge variant="outline">{brand.category}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <Eye className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                        <p className="text-sm text-muted-foreground">Reach</p>
                        <p className="font-semibold">{brand.reach}</p>
                      </div>
                      <div>
                        <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-500" />
                        <p className="text-sm text-muted-foreground">CPM</p>
                        <p className="font-semibold">{brand.cpm}</p>
                      </div>
                      <div>
                        <Users className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                        <p className="text-sm text-muted-foreground">TG</p>
                        <p className="font-semibold text-xs">{brand.targetGroup.join(", ")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Campaign Configuration */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      value={campaignDetails.name}
                      onChange={(e) => setCampaignDetails((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter campaign name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget">Budget (₹)</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={campaignDetails.budget}
                        onChange={(e) =>
                          setCampaignDetails((prev) => ({ ...prev, budget: Number.parseInt(e.target.value) || 0 }))
                        }
                        min={Number.parseInt(brand.cpm.replace("₹", "")) * 10}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum: ₹{(Number.parseInt(brand.cpm.replace("₹", "")) * 10).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration (days)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={campaignDetails.duration}
                        onChange={(e) =>
                          setCampaignDetails((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 1 }))
                        }
                        min={1}
                        max={365}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={campaignDetails.startDate}
                      onChange={(e) => setCampaignDetails((prev) => ({ ...prev, startDate: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                {/* Estimated Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Estimated Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{estimatedImpressions.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Estimated Impressions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">₹{campaignDetails.budget.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Budget</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>

                {/* Payment Method Selection */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { id: "upi", label: "UPI", icon: Smartphone },
                    { id: "credit", label: "Credit Card", icon: CreditCard },
                    { id: "debit", label: "Debit Card", icon: Building2 },
                  ].map(({ id, label, icon: Icon }) => (
                    <Card
                      key={id}
                      className={`cursor-pointer transition-all ${
                        paymentMethod === id ? "ring-2 ring-red-600 bg-red-50" : "hover:shadow-md"
                      }`}
                      onClick={() => setPaymentMethod(id as PaymentMethod)}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon
                          className={`h-8 w-8 mx-auto mb-2 ${paymentMethod === id ? "text-red-600" : "text-gray-600"}`}
                        />
                        <p className="font-medium">{label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Payment Details Form */}
                <div className="space-y-4">
                  {paymentMethod === "upi" && (
                    <div>
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        value={paymentDetails.upiId}
                        onChange={(e) => setPaymentDetails((prev) => ({ ...prev, upiId: e.target.value }))}
                        placeholder="yourname@upi"
                      />
                    </div>
                  )}

                  {(paymentMethod === "credit" || paymentMethod === "debit") && (
                    <>
                      <div>
                        <Label htmlFor="cardholderName">Cardholder Name</Label>
                        <Input
                          id="cardholderName"
                          value={paymentDetails.cardholderName}
                          onChange={(e) => setPaymentDetails((prev) => ({ ...prev, cardholderName: e.target.value }))}
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          value={paymentDetails.cardNumber}
                          onChange={(e) => setPaymentDetails((prev) => ({ ...prev, cardNumber: e.target.value }))}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            value={paymentDetails.expiryDate}
                            onChange={(e) => setPaymentDetails((prev) => ({ ...prev, expiryDate: e.target.value }))}
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            value={paymentDetails.cvv}
                            onChange={(e) => setPaymentDetails((prev) => ({ ...prev, cvv: e.target.value }))}
                            placeholder="123"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Campaign Budget</span>
                        <span>₹{campaignDetails.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fee</span>
                        <span>₹0</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{totalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">Confirm Payment</h3>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                        ₹
                      </div>
                      <h4 className="text-2xl font-bold">₹{totalCost.toLocaleString()}</h4>
                      <p className="text-muted-foreground">Total Amount</p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Campaign:</span>
                        <span className="font-medium">{campaignDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform:</span>
                        <span className="font-medium">{brand.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{campaignDetails.duration} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="font-medium capitalize">
                          {paymentMethod === "upi" ? "UPI" : `${paymentMethod} Card`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white mx-auto">
                <Check className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h3>
                <p className="text-muted-foreground">
                  Your campaign has been created and will start on {campaignDetails.startDate}
                </p>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Campaign Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span>{campaignDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Budget:</span>
                      <span>₹{campaignDetails.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Impressions:</span>
                      <span>{estimatedImpressions.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          {step > 1 && step < 4 && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}

          <div className="ml-auto">
            {step < 3 && (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {step === 3 && (
              <Button onClick={handlePayment} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
                {isProcessing ? "Processing..." : `Pay ₹${totalCost.toLocaleString()}`}
              </Button>
            )}

            {step === 4 && <Button onClick={handleClose}>Go to Dashboard</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
