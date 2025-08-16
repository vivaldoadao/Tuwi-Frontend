import Image from "next/image"
import Link from "next/link"

export function SiteFooter() {
  return (
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
        <nav className="flex gap-6 text-sm">
          <Link href="#" className="hover:text-brand-accent transition-colors">
            Política de Privacidade
          </Link>
          <Link href="#" className="hover:text-brand-accent transition-colors">
            Termos de Serviço
          </Link>
          <Link href="#" className="hover:text-brand-accent transition-colors">
            FAQ
          </Link>
        </nav>
        <p className="text-sm text-white/80">
          © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}