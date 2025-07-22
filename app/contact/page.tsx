import SiteHeader from "@/components/site-header"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-bold text-center mb-10 text-brand-primary">Fale Conosco</h1>
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto space-y-6">
            <p className="text-lg leading-relaxed text-gray-700 text-center">
              Tem alguma dúvida, sugestão ou precisa de ajuda? Entre em contato conosco!
            </p>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-gray-900">
                  Nome
                </Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-900">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message" className="text-gray-900">
                  Mensagem
                </Label>
                <Textarea
                  id="message"
                  placeholder="Sua mensagem..."
                  rows={5}
                  className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <Button
                type="submit"
                className="bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg"
              >
                Enviar Mensagem
              </Button>
            </form>
          </div>
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
