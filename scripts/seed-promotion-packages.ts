/**
 * Script para popular pacotes de promoção padrão
 * Execute com: npx tsx scripts/seed-promotion-packages.ts
 */

const PACKAGES = [
  // Perfil em Destaque
  {
    name: "Destaque Básico",
    description: "Apareça no topo da lista de trancistas por 7 dias",
    type: "profile_highlight",
    duration_days: 7,
    price: 9.99,
    original_price: null,
    features: [
      "Perfil no topo da lista",
      "Badge de destaque",
      "Analytics básicas",
      "Suporte por email"
    ],
    is_featured: false,
    sort_order: 1,
    color: "#8B5CF6",
    icon: "crown"
  },
  {
    name: "Destaque Premium",
    description: "Máxima visibilidade por 30 dias com recursos extras",
    type: "profile_highlight",
    duration_days: 30,
    price: 29.99,
    original_price: 39.99,
    features: [
      "Perfil no topo da lista",
      "Badge premium dourado",
      "Analytics avançadas",
      "Suporte prioritário",
      "Relatórios semanais",
      "Badge 'Profissional Verificada'"
    ],
    is_featured: true,
    sort_order: 2,
    color: "#F59E0B",
    icon: "star"
  },

  // Banner Hero
  {
    name: "Banner Hero Semanal",
    description: "Sua promoção na homepage por 7 dias",
    type: "hero_banner",
    duration_days: 7,
    price: 19.99,
    original_price: null,
    features: [
      "Banner na homepage",
      "Design personalizado",
      "Analytics de cliques",
      "Suporte na criação"
    ],
    is_featured: false,
    sort_order: 3,
    color: "#EF4444",
    icon: "megaphone"
  },
  {
    name: "Banner Hero Mensal",
    description: "Máxima exposição na homepage por 30 dias",
    type: "hero_banner",
    duration_days: 30,
    price: 59.99,
    original_price: 79.99,
    features: [
      "Banner na homepage",
      "Design personalizado premium",
      "A/B testing do banner",
      "Analytics detalhadas",
      "Otimização semanal",
      "Suporte dedicado"
    ],
    is_featured: true,
    sort_order: 4,
    color: "#EC4899",
    icon: "trending-up"
  },

  // Pacotes Combo
  {
    name: "Combo Crescimento",
    description: "Destaque + Banner por 14 dias",
    type: "combo",
    duration_days: 14,
    price: 39.99,
    original_price: 49.99,
    features: [
      "Perfil em destaque",
      "Banner hero incluído",
      "Analytics completas",
      "Badge combo exclusivo",
      "Suporte prioritário",
      "Relatório de performance"
    ],
    is_featured: true,
    sort_order: 5,
    color: "#10B981",
    icon: "gift"
  },
  {
    name: "Combo Profissional",
    description: "Plano completo por 30 dias - máximo resultado",
    type: "combo",
    duration_days: 30,
    price: 79.99,
    original_price: 119.99,
    features: [
      "Perfil em destaque premium",
      "Banner hero personalizado",
      "Analytics avançadas",
      "Badge profissional exclusivo",
      "Consultoria de marketing",
      "Suporte 24/7",
      "Relatórios semanais",
      "Otimização contínua"
    ],
    is_featured: true,
    sort_order: 6,
    color: "#6366F1",
    icon: "diamond"
  }
]

async function seedPromotionPackages() {
  try {
    console.log('🌱 Iniciando seed de pacotes de promoção...')
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    for (const packageData of PACKAGES) {
      try {
        console.log(`📦 Criando pacote: ${packageData.name}`)
        
        const response = await fetch(`${baseUrl}/api/promotions/packages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Adicione aqui headers de autenticação se necessário
            // 'Authorization': 'Bearer admin_token'
          },
          body: JSON.stringify(packageData)
        })
        
        if (!response.ok) {
          const error = await response.json()
          console.error(`❌ Erro ao criar ${packageData.name}:`, error)
          continue
        }
        
        const result = await response.json()
        console.log(`✅ Pacote criado: ${packageData.name} (ID: ${result.package?.id})`)
        
      } catch (error) {
        console.error(`❌ Falha ao criar pacote ${packageData.name}:`, error)
      }
    }
    
    console.log('🎉 Seed de pacotes concluído!')
    
  } catch (error) {
    console.error('💥 Erro geral no seed:', error)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedPromotionPackages()
}

export { seedPromotionPackages, PACKAGES }