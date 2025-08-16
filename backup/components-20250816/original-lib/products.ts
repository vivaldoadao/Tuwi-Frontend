export type Product = {
  id: string
  name: string
  price: number
  imageUrl: string
  description: string
  longDescription: string
}

export const allProducts: Product[] = [
  {
    id: "1",
    name: "Trança Box Braids Clássica",
    price: 150.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Box+Braids",
    description: "Cabelo sintético de alta qualidade para um visual clássico e duradouro.",
    longDescription:
      "As Box Braids clássicas são uma escolha atemporal para quem busca um visual elegante e de baixa manutenção. Feitas com cabelo sintético premium, elas oferecem durabilidade e um acabamento impecável. Perfeitas para proteger seus fios naturais e experimentar um novo estilo.",
  },
  {
    id: "2",
    name: "Crochet Braids Onduladas",
    price: 180.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Crochet+Braids",
    description: "Fios ondulados para um estilo volumoso e natural.",
    longDescription:
      "Nossas Crochet Braids onduladas são ideais para quem deseja volume e movimento. Com uma textura suave e cachos definidos, elas proporcionam um look natural e deslumbrante. Fáceis de instalar e remover, são a opção perfeita para uma transformação rápida e impactante.",
  },
  {
    id: "3",
    name: "Twists Senegalesas Longas",
    price: 220.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Twists+Senegalesas",
    description: "Twists elegantes e leves, perfeitas para qualquer ocasião.",
    longDescription:
      "As Twists Senegalesas longas da Wilnara Tranças são sinônimo de elegância e leveza. Com um caimento perfeito e um brilho sutil, elas são versáteis para o dia a dia ou eventos especiais. Confeccionadas com material de alta qualidade para garantir conforto e um visual impecável.",
  },
  {
    id: "4",
    name: "Faux Locs Leves",
    price: 250.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Faux+Locs",
    description: "Locs sintéticas que imitam o cabelo natural, com conforto e estilo.",
    longDescription:
      "Experimente a beleza das Faux Locs com a leveza e o conforto que você merece. Nossas locs sintéticas são cuidadosamente elaboradas para imitar a textura e o caimento do cabelo natural, oferecendo um estilo autêntico e protetor. Duráveis e fáceis de manter, são a escolha ideal para um visual ousado e sofisticado.",
  },
  {
    id: "5",
    name: "Trança Nagô com Cachos",
    price: 190.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Nagô+Cachos",
    description: "Base nagô com cachos soltos para um look moderno.",
    longDescription:
      "A Trança Nagô com Cachos combina a tradição das tranças nagô com a modernidade dos cachos soltos. Este estilo versátil é perfeito para quem busca um visual único, que valoriza a beleza natural e oferece praticidade no dia a dia. Feita com materiais de alta qualidade para garantir conforto e durabilidade.",
  },
  {
    id: "6",
    name: "Dreadlocks Sintéticos",
    price: 280.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Dreadlocks",
    description: "Dreadlocks sintéticos realistas e de fácil aplicação.",
    longDescription:
      "Nossos Dreadlocks Sintéticos são a opção ideal para quem deseja um visual alternativo e cheio de personalidade sem comprometer o cabelo natural. Realistas e leves, são fáceis de aplicar e manter, proporcionando um estilo autêntico e duradouro. Disponíveis em diversas cores e comprimentos.",
  },
]

export function getProductById(id: string): Product | undefined {
  return allProducts.find((product) => product.id === id)
}

export function getFeaturedProducts(): Product[] {
  return allProducts.slice(0, 4) // Return first 4 as featured
}
