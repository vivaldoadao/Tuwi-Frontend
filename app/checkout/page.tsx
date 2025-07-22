import SiteHeader from "@/components/site-header"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"

export default function CheckoutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-bold text-center mb-10 text-brand-primary">Finalizar Compra</h1>
          <Card className="bg-white text-gray-900 p-8 text-center max-w-2xl mx-auto shadow-lg rounded-lg">
            <CardTitle className="text-3xl mb-4 text-brand-primary">Página de Checkout</CardTitle>
            <p className="text-lg mb-6 text-gray-700">
              Esta é uma página de placeholder para o processo de finalização da compra. Aqui você implementaria os
              passos para pagamento e envio.
            </p>
            <Button asChild className="bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white">
              <Link href="/cart">Voltar ao Carrinho</Link>
            </Button>
          </Card>
        </div>
      </main>
      <footer className="bg-brand-primary text-white py-8">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={30}
              height={30}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-lg font-bold text-brand-accent">WILNARA TRANÇAS</span>
          </div>
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
