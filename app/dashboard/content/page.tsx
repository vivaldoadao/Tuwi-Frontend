"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  FileText, 
  Edit, 
  Save,
  X,
  Plus,
  Home,
  Users,
  Phone,
  Info,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Type,
  Code,
  Palette,
  Eye,
  EyeOff,
  Trash2,
  ToggleLeft,
  ToggleRight
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/context/auth-context"
import { toast } from "react-hot-toast"
import { ImageUploadPreview } from "@/components/image-upload-preview"

interface SiteContent {
  id: string
  key: string
  title: string
  content_type: 'text' | 'html' | 'image' | 'json'
  content: string
  meta_data: Record<string, any>
  page_section: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  updated_by: string
}


interface ContentSection {
  id: string
  name: string
  description: string
  icon: any
  color: string
  contents: SiteContent[]
}

// Componente para edição inline
function InlineEditor({ content, onSave, onCancel }: {
  content: SiteContent
  onSave: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(content.content || '')

  const handleSave = () => {
    onSave(value)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Editando: {content.title}</Label>
        {content.content_type === 'html' ? (
          <Textarea 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder="Digite o conteúdo HTML..."
            className="font-mono text-sm"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Digite o conteúdo..."
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-1" />
          Salvar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// Componente para editar slide do hero
function HeroSlideEditor({ content, onSave, onCancel }: { 
  content: SiteContent, 
  onSave: (data: any) => void,
  onCancel: () => void 
}) {
  const [slideData, setSlideData] = useState(() => {
    try {
      return JSON.parse(content.content || '{}')
    } catch {
      return {
        title: '',
        subtitle: '',
        description: '',
        imageUrl: '',
        ctaText: '',
        ctaLink: '',
        secondaryCtaText: '',
        secondaryCtaLink: ''
      }
    }
  })

  const handleSave = () => {
    onSave({
      ...content,
      content: JSON.stringify(slideData, null, 2)
    })
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Slide do Hero - {content.title}</DialogTitle>
          <DialogDescription>
            Configure as informações do slide do carousel principal
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título Principal</Label>
              <Input 
                value={slideData.title || ''}
                onChange={(e) => setSlideData({...slideData, title: e.target.value})}
                placeholder="Ex: WILNARA TRANÇAS"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Input 
                value={slideData.subtitle || ''}
                onChange={(e) => setSlideData({...slideData, subtitle: e.target.value})}
                placeholder="Ex: Box Braids Elegantes"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea 
              value={slideData.description || ''}
              onChange={(e) => setSlideData({...slideData, description: e.target.value})}
              placeholder="Descrição atrativa do slide..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <ImageUploadPreview
              value={slideData.imageUrl || ''}
              onChange={(url) => setSlideData({...slideData, imageUrl: url})}
              folder="hero"
              label="Imagem do Slide"
              placeholder="URL da imagem do slide ou faça upload"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Botão Principal - Texto</Label>
              <Input 
                value={slideData.ctaText || ''}
                onChange={(e) => setSlideData({...slideData, ctaText: e.target.value})}
                placeholder="Ex: Compre Agora"
              />
            </div>
            <div className="space-y-2">
              <Label>Botão Principal - Link</Label>
              <Input 
                value={slideData.ctaLink || ''}
                onChange={(e) => setSlideData({...slideData, ctaLink: e.target.value})}
                placeholder="/products"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Botão Secundário - Texto</Label>
              <Input 
                value={slideData.secondaryCtaText || ''}
                onChange={(e) => setSlideData({...slideData, secondaryCtaText: e.target.value})}
                placeholder="Ex: Ver Trancistas"
              />
            </div>
            <div className="space-y-2">
              <Label>Botão Secundário - Link</Label>
              <Input 
                value={slideData.secondaryCtaLink || ''}
                onChange={(e) => setSlideData({...slideData, secondaryCtaLink: e.target.value})}
                placeholder="/braiders"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h4 className="font-semibold mb-3">Preview do Slide:</h4>
            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg overflow-hidden min-h-[300px] flex items-center">
              {/* Background Image */}
              {slideData.imageUrl && (
                <div className="absolute inset-0">
                  <img 
                    src={slideData.imageUrl} 
                    alt="Background" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide broken image and show gradient background
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>
              )}
              
              <div className="relative z-10 max-w-2xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  {slideData.title || 'Título Principal'}
                </h1>
                <h2 className="text-xl md:text-2xl mb-4 text-purple-200">
                  {slideData.subtitle || 'Subtítulo do Slide'}
                </h2>
                <p className="mb-6 opacity-90 text-lg leading-relaxed">
                  {slideData.description || 'Descrição atrativa do slide que convida o usuário a tomar uma ação...'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-shadow">
                    {slideData.ctaText || 'CTA Principal'}
                  </div>
                  <div className="border-2 border-white text-white px-6 py-3 rounded-full hover:bg-white hover:text-purple-600 transition-colors">
                    {slideData.secondaryCtaText || 'CTA Secundário'}
                  </div>
                </div>
              </div>
            </div>
            
            {slideData.imageUrl && (
              <p className="text-xs text-gray-500 mt-2">
                ✅ Imagem de fundo aplicada no preview
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Slide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente para editar conteúdo simples
function ContentEditor({ content, onSave, onCancel }: { 
  content: SiteContent, 
  onSave: (data: any) => void,
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    title: content.title,
    content: content.content || '',
    is_active: content.is_active
  })

  const handleSave = () => {
    onSave({
      ...content,
      ...formData
    })
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Conteúdo - {content.title}</DialogTitle>
          <DialogDescription>
            Edite o conteúdo da seção {content.page_section}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Conteúdo</Label>
            {content.content_type === 'image' ? (
              <ImageUploadPreview
                value={formData.content}
                onChange={(url) => setFormData({...formData, content: url})}
                folder={content.page_section}
                label=""
                placeholder="URL da imagem ou faça upload"
              />
            ) : (
              <Textarea 
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={content.content_type === 'html' ? 8 : 4}
                placeholder={content.content_type === 'html' ? 'HTML permitido...' : 'Digite o conteúdo...'}
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
            />
            <Label>Conteúdo ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ContentManagementPage() {
  const { user } = useAuth()
  const [contents, setContents] = useState<SiteContent[]>([])
  const [loading, setLoading] = useState(true)
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null)
  const [deletingContent, setDeletingContent] = useState<SiteContent | null>(null)
  const [uploadingImage, setUploadingImage] = useState<SiteContent | null>(null)
  const [inlineEditing, setInlineEditing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    try {
      const response = await fetch('/api/admin/content')
      if (!response.ok) throw new Error('Failed to fetch contents')
      const data = await response.json()
      setContents(data.contents || [])
    } catch (error) {
      console.error('Error fetching contents:', error)
      toast.error('Erro ao carregar conteúdos')
    } finally {
      setLoading(false)
    }
  }


  const handleSaveContent = async (contentData: SiteContent) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData)
      })

      if (!response.ok) throw new Error('Failed to save content')
      
      toast.success('Conteúdo atualizado!')
      setEditingContent(null)
      fetchContents()
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Erro ao salvar conteúdo')
    }
  }

  const handleDeleteContent = async () => {
    if (!deletingContent) return

    try {
      const response = await fetch(`/api/admin/content?id=${deletingContent.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete content')
      
      toast.success('Slide apagado com sucesso!')
      setDeletingContent(null)
      fetchContents()
    } catch (error) {
      console.error('Error deleting content:', error)
      toast.error('Erro ao apagar slide')
    }
  }

  const handleToggleActive = async (content: SiteContent) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          is_active: !content.is_active
        })
      })

      if (!response.ok) throw new Error('Failed to toggle content')
      
      toast.success(`Conteúdo ${!content.is_active ? 'ativado' : 'desativado'}!`)
      fetchContents()
    } catch (error) {
      console.error('Error toggling content:', error)
      toast.error('Erro ao alterar status do conteúdo')
    }
  }

  const toggleInlineEdit = (contentId: string) => {
    setInlineEditing(prev => ({
      ...prev,
      [contentId]: !prev[contentId]
    }))
  }

  const handleInlineEdit = async (content: SiteContent, newValue: string) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          content: newValue
        })
      })

      if (!response.ok) throw new Error('Failed to save content')
      
      toast.success('Conteúdo atualizado!')
      setInlineEditing(prev => ({ ...prev, [content.id]: false }))
      fetchContents()
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Erro ao salvar conteúdo')
    }
  }

  const handleImageUpload = async (imageUrl: string) => {
    if (!uploadingImage) return

    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...uploadingImage,
          content: imageUrl
        })
      })

      if (!response.ok) throw new Error('Failed to save image')
      
      toast.success('Imagem atualizada!')
      setUploadingImage(null)
      fetchContents()
    } catch (error) {
      console.error('Error saving image:', error)
      toast.error('Erro ao salvar imagem')
    }
  }

  const handleCreateHeroSlide = async () => {
    const heroContents = contents.filter(c => c.page_section === 'hero')
    const nextOrder = Math.max(...heroContents.map(c => c.display_order), 0) + 1
    const slideNumber = heroContents.length + 1

    const newSlideData = {
      title: 'WILNARA TRANÇAS',
      subtitle: `Novo Slide ${slideNumber}`,
      description: 'Adicione aqui a descrição do seu novo slide.',
      imageUrl: '',
      ctaText: 'Ver Produtos',
      ctaLink: '/products',
      secondaryCtaText: 'Ver Trancistas',
      secondaryCtaLink: '/braiders'
    }

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `hero_slide_${Date.now()}`,
          title: `Hero Slide ${slideNumber}`,
          content_type: 'json',
          content: JSON.stringify(newSlideData, null, 2),
          page_section: 'hero',
          display_order: nextOrder,
          meta_data: { type: 'slide' },
          is_active: true
        })
      })

      if (!response.ok) throw new Error('Failed to create slide')
      
      toast.success('Novo slide criado com sucesso!')
      fetchContents()
    } catch (error) {
      console.error('Error creating slide:', error)
      toast.error('Erro ao criar novo slide')
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'text': return Type
      case 'html': return Code
      case 'image': return ImageIcon
      case 'json': return SettingsIcon
      default: return FileText
    }
  }

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-700'
      case 'html': return 'bg-green-100 text-green-700'
      case 'image': return 'bg-purple-100 text-purple-700'
      case 'json': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Organizar conteúdos por seção
  const contentSections: ContentSection[] = [
    {
      id: 'hero',
      name: 'Hero / Carousel Principal',
      description: 'Slides do carousel da página inicial',
      icon: Palette,
      color: 'from-purple-500 to-pink-500',
      contents: contents.filter(c => c.page_section === 'hero')
    },
    {
      id: 'homepage',
      name: 'Página Principal',
      description: 'Conteúdos da homepage (títulos, textos)',
      icon: Home,
      color: 'from-blue-500 to-cyan-500',
      contents: contents.filter(c => c.page_section === 'homepage')
    },
    {
      id: 'about',
      name: 'Sobre Nós',
      description: 'Textos e informações da página sobre',
      icon: Info,
      color: 'from-green-500 to-emerald-500',
      contents: contents.filter(c => c.page_section === 'about')
    },
    {
      id: 'contact',
      name: 'Contato',
      description: 'Informações de contato e localização',
      icon: Phone,
      color: 'from-orange-500 to-red-500',
      contents: contents.filter(c => c.page_section === 'contact')
    },
    {
      id: 'footer',
      name: 'Rodapé',
      description: 'Links sociais e informações do rodapé',
      icon: Users,
      color: 'from-gray-500 to-slate-500',
      contents: contents.filter(c => c.page_section === 'footer')
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando gestão de conteúdo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            Gestão de Conteúdo
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie o conteúdo e configurações do site de forma visual e intuitiva
          </p>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid gap-8">
        {contentSections.map((section) => (
          <Card key={section.id} className="overflow-hidden border-0 shadow-lg">
            <CardHeader className={`bg-gradient-to-r ${section.color} text-white`}>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xl">
                  <section.icon className="h-6 w-6" />
                  {section.name}
                  <Badge className="bg-white/20 text-white border-white/30">
                    {section.contents.length} itens
                  </Badge>
                </div>
                {section.id === 'hero' && (
                  <Button
                    onClick={handleCreateHeroSlide}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Slide
                  </Button>
                )}
              </CardTitle>
              <p className="text-white/90 text-sm">{section.description}</p>
            </CardHeader>
            
            <CardContent className="p-6">
              {section.contents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum conteúdo encontrado nesta seção</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {section.contents
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((content) => {
                      const IconComponent = getContentIcon(content.content_type)
                      return (
                        <div key={content.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className={`p-2 rounded-lg ${getContentTypeColor(content.content_type)}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm mb-1">{content.title}</h4>
                                <p className="text-xs text-gray-500 mb-2">Chave: {content.key}</p>
                                
                                {/* Conteúdo ou Editor Inline */}
                                <div className="bg-white p-3 rounded-lg border text-sm">
                                  {inlineEditing[content.id] && content.page_section !== 'hero' && content.content_type !== 'image' ? (
                                    <InlineEditor
                                      content={content}
                                      onSave={(value) => handleInlineEdit(content, value)}
                                      onCancel={() => toggleInlineEdit(content.id)}
                                    />
                                  ) : content.content_type === 'json' && content.page_section === 'hero' ? (
                                    (() => {
                                      try {
                                        const slideData = JSON.parse(content.content || '{}')
                                        return (
                                          <div className="space-y-3">
                                            <div className="grid grid-cols-1 gap-2">
                                              <div><strong>Título:</strong> {slideData.title}</div>
                                              <div><strong>Subtítulo:</strong> {slideData.subtitle}</div>
                                              <div className="text-gray-600 text-xs">{slideData.description}</div>
                                            </div>
                                            {slideData.imageUrl && (
                                              <div className="mt-3">
                                                <div className="relative w-full h-20 bg-gray-100 rounded overflow-hidden">
                                                  <img 
                                                    src={slideData.imageUrl} 
                                                    alt="Slide preview" 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                      e.currentTarget.style.display = 'none'
                                                    }}
                                                  />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">🖼️ Imagem do slide</p>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      } catch {
                                        return <span className="text-red-500">JSON inválido</span>
                                      }
                                    })()
                                  ) : content.content_type === 'json' && content.page_section !== 'hero' ? (
                                    (() => {
                                      try {
                                        const jsonData = JSON.parse(content.content || '{}')
                                        
                                        // Renderização específica baseada no tipo de conteúdo JSON
                                        if (content.key === 'about_values' && Array.isArray(jsonData)) {
                                          return (
                                            <div className="space-y-3">
                                              <p className="text-sm font-medium text-gray-700">📋 Lista de Valores ({jsonData.length} itens):</p>
                                              <div className="space-y-2">
                                                {jsonData.slice(0, 2).map((item, index) => (
                                                  <div key={index} className="bg-blue-50 p-2 rounded text-xs">
                                                    <div className="flex items-start gap-2">
                                                      <span className="text-blue-600 font-medium">•</span>
                                                      <div>
                                                        <p className="font-medium text-blue-800">{item.title}</p>
                                                        <p className="text-blue-700 mt-1">{item.description?.substring(0, 80)}...</p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                                {jsonData.length > 2 && (
                                                  <p className="text-xs text-gray-500 italic">+ {jsonData.length - 2} valores adicionais</p>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        } else if (content.key === 'about_statistics' && Array.isArray(jsonData)) {
                                          return (
                                            <div className="space-y-2">
                                              <p className="text-sm font-medium text-gray-700">📊 Estatísticas ({jsonData.length} métricas):</p>
                                              <div className="grid grid-cols-2 gap-2">
                                                {jsonData.map((stat, index) => (
                                                  <div key={index} className="bg-green-50 p-2 rounded text-xs text-center">
                                                    <p className="font-bold text-green-800 text-lg">{stat.value}</p>
                                                    <p className="text-green-700">{stat.label}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )
                                        } else if (content.key === 'contact_hours') {
                                          return (
                                            <div className="space-y-2">
                                              <p className="text-sm font-medium text-gray-700">🕐 Horário de Funcionamento:</p>
                                              <div className="bg-orange-50 p-2 rounded text-xs space-y-1">
                                                <p><span className="font-medium">Segunda-Sexta:</span> {jsonData.weekdays}</p>
                                                <p><span className="font-medium">Sábado:</span> {jsonData.saturday}</p>
                                                <p><span className="font-medium">Domingo:</span> {jsonData.sunday}</p>
                                              </div>
                                            </div>
                                          )
                                        } else if (content.key === 'contact_location') {
                                          return (
                                            <div className="space-y-2">
                                              <p className="text-sm font-medium text-gray-700">📍 Informações de Localização:</p>
                                              <div className="bg-purple-50 p-2 rounded text-xs space-y-1">
                                                <p><span className="font-medium">Nome:</span> {jsonData.name}</p>
                                                <p><span className="font-medium">Endereço:</span> {jsonData.address}</p>
                                                <p><span className="font-medium">CEP:</span> {jsonData.postal}</p>
                                                {jsonData.note && (
                                                  <p className="text-purple-600 italic mt-1">{jsonData.note}</p>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        } else {
                                          // Fallback para outros tipos de JSON
                                          const jsonKeys = Object.keys(jsonData).slice(0, 3)
                                          return (
                                            <div className="space-y-2">
                                              <p className="text-sm font-medium text-gray-700">🔧 Dados JSON ({jsonKeys.length} propriedades):</p>
                                              <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
                                                {jsonKeys.map(key => (
                                                  <p key={key}>
                                                    <span className="font-medium">{key}:</span> {String(jsonData[key]).substring(0, 50)}...
                                                  </p>
                                                ))}
                                              </div>
                                            </div>
                                          )
                                        }
                                      } catch {
                                        return <span className="text-red-500 text-xs">⚠️ JSON inválido - necessita correção</span>
                                      }
                                    })()
                                  ) : content.content_type === 'image' ? (
                                    <div className="space-y-2">
                                      {content.content ? (
                                        <div>
                                          <div className="relative w-full h-24 bg-gray-100 rounded overflow-hidden mb-2">
                                            <img 
                                              src={content.content} 
                                              alt={content.title} 
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                              }}
                                            />
                                          </div>
                                          <p className="text-xs text-gray-500 break-all">{content.content}</p>
                                        </div>
                                      ) : (
                                        <p className="text-gray-500 italic">Nenhuma imagem definida</p>
                                      )}
                                    </div>
                                  ) : content.content_type === 'html' ? (
                                    <div className="text-gray-600" dangerouslySetInnerHTML={{ 
                                      __html: content.content?.substring(0, 150) + '...' || '' 
                                    }} />
                                  ) : (
                                    <p className="text-gray-600 line-clamp-2">
                                      {content.content?.substring(0, 200) || 'Conteúdo vazio'}...
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                  {content.is_active ? (
                                    <Eye className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {content.is_active ? 'Ativo' : 'Inativo'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1 ml-3">
                                  {/* Botão Toggle Ativo/Inativo */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleActive(content)}
                                    className={`${content.is_active ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                                    title={content.is_active ? 'Desativar' : 'Ativar'}
                                  >
                                    {content.is_active ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                  
                                  {/* Botão Editar */}
                                  {content.content_type === 'image' && content.page_section === 'about' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setUploadingImage(content)}
                                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                      title="Upload de Imagem"
                                    >
                                      <ImageIcon className="h-4 w-4" />
                                    </Button>
                                  ) : content.content_type === 'json' && content.page_section === 'hero' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingContent(content)}
                                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                      title="Editar Slide"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => toggleInlineEdit(content.id)}
                                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                      title={inlineEditing[content.id] ? "Cancelar Edição" : "Editar Inline"}
                                    >
                                      {inlineEditing[content.id] ? (
                                        <X className="h-4 w-4" />
                                      ) : (
                                        <Edit className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  
                                  {/* Botão Apagar - apenas para Hero slides */}
                                  {content.page_section === 'hero' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDeletingContent(content)}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                      title="Apagar"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Modals */}
      {editingContent && (
        editingContent.content_type === 'json' && editingContent.page_section === 'hero' ? (
          <HeroSlideEditor 
            content={editingContent}
            onSave={handleSaveContent}
            onCancel={() => setEditingContent(null)}
          />
        ) : (
          <ContentEditor 
            content={editingContent}
            onSave={handleSaveContent}
            onCancel={() => setEditingContent(null)}
          />
        )
      )}

      {/* Modal de Confirmação de Deleção */}
      {deletingContent && (
        <Dialog open={true} onOpenChange={() => setDeletingContent(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Confirmar Deleção
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. O slide será permanentemente removido do carousel.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-800 mb-2">
                  Slide: {deletingContent.title}
                </h4>
                {deletingContent.content_type === 'json' && (() => {
                  try {
                    const slideData = JSON.parse(deletingContent.content || '{}')
                    return (
                      <div className="text-sm text-red-700">
                        <p><strong>Título:</strong> {slideData.title}</p>
                        <p><strong>Subtítulo:</strong> {slideData.subtitle}</p>
                      </div>
                    )
                  } catch {
                    return <p className="text-sm text-red-700">Dados do slide inválidos</p>
                  }
                })()}
              </div>
              
              <p className="text-gray-600 text-sm">
                Tem certeza que deseja apagar este slide do hero carousel?
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingContent(null)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteContent}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Apagar Slide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Upload de Imagem */}
      {uploadingImage && (
        <Dialog open={true} onOpenChange={() => setUploadingImage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Upload de Imagem - {uploadingImage.title}
              </DialogTitle>
              <DialogDescription>
                Faça upload de uma nova imagem para a seção sobre nós
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <ImageUploadPreview
                value={uploadingImage.content || ''}
                onChange={handleImageUpload}
                folder="about"
                label=""
                placeholder="Selecione uma nova imagem ou cole uma URL"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadingImage(null)}
              >
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}