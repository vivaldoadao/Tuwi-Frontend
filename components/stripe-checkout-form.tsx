"use client"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, CreditCard, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "react-hot-toast"

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeCheckoutFormProps {
  clientSecret: string
  orderId: string
  onSuccess: () => void
  onError: (error: string) => void
  amount: number
}

function CheckoutForm({ 
  clientSecret, 
  orderId, 
  onSuccess, 
  onError, 
  amount 
}: StripeCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!stripe) {
      return
    }

    // Retrieve the PaymentIntent to check its status
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return

      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Pagamento realizado com sucesso!")
          onSuccess()
          break
        case "processing":
          setMessage("Seu pagamento está sendo processado.")
          break
        case "requires_payment_method":
          setMessage("Seu pagamento não foi processado. Tente novamente.")
          break
        default:
          setMessage("Algo deu errado.")
          break
      }
    })
  }, [stripe, clientSecret, onSuccess])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return
    }

    setIsLoading(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      })

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setMessage(error.message || "Erro no cartão")
          onError(error.message || "Erro no cartão")
        } else {
          setMessage("Erro inesperado.")
          onError("Erro inesperado")
        }
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm payment on backend
        const response = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            orderId
          }),
        })

        if (response.ok) {
          setMessage("Pagamento realizado com sucesso!")
          toast.success("Pedido confirmado com sucesso!")
          onSuccess()
        } else {
          setMessage("Erro ao confirmar pagamento.")
          onError("Erro ao confirmar pagamento")
        }
      }
    } catch (err) {
      setMessage("Erro inesperado.")
      onError("Erro inesperado")
    }

    setIsLoading(false)
  }

  const paymentElementOptions = {
    layout: "tabs" as const,
    defaultValues: {
      billingDetails: {
        email: ''
      }
    }
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <div className="w-8 h-8 rounded-full bg-accent-500 text-white flex items-center justify-center">
            <CreditCard className="h-4 w-4" />
          </div>
          Pagamento Seguro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement 
            id="payment-element" 
            options={paymentElementOptions}
          />
          
          {message && (
            <Alert className={message.includes("sucesso") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {message.includes("sucesso") ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.includes("sucesso") ? "text-green-800" : "text-red-800"}>
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            disabled={isLoading || !stripe || !elements}
            type="submit"
            className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white h-14 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5" />
                <span>Pagar Agora</span>
                <div className="ml-auto bg-white/20 px-3 py-1 rounded-lg">
                  €{amount.toFixed(2)}
                </div>
              </div>
            )}
          </Button>
        </form>

        {/* Trust indicators */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-sm text-blue-800">
              <div className="font-semibold">Pagamento 100% Seguro</div>
              <div>Processado pelo Stripe - Criptografia SSL 256-bit</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function StripeCheckoutForm(props: StripeCheckoutFormProps) {
  const options = {
    clientSecret: props.clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#059669', // accent-600
        colorBackground: '#ffffff',
        colorText: '#374151',
        colorDanger: '#dc2626',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '12px',
      },
    },
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}