#!/usr/bin/env node

/**
 * Script para setup completo do sistema de promoções
 * Execute: node scripts/setup-promotions.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`${colors.blue}[${step}]${colors.reset} ${message}`);
}

async function executePhase(phase, description) {
  logStep(phase.toUpperCase(), `Executando: ${description}...`);
  
  try {
    const response = await fetch('http://localhost:3001/api/setup/promotions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phase })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    log(`✅ ${result.message}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erro na fase ${phase}: ${error.message}`, 'red');
    return false;
  }
}

async function checkStatus() {
  try {
    const response = await fetch('http://localhost:3001/api/setup/promotions');
    const result = await response.json();
    
    if (!response.ok) {
      if (response.status === 403) {
        log('❌ Acesso negado! Você precisa estar logado como ADMIN.', 'red');
        log('💡 Faça login no site como admin e tente novamente.', 'yellow');
        return false;
      }
      throw new Error(result.error);
    }

    log('📊 Status do Sistema:', 'bold');
    log(`   Tabelas encontradas: ${result.existing_tables.length}/6`, 'blue');
    log(`   Setup completo: ${result.setup_complete ? '✅ Sim' : '❌ Não'}`, result.setup_complete ? 'green' : 'red');
    
    if (result.existing_tables.length > 0) {
      log('   Tabelas existentes:', 'yellow');
      result.existing_tables.forEach(table => {
        log(`   - ${table}`, 'yellow');
      });
    }

    return result.setup_complete;
  } catch (error) {
    log(`❌ Erro ao verificar status: ${error.message}`, 'red');
    return null;
  }
}

async function setupPromotions() {
  log('🚀 SETUP DO SISTEMA DE PROMOÇÕES - WILNARA TRANÇAS', 'bold');
  log('=' * 60, 'blue');
  
  // Verificar status atual
  log('\n1. Verificando status atual...', 'yellow');
  const isComplete = await checkStatus();
  
  if (isComplete === false) {
    return; // Erro de autenticação
  }
  
  if (isComplete === true) {
    log('\n✅ Sistema já está configurado!', 'green');
    
    return new Promise((resolve) => {
      rl.question('\n🔄 Deseja recriar as tabelas? (y/N): ', (answer) => {
        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          log('✅ Setup cancelado. Sistema já está funcionando.', 'green');
          rl.close();
          resolve();
          return;
        }
        
        log('\n⚠️  ATENÇÃO: Isto irá recriar todas as tabelas!', 'yellow');
        rl.question('Tem certeza? Digite "CONFIRMO" para continuar: ', async (confirm) => {
          if (confirm !== 'CONFIRMO') {
            log('❌ Setup cancelado.', 'red');
            rl.close();
            resolve();
            return;
          }
          
          await runSetup();
          resolve();
        });
      });
    });
  }
  
  // Status não pôde ser verificado ou setup incompleto
  await runSetup();
}

async function runSetup() {
  log('\n2. Iniciando setup das tabelas...', 'yellow');
  
  const phases = [
    { phase: 'schema', description: 'Criando tabelas principais' },
    { phase: 'indexes', description: 'Criando índices para performance' },
    { phase: 'rls', description: 'Configurando políticas de segurança (RLS)' },
    { phase: 'seed', description: 'Inserindo dados iniciais' }
  ];

  let success = true;
  
  for (const { phase, description } of phases) {
    const result = await executePhase(phase, description);
    if (!result) {
      success = false;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre fases
  }

  log('\n' + '='.repeat(60), 'blue');
  
  if (success) {
    log('🎉 SETUP COMPLETO! Sistema de promoções configurado com sucesso!', 'green');
    log('', '');
    log('📋 O que foi criado:', 'bold');
    log('   ✅ 6 tabelas principais (promotions, settings, analytics, etc.)', 'green');
    log('   ✅ Índices de performance', 'green');
    log('   ✅ Políticas de segurança (RLS)', 'green');
    log('   ✅ Configurações iniciais (modo GRATUITO)', 'green');
    log('   ✅ 3 pacotes de exemplo', 'green');
    log('', '');
    log('🔥 Próximos passos:', 'yellow');
    log('   1. Implementar APIs de promoção (/api/promotions/*)', 'yellow');
    log('   2. Criar interface no dashboard admin', 'yellow');
    log('   3. Criar interface no dashboard trancista', 'yellow');
    log('   4. Para ativar cobrança: chamar enable_paid_mode()', 'yellow');
    log('', '');
    log('💡 Sistema iniciado em MODO GRATUITO para testes!', 'blue');
  } else {
    log('❌ Setup falhou! Verifique os erros acima.', 'red');
    log('💡 Certifique-se de que:', 'yellow');
    log('   - Está logado como admin no site', 'yellow');
    log('   - O servidor Next.js está rodando', 'yellow');
    log('   - A conexão com Supabase está funcionando', 'yellow');
  }
  
  rl.close();
}

// Executar o setup
setupPromotions().catch(error => {
  log(`❌ Erro fatal: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});

// Lidar com Ctrl+C
process.on('SIGINT', () => {
  log('\n\n👋 Setup interrompido pelo usuário.', 'yellow');
  rl.close();
  process.exit(0);
});