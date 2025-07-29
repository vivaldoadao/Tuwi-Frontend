#!/usr/bin/env node

/**
 * Script para alternar entre dados mock e Supabase
 * 
 * Usage:
 *   node scripts/switch-to-supabase.js --to=supabase
 *   node scripts/switch-to-supabase.js --to=mock
 */

const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const toArg = args.find(arg => arg.startsWith('--to='))

if (!toArg) {
  console.error('❌ Erro: Use --to=supabase ou --to=mock')
  process.exit(1)
}

const target = toArg.split('=')[1]

if (!['supabase', 'mock'].includes(target)) {
  console.error('❌ Erro: Use --to=supabase ou --to=mock')
  process.exit(1)
}

const dataPath = path.join(__dirname, '..', 'lib', 'data.ts')
const supabasePath = path.join(__dirname, '..', 'lib', 'data-supabase.ts')
const mockBackupPath = path.join(__dirname, '..', 'lib', 'data-mock.ts.backup')

function switchToSupabase() {
  console.log('🔄 Alternando para dados do Supabase...')
  
  // Backup do arquivo atual se não existir
  if (fs.existsSync(dataPath) && !fs.existsSync(mockBackupPath)) {
    fs.copyFileSync(dataPath, mockBackupPath)
    console.log('✅ Backup dos dados mock criado')
  }
  
  // Copiar arquivo do Supabase
  if (fs.existsSync(supabasePath)) {
    fs.copyFileSync(supabasePath, dataPath)
    console.log('✅ Dados do Supabase ativados')
  } else {
    console.error('❌ Arquivo data-supabase.ts não encontrado')
    process.exit(1)
  }
  
  console.log('🎉 Migração para Supabase concluída!')
  console.log('💡 Execute: npm run dev para testar')
}

function switchToMock() {
  console.log('🔄 Alternando para dados mock...')
  
  // Restaurar backup
  if (fs.existsSync(mockBackupPath)) {
    fs.copyFileSync(mockBackupPath, dataPath)
    console.log('✅ Dados mock restaurados')
  } else {
    console.error('❌ Backup dos dados mock não encontrado')
    console.log('💡 Você precisará restaurar manualmente o arquivo lib/data.ts original')
    process.exit(1)
  }
  
  console.log('🎉 Restauração para dados mock concluída!')
  console.log('💡 Execute: npm run dev para testar')
}

if (target === 'supabase') {
  switchToSupabase()
} else {
  switchToMock()
}

console.log('\n📝 Lembre-se de:')
console.log('   • Verificar se as variáveis de ambiente estão configuradas')
console.log('   • Executar o script de migração se necessário')
console.log('   • Testar todas as funcionalidades')