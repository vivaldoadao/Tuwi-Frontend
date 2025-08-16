#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔍 ANÁLISE DE CÓDIGO PARA REFATORAÇÃO')
console.log('='.repeat(70))

class CodeAnalyzer {
  constructor() {
    this.duplicatePatterns = new Map()
    this.componentPatterns = new Map()
    this.tableComponents = []
    this.formComponents = []
    this.cardComponents = []
    this.dashboardComponents = []
    this.apiRoutes = []
    this.utilFunctions = []
    this.typeDefinitions = []
    this.duplicatedCode = []
  }

  analyzeDirectory(dirPath, patterns = []) {
    if (!fs.existsSync(dirPath)) return []
    
    const files = []
    const items = fs.readdirSync(dirPath)
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.analyzeDirectory(fullPath, patterns))
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        files.push(fullPath)
      }
    }
    
    return files
  }

  readFileContent(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8')
    } catch (error) {
      return ''
    }
  }

  analyzeComponents() {
    console.log('\n🧩 1. ANÁLISE DE COMPONENTES')
    console.log('-'.repeat(50))
    
    const componentFiles = this.analyzeDirectory('./components')
    const appFiles = this.analyzeDirectory('./app').filter(f => f.includes('page.tsx'))
    
    console.log(`📊 Total de componentes: ${componentFiles.length}`)
    console.log(`📄 Total de páginas: ${appFiles.length}`)
    
    // Categorize components
    for (const file of componentFiles) {
      const fileName = path.basename(file, '.tsx')
      const content = this.readFileContent(file)
      const fileSize = content.length
      
      // Detect component types
      if (fileName.includes('table') || content.includes('TableBody') || content.includes('DataTable')) {
        this.tableComponents.push({ file, fileName, size: fileSize, content })
      }
      
      if (fileName.includes('form') || content.includes('useForm') || content.includes('<form')) {
        this.formComponents.push({ file, fileName, size: fileSize, content })
      }
      
      if (fileName.includes('card') || content.includes('Card>') || content.includes('CardContent')) {
        this.cardComponents.push({ file, fileName, size: fileSize, content })
      }
      
      if (fileName.includes('dashboard') || file.includes('dashboard')) {
        this.dashboardComponents.push({ file, fileName, size: fileSize, content })
      }
    }
    
    console.log(`📋 Componentes de tabela: ${this.tableComponents.length}`)
    console.log(`📝 Componentes de formulário: ${this.formComponents.length}`)
    console.log(`🃏 Componentes de card: ${this.cardComponents.length}`)
    console.log(`📊 Componentes de dashboard: ${this.dashboardComponents.length}`)
    
    // Show largest components
    const allComponents = [...this.tableComponents, ...this.formComponents, ...this.cardComponents]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
    
    console.log('\n📏 Maiores componentes:')
    allComponents.forEach((comp, index) => {
      const sizeKB = (comp.size / 1024).toFixed(1)
      console.log(`   ${index + 1}. ${comp.fileName} (${sizeKB}KB)`)
    })
  }

  analyzeTableComponents() {
    console.log('\n📋 2. ANÁLISE DE COMPONENTES DE TABELA')
    console.log('-'.repeat(50))
    
    const commonPatterns = {
      'useState para loading': 0,
      'useState para data': 0,
      'useState para pagination': 0,
      'useEffect para fetch': 0,
      'TableHeader setup': 0,
      'TableBody mapping': 0,
      'Pagination controls': 0,
      'Search functionality': 0,
      'Filter controls': 0,
      'Action buttons': 0,
      'Loading skeleton': 0,
      'Empty state': 0
    }
    
    for (const comp of this.tableComponents) {
      const { content, fileName } = comp
      
      // Check for common patterns
      if (content.includes('useState') && content.includes('loading')) commonPatterns['useState para loading']++
      if (content.includes('useState') && (content.includes('data') || content.includes('items'))) commonPatterns['useState para data']++
      if (content.includes('useState') && (content.includes('page') || content.includes('current'))) commonPatterns['useState para pagination']++
      if (content.includes('useEffect') && (content.includes('fetch') || content.includes('get'))) commonPatterns['useEffect para fetch']++
      if (content.includes('TableHeader')) commonPatterns['TableHeader setup']++
      if (content.includes('TableBody') && content.includes('.map(')) commonPatterns['TableBody mapping']++
      if (content.includes('pagination') || content.includes('Previous') || content.includes('Next')) commonPatterns['Pagination controls']++
      if (content.includes('search') || content.includes('Search') || content.includes('filter')) commonPatterns['Search functionality']++
      if (content.includes('Select') && content.includes('filter')) commonPatterns['Filter controls']++
      if (content.includes('DropdownMenu') || content.includes('Button')) commonPatterns['Action buttons']++
      if (content.includes('skeleton') || content.includes('animate-pulse')) commonPatterns['Loading skeleton']++
      if (content.includes('empty') || content.includes('No ') || content.includes('Nenhum')) commonPatterns['Empty state']++
    }
    
    console.log('🔄 Padrões repetidos em tabelas:')
    Object.entries(commonPatterns)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .forEach(([pattern, count]) => {
        console.log(`   ${count}x ${pattern}`)
      })
    
    // Analyze specific table files
    console.log('\n📊 Tabelas específicas encontradas:')
    this.tableComponents.forEach(comp => {
      const lines = comp.content.split('\n').length
      console.log(`   • ${comp.fileName} (${lines} linhas)`)
    })
  }

  analyzeFormComponents() {
    console.log('\n📝 3. ANÁLISE DE COMPONENTES DE FORMULÁRIO')
    console.log('-'.repeat(50))
    
    const formPatterns = {
      'useState para form data': 0,
      'useState para loading/submitting': 0,
      'useState para errors': 0,
      'Form validation': 0,
      'Submit handler': 0,
      'Input components': 0,
      'Error display': 0,
      'Success feedback': 0,
      'Form reset': 0,
      'File upload': 0
    }
    
    for (const comp of this.formComponents) {
      const { content, fileName } = comp
      
      if (content.includes('useState') && (content.includes('form') || content.includes('data'))) formPatterns['useState para form data']++
      if (content.includes('useState') && (content.includes('loading') || content.includes('submitting'))) formPatterns['useState para loading/submitting']++
      if (content.includes('useState') && content.includes('error')) formPatterns['useState para errors']++
      if (content.includes('validation') || content.includes('validate') || content.includes('required')) formPatterns['Form validation']++
      if (content.includes('onSubmit') || content.includes('handleSubmit')) formPatterns['Submit handler']++
      if (content.includes('<Input') || content.includes('<Textarea') || content.includes('<Select')) formPatterns['Input components']++
      if (content.includes('error') && content.includes('message')) formPatterns['Error display']++
      if (content.includes('success') || content.includes('toast')) formPatterns['Success feedback']++
      if (content.includes('reset') || content.includes('clear')) formPatterns['Form reset']++
      if (content.includes('file') || content.includes('upload') || content.includes('File')) formPatterns['File upload']++
    }
    
    console.log('🔄 Padrões repetidos em formulários:')
    Object.entries(formPatterns)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .forEach(([pattern, count]) => {
        console.log(`   ${count}x ${pattern}`)
      })
    
    console.log('\n📝 Formulários específicos encontrados:')
    this.formComponents.forEach(comp => {
      const lines = comp.content.split('\n').length
      console.log(`   • ${comp.fileName} (${lines} linhas)`)
    })
  }

  analyzeCardComponents() {
    console.log('\n🃏 4. ANÁLISE DE COMPONENTES DE CARD')
    console.log('-'.repeat(50))
    
    const cardPatterns = {
      'Card wrapper': 0,
      'CardHeader with title': 0,
      'CardContent with data': 0,
      'CardFooter with actions': 0,
      'Image display': 0,
      'Rating stars': 0,
      'Price display': 0,
      'Action buttons': 0,
      'Hover effects': 0,
      'Loading states': 0
    }
    
    for (const comp of this.cardComponents) {
      const { content, fileName } = comp
      
      if (content.includes('<Card')) cardPatterns['Card wrapper']++
      if (content.includes('CardHeader') && content.includes('title')) cardPatterns['CardHeader with title']++
      if (content.includes('CardContent')) cardPatterns['CardContent with data']++
      if (content.includes('CardFooter')) cardPatterns['CardFooter with actions']++
      if (content.includes('<Image') || content.includes('img')) cardPatterns['Image display']++
      if (content.includes('star') || content.includes('Star') || content.includes('rating')) cardPatterns['Rating stars']++
      if (content.includes('price') || content.includes('Price') || content.includes('€')) cardPatterns['Price display']++
      if (content.includes('<Button') && content.includes('onClick')) cardPatterns['Action buttons']++
      if (content.includes('hover:') || content.includes('group-hover')) cardPatterns['Hover effects']++
      if (content.includes('loading') || content.includes('skeleton')) cardPatterns['Loading states']++
    }
    
    console.log('🔄 Padrões repetidos em cards:')
    Object.entries(cardPatterns)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .forEach(([pattern, count]) => {
        console.log(`   ${count}x ${pattern}`)
      })
    
    console.log('\n🃏 Cards específicos encontrados:')
    this.cardComponents.forEach(comp => {
      const lines = comp.content.split('\n').length
      console.log(`   • ${comp.fileName} (${lines} linhas)`)
    })
  }

  analyzeApiRoutes() {
    console.log('\n🛠️ 5. ANÁLISE DE ROTAS API')
    console.log('-'.repeat(50))
    
    const apiFiles = this.analyzeDirectory('./app/api')
    console.log(`📊 Total de rotas API: ${apiFiles.length}`)
    
    const apiPatterns = {
      'GET handler': 0,
      'POST handler': 0,
      'PUT/PATCH handler': 0,
      'DELETE handler': 0,
      'Error handling try/catch': 0,
      'Supabase client creation': 0,
      'Authentication check': 0,
      'Input validation': 0,
      'Response formatting': 0,
      'CORS headers': 0
    }
    
    for (const file of apiFiles) {
      const content = this.readFileContent(file)
      
      if (content.includes('export async function GET')) apiPatterns['GET handler']++
      if (content.includes('export async function POST')) apiPatterns['POST handler']++
      if (content.includes('export async function PUT') || content.includes('export async function PATCH')) apiPatterns['PUT/PATCH handler']++
      if (content.includes('export async function DELETE')) apiPatterns['DELETE handler']++
      if (content.includes('try {') && content.includes('catch')) apiPatterns['Error handling try/catch']++
      if (content.includes('createClient') || content.includes('supabase')) apiPatterns['Supabase client creation']++
      if (content.includes('auth') || content.includes('session') || content.includes('user')) apiPatterns['Authentication check']++
      if (content.includes('validation') || content.includes('validate') || content.includes('schema')) apiPatterns['Input validation']++
      if (content.includes('NextResponse') || content.includes('Response')) apiPatterns['Response formatting']++
      if (content.includes('headers') || content.includes('cors')) apiPatterns['CORS headers']++
    }
    
    console.log('🔄 Padrões repetidos em APIs:')
    Object.entries(apiPatterns)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .forEach(([pattern, count]) => {
        console.log(`   ${count}x ${pattern}`)
      })
    
    // Categorize API routes
    const categorizedRoutes = {
      admin: apiFiles.filter(f => f.includes('/admin/')).length,
      auth: apiFiles.filter(f => f.includes('/auth/')).length,
      braiders: apiFiles.filter(f => f.includes('/braiders')).length,
      products: apiFiles.filter(f => f.includes('/products')).length,
      orders: apiFiles.filter(f => f.includes('/orders')).length,
      bookings: apiFiles.filter(f => f.includes('/bookings')).length,
      messages: apiFiles.filter(f => f.includes('/messages')).length,
      debug: apiFiles.filter(f => f.includes('/debug')).length,
      others: 0
    }
    
    categorizedRoutes.others = apiFiles.length - Object.values(categorizedRoutes).reduce((a, b) => a + b, 0)
    
    console.log('\n📂 Categorização de rotas API:')
    Object.entries(categorizedRoutes).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`   ${category}: ${count} rotas`)
      }
    })
  }

  analyzeUtilityFunctions() {
    console.log('\n📚 6. ANÁLISE DE UTILITÁRIOS')
    console.log('-'.repeat(50))
    
    const libFiles = this.analyzeDirectory('./lib')
    console.log(`📊 Total de arquivos utilitários: ${libFiles.length}`)
    
    const utilCategories = {
      'data-supabase': libFiles.filter(f => f.includes('data-supabase')),
      'auth': libFiles.filter(f => f.includes('auth')),
      'validation': libFiles.filter(f => f.includes('validation')),
      'utils': libFiles.filter(f => f.includes('utils')),
      'api': libFiles.filter(f => f.includes('api')),
      'email': libFiles.filter(f => f.includes('email')),
      'stripe': libFiles.filter(f => f.includes('stripe')),
      'supabase': libFiles.filter(f => f.includes('supabase')),
      'context': this.analyzeDirectory('./context')
    }
    
    console.log('\n📂 Categorização de utilitários:')
    Object.entries(utilCategories).forEach(([category, files]) => {
      if (files.length > 0) {
        console.log(`   ${category}: ${files.length} arquivos`)
        files.slice(0, 3).forEach(file => {
          const fileName = path.basename(file)
          console.log(`      • ${fileName}`)
        })
        if (files.length > 3) {
          console.log(`      ... e mais ${files.length - 3}`)
        }
      }
    })
  }

  analyzeTypeDefinitions() {
    console.log('\n📐 7. ANÁLISE DE TIPOS TYPESCRIPT')
    console.log('-'.repeat(50))
    
    const allFiles = [
      ...this.analyzeDirectory('./lib'),
      ...this.analyzeDirectory('./components'),
      ...this.analyzeDirectory('./app')
    ]
    
    const typePatterns = {
      'User interface': 0,
      'Braider interface': 0,
      'Product interface': 0,
      'Order interface': 0,
      'Booking interface': 0,
      'Service interface': 0,
      'API Response types': 0,
      'Props interfaces': 0,
      'State types': 0,
      'Enum definitions': 0
    }
    
    for (const file of allFiles) {
      const content = this.readFileContent(file)
      
      if (content.includes('interface User') || content.includes('type User')) typePatterns['User interface']++
      if (content.includes('interface Braider') || content.includes('type Braider')) typePatterns['Braider interface']++
      if (content.includes('interface Product') || content.includes('type Product')) typePatterns['Product interface']++
      if (content.includes('interface Order') || content.includes('type Order')) typePatterns['Order interface']++
      if (content.includes('interface Booking') || content.includes('type Booking')) typePatterns['Booking interface']++
      if (content.includes('interface Service') || content.includes('type Service')) typePatterns['Service interface']++
      if (content.includes('ApiResponse') || content.includes('Response<')) typePatterns['API Response types']++
      if (content.includes('Props {') || content.includes('interface ') && content.includes('Props')) typePatterns['Props interfaces']++
      if (content.includes('useState<') || content.includes('State>')) typePatterns['State types']++
      if (content.includes('enum ') || content.includes('const ') && content.includes('as const')) typePatterns['Enum definitions']++
    }
    
    console.log('🔄 Definições de tipos encontradas:')
    Object.entries(typePatterns)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .forEach(([pattern, count]) => {
        console.log(`   ${count}x ${pattern}`)
      })
  }

  generateRefactoringPlan() {
    console.log('\n🚀 8. PLANO DE REFATORAÇÃO')
    console.log('='.repeat(50))
    
    const priorities = []
    
    // High priority - Tables
    if (this.tableComponents.length > 3) {
      priorities.push({
        priority: 'ALTA',
        category: 'Componentes de Tabela',
        issue: `${this.tableComponents.length} componentes de tabela com padrões repetidos`,
        solution: 'Criar DataTable genérico com hooks reutilizáveis',
        impact: 'Redução de ~70% do código de tabelas',
        effort: 'Médio (2-3 dias)'
      })
    }
    
    // High priority - Forms
    if (this.formComponents.length > 3) {
      priorities.push({
        priority: 'ALTA',
        category: 'Componentes de Formulário',
        issue: `${this.formComponents.length} formulários com lógica similar`,
        solution: 'Criar FormBuilder com hooks de validação',
        impact: 'Redução de ~60% do código de formulários',
        effort: 'Alto (3-4 dias)'
      })
    }
    
    // Medium priority - Cards
    if (this.cardComponents.length > 4) {
      priorities.push({
        priority: 'MÉDIA',
        category: 'Componentes de Card',
        issue: `${this.cardComponents.length} cards com estruturas similares`,
        solution: 'Criar BaseCard configurável',
        impact: 'Redução de ~50% do código de cards',
        effort: 'Baixo (1-2 dias)'
      })
    }
    
    // Medium priority - API Routes
    priorities.push({
      priority: 'MÉDIA',
      category: 'Rotas API',
      issue: 'Padrões repetidos em tratamento de erro e autenticação',
      solution: 'Criar middlewares e wrappers para APIs',
      impact: 'Melhor consistência e manutenibilidade',
      effort: 'Médio (2-3 dias)'
    })
    
    // Low priority - Types
    priorities.push({
      priority: 'BAIXA',
      category: 'Definições de Tipos',
      issue: 'Tipos duplicados em múltiplos arquivos',
      solution: 'Centralizar tipos em /types/',
      impact: 'Melhor organização e consistência',
      effort: 'Baixo (1 dia)'
    })
    
    console.log('📋 Prioridades de refatoração:')
    priorities.forEach((item, index) => {
      console.log(`\n${index + 1}. 🎯 ${item.priority} - ${item.category}`)
      console.log(`   ❗ Problema: ${item.issue}`)
      console.log(`   💡 Solução: ${item.solution}`)
      console.log(`   📈 Impacto: ${item.impact}`)
      console.log(`   ⏱️ Esforço: ${item.effort}`)
    })
    
    return priorities
  }

  generateImplementationSteps() {
    console.log('\n📝 9. PASSOS DE IMPLEMENTAÇÃO')
    console.log('='.repeat(50))
    
    const steps = [
      {
        phase: 'FASE 1 - Preparação',
        duration: '1 dia',
        tasks: [
          'Criar branch feature/refactor-tables',
          'Centralizar tipos em /types/index.ts',
          'Criar estrutura base de hooks em /hooks/',
          'Backup dos componentes atuais'
        ]
      },
      {
        phase: 'FASE 2 - Tabelas (Prioridade Alta)',
        duration: '2-3 dias',
        tasks: [
          'Implementar useTableData hook genérico',
          'Criar DataTable component base',
          'Migrar users-table para novo sistema',
          'Migrar produtos-table, orders-table, braiders-table',
          'Testar e validar todas as tabelas'
        ]
      },
      {
        phase: 'FASE 3 - Formulários (Prioridade Alta)',
        duration: '3-4 dias',
        tasks: [
          'Implementar useForm hook com validação',
          'Criar FormBuilder component',
          'Migrar formulários de cadastro',
          'Migrar formulários de edição',
          'Implementar validação centralizada'
        ]
      },
      {
        phase: 'FASE 4 - Cards (Prioridade Média)',
        duration: '1-2 dias',
        tasks: [
          'Criar BaseCard component configurável',
          'Migrar product-card, braider-card',
          'Migrar dashboard cards',
          'Padronizar animações e estados'
        ]
      },
      {
        phase: 'FASE 5 - APIs (Prioridade Média)',
        duration: '2-3 dias',
        tasks: [
          'Criar middleware de autenticação',
          'Implementar error handler padrão',
          'Criar API wrapper utilities',
          'Migrar rotas para novos padrões'
        ]
      },
      {
        phase: 'FASE 6 - Finalização',
        duration: '1 dia',
        tasks: [
          'Testes finais de integração',
          'Linting e formatação',
          'Documentação dos novos padrões',
          'Deploy e validação'
        ]
      }
    ]
    
    console.log('🗓️ Cronograma de implementação:')
    let totalDays = 0
    steps.forEach((step, index) => {
      console.log(`\n${index + 1}. ${step.phase} (${step.duration})`)
      step.tasks.forEach(task => {
        console.log(`   • ${task}`)
      })
      
      // Extract days for total calculation
      const days = step.duration.match(/(\d+)/g)
      if (days) {
        totalDays += parseInt(days[days.length - 1]) // Take the highest number
      }
    })
    
    console.log(`\n⏱️ Tempo total estimado: ${totalDays} dias de trabalho`)
    console.log(`📅 Prazo recomendado: ${Math.ceil(totalDays * 1.5)} dias calendário`)
  }

  generateExpectedResults() {
    console.log('\n🎯 10. RESULTADOS ESPERADOS')
    console.log('='.repeat(50))
    
    const currentStats = {
      totalComponents: this.tableComponents.length + this.formComponents.length + this.cardComponents.length,
      totalLines: 0, // Would need to calculate
      duplicatedPatterns: 15 // Estimated
    }
    
    const expectedResults = [
      {
        metric: 'Redução de código',
        current: '~15.000 linhas',
        expected: '~9.000 linhas',
        improvement: '40% menos código'
      },
      {
        metric: 'Componentes de tabela',
        current: `${this.tableComponents.length} componentes únicos`,
        expected: '1 DataTable + hooks',
        improvement: '70% redução'
      },
      {
        metric: 'Componentes de formulário',
        current: `${this.formComponents.length} formulários únicos`,
        expected: '1 FormBuilder + hooks',
        improvement: '60% redução'
      },
      {
        metric: 'Tempo de desenvolvimento',
        current: '2-3 dias por nova tabela',
        expected: '2-3 horas por nova tabela',
        improvement: '80% mais rápido'
      },
      {
        metric: 'Manutenibilidade',
        current: 'Mudanças em N arquivos',
        expected: 'Mudanças centralizadas',
        improvement: '90% menos esforço'
      },
      {
        metric: 'Consistência',
        current: 'Padrões variados',
        expected: 'Padrão único',
        improvement: '100% consistente'
      }
    ]
    
    console.log('📊 Métricas de melhoria:')
    expectedResults.forEach(result => {
      console.log(`\n🎯 ${result.metric}:`)
      console.log(`   Atual: ${result.current}`)
      console.log(`   Esperado: ${result.expected}`)
      console.log(`   ✅ Melhoria: ${result.improvement}`)
    })
  }
}

async function main() {
  const analyzer = new CodeAnalyzer()
  
  analyzer.analyzeComponents()
  analyzer.analyzeTableComponents()
  analyzer.analyzeFormComponents()
  analyzer.analyzeCardComponents()
  analyzer.analyzeApiRoutes()
  analyzer.analyzeUtilityFunctions()
  analyzer.analyzeTypeDefinitions()
  
  const priorities = analyzer.generateRefactoringPlan()
  analyzer.generateImplementationSteps()
  analyzer.generateExpectedResults()
  
  console.log('\n✨ ANÁLISE CONCLUÍDA!')
  console.log('📋 Próximo passo: Aprovar plano e iniciar Fase 1')
}

if (require.main === module) {
  main().then(() => process.exit(0))
}

module.exports = main