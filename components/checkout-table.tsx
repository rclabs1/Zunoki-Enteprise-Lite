"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, CreditCard, Smartphone, DollarSign } from "lucide-react"
import type { Brand } from "@/lib/data"

interface CheckoutItem extends Brand {
  quantity: number
  price: number
}

interface CheckoutTableProps {
  selectedBrands: CheckoutItem[]
  onUpdateQuantity: (brandId: string, quantity: number) => void
  onRemoveItem: (brandId: string) => void
  onCheckout: (paymentMethod: string) => void
}

export function CheckoutTable({ selectedBrands, onUpdateQuantity, onRemoveItem, onCheckout }: CheckoutTableProps) {
  const [paymentMethod, setPaymentMethod] = useState("upi")

  const subtotal = selectedBrands.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.18 // 18% GST
  const total = subtotal + tax

  if (selectedBrands.length === 0) {
    return (
      <Card className="bg-[#141414] border-gray-800 text-white">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">No items in cart. Select brands to add them to your cart.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#141414] border-gray-800 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Checkout Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items List */}
        <div className="space-y-3">
          {selectedBrands.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-white">{item.name}</h4>
                <p className="text-sm text-gray-400">{item.category} Platform</p>
                <p className="text-sm text-green-400">₹{item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-gray-600"
                    onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-white">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-gray-600"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-medium text-white">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => onRemoveItem(item.id)} className="ml-2">
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator className="bg-gray-700" />

        {/* Order Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-gray-300">
            <span>Subtotal:</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>GST (18%):</span>
            <span>₹{tax.toLocaleString()}</span>
          </div>
          <Separator className="bg-gray-700" />
          <div className="flex justify-between text-lg font-bold text-white">
            <span>Total:</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <Label className="text-white font-medium">Payment Method</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="upi" id="upi" />
              <Label htmlFor="upi" className="flex items-center gap-2 text-white cursor-pointer">
                <Smartphone className="h-4 w-4" />
                UPI Payment
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="credit" id="credit" />
              <Label htmlFor="credit" className="flex items-center gap-2 text-white cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Credit Card
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="debit" id="debit" />
              <Label htmlFor="debit" className="flex items-center gap-2 text-white cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Debit Card
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={() => onCheckout(paymentMethod)}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-medium"
        >
          Pay Now - ₹{total.toLocaleString()}
        </Button>
      </CardContent>
    </Card>
  )
}
