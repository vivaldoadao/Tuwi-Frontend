# APIs Públicas de Portugal - Integração

Este documento descreve como utilizamos APIs públicas oficiais portuguesas para obter dados geográficos atualizados automaticamente.

## APIs Utilizadas

### 1. GEO API PT (https://geoapi.pt/)
- **Descrição**: API gratuita com dados oficiais de regiões administrativas portuguesas
- **Endpoints**:
  - `/municipios` - Lista todos os municípios de Portugal
  - `/distritos` - Estrutura hierárquica de distritos e concelhos
- **Vantagens**: Dados estruturados e atualizados
- **Limitações**: Pode ter indisponibilidades ocasionais

### 2. IPMA - Instituto Português do Mar e da Atmosfera (https://api.ipma.pt/)
- **Descrição**: API oficial do governo português
- **Endpoints**:
  - `/open-data/distrits-islands.json` - Distritos e ilhas com coordenadas
- **Vantagens**: Fonte oficial, inclui coordenadas geográficas
- **Limitações**: Estrutura mais simples

## Implementação no Projeto

### Arquivo Principal: `lib/portugal-api.ts`

```typescript
import { getMunicipios, getDistritos, getConcelhosByDistrito } from '@/lib/portugal-api'

// Buscar todos os municípios
const municipios = await getMunicipios()

// Buscar distritos com estrutura
const distritos = await getDistritos()

// Buscar concelhos de um distrito
const concelhos = await getConcelhosByDistrito('Lisboa')
```

### Hook Personalizado: `hooks/usePortugalLocation.ts`

```typescript
import { usePortugalLocation } from '@/hooks/usePortugalLocation'

function MyComponent() {
  const { 
    distritos, 
    concelhos, 
    loading, 
    error, 
    loadConcelhos 
  } = usePortugalLocation()

  // Carregar concelhos quando distrito muda
  useEffect(() => {
    if (selectedDistrito) {
      loadConcelhos(selectedDistrito)
    }
  }, [selectedDistrito])

  return (
    // Seu JSX aqui
  )
}
```

### Componente de Seleção: `components/ui/portugal-location-selector.tsx`

```typescript
import PortugalLocationSelector from '@/components/ui/portugal-location-selector'

function RegistrationForm() {
  const [distrito, setDistrito] = useState('')
  const [concelho, setConcelho] = useState('')
  const [freguesia, setFreguesia] = useState('')

  return (
    <PortugalLocationSelector
      selectedDistrito={distrito}
      selectedConcelho={concelho}
      selectedFreguesia={freguesia}
      onDistritoChange={setDistrito}
      onConcelhoChange={setConcelho}
      onFreguesiaChange={setFreguesia}
    />
  )
}
```

## Características

### ✅ Vantagens

1. **Dados Atualizados**: APIs oficiais mantidas pelo governo português
2. **Cache Inteligente**: Sistema de cache para otimizar performance
3. **Fallback Robusto**: Dados locais caso as APIs falhem
4. **Verificação de Status**: Monitoramento da disponibilidade das APIs
5. **TypeScript**: Tipagem completa para melhor desenvolvimento
6. **Gratuito**: Todas as APIs são de uso gratuito

### ⚠️ Considerações

1. **Dependência Externa**: Requer conexão à internet
2. **Disponibilidade**: APIs podem ter manutenções ou indisponibilidades
3. **Rate Limiting**: Possíveis limitações de taxa (não documentadas)
4. **Dados de Freguesias**: Nem todas as APIs fornecem dados de freguesias

## Monitoramento

### Verificar Status das APIs

```typescript
import { checkAPIStatus } from '@/lib/portugal-api'

const status = await checkAPIStatus()
console.log('GEO API PT:', status.geoapi ? '✅' : '❌')
console.log('IPMA:', status.ipma ? '✅' : '❌')
```

### Limpar Cache (Desenvolvimento)

```typescript
import { clearCache } from '@/lib/portugal-api'

// Limpar cache para forçar recarregamento
clearCache()
```

## Migração dos Dados Estáticos

### Antes (Dados Estáticos)
```typescript
const portugalDistricts = {
  "Aveiro": {
    concelhos: {
      "Águeda": ["Águeda", "Barrô", ...],
      // ... mais dados manuais
    }
  }
}
```

### Depois (APIs Dinâmicas)
```typescript
// Dados carregados automaticamente das APIs oficiais
const distritos = await getDistritos()
const concelhos = await getConcelhosByDistrito('Aveiro')
```

## Implementação no Formulário de Registro

O componente `PortugalLocationSelector` pode ser integrado diretamente no formulário de registro de trancistas, substituindo os selects manuais por dados dinâmicos.

### Benefícios Imediatos

1. **Redução de Código**: Elimina ~500 linhas de dados estáticos
2. **Precisão**: Dados sempre atualizados
3. **Performance**: Carregamento sob demanda
4. **Manutenibilidade**: Sem necessidade de atualizar manualmente

## Próximos Passos

1. **Integrar no Formulário**: Substituir selects estáticos
2. **Implementar Freguesias**: Quando API disponível
3. **Analytics**: Monitorar uso das APIs
4. **Cache Persistente**: Considerar localStorage para cache de longa duração

## Recursos Adicionais

- [Portal de Dados Abertos de Portugal](https://dados.gov.pt/)
- [Direção-Geral do Território](https://www.dgterritorio.gov.pt/)
- [CAOP 2024 - Carta Administrativa Oficial](https://github.com/dgterritorio/CAOP)

---

*Documentação atualizada: Janeiro 2025*