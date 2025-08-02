"use client"

import type React from "react"
import { useState } from "react"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { addBraider } from "@/lib/data"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Camera, 
  Award, 
  Clock, 
  Euro,
  Home,
  Car,
  Check,
  Star
} from "lucide-react"
import { toast } from "react-hot-toast"

// Dados de Portugal por distrito
const portugalDistricts = {
  "Aveiro": {
    concelhos: {
      "Águeda": ["Águeda", "Barrô", "Belazaima do Chão", "Borralha", "Castanheira do Vouga", "Espinhel", "Fermentelos", "Lamas do Vouga", "Macinhata do Vouga", "Préstimo", "Recardães", "Travassô", "Trofa", "Valongo do Vouga"],
      "Albergaria-a-Velha": ["Albergaria-a-Velha", "Angeja", "Branca", "Ribeira de Fráguas", "São João de Loure", "Valmaior"],
      "Anadia": ["Anadia", "Avelãs de Caminho", "Avelãs de Cima", "Moita", "Óis da Ribeira", "Paredes do Bairro", "Sangalhos", "São Lourenço do Bairro", "Tamengos", "Vilarinho do Bairro"],
      "Arouca": ["Alvarenga", "Arouca", "Burgo", "Canelas", "Chave", "Covelo de Paivó", "Escariz", "Espiunca", "Fermedo", "Janarde", "Mansores", "Moldes", "Rossas", "Santa Eulália", "São Miguel do Mato", "Tropeço", "Urrô", "Várzea"],
      "Aveiro": ["Aradas", "Cacia", "Eixo e Eirol", "Esgueira", "Glória e Vera Cruz", "Nariz", "Oliveirinha", "Requeixo, Nossa Senhora de Fátima e Nariz", "São Bernardo", "São Jacinto"],
      "Castelo de Paiva": ["Bairros", "Castelo de Paiva", "Fornos", "Paraíso", "Pedorido", "Raiva, Pedorido e Paraíso", "Real", "Santa Maria de Sardoura", "São Martinho de Sardoura", "Sobrado"],
      "Espinho": ["Anta e Guetim", "Espinho", "Paramos", "Silvalde"],
      "Estarreja": ["Avanca", "Beduído e Veiros", "Canelas e Fermelã", "Estarreja", "Pardilhó", "Salreu"],
      "Ílhavo": ["Gafanha da Boa Hora", "Gafanha da Encarnação", "Gafanha da Nazaré", "Gafanha do Carmo", "Ílhavo (São Salvador)", "Vista Alegre"],
      "Mealhada": ["Barcouço", "Casal Comba", "Luso", "Mealhada", "Pampilhosa", "Vacariça", "Ventosa do Bairro"],
      "Murtosa": ["Bunheiro", "Monte", "Murtosa", "Torreira"],
      "Oliveira de Azeméis": ["Carregosa", "Cesar", "Fajões", "Loureiro", "Macieira de Sarnes", "Madail", "Nogueira do Cravo e Pindelo", "Oliveira de Azeméis", "Ossela", "Palmaz", "Pinheiro da Bemposta", "Ribeiro", "Santiago de Riba-Ul", "São Martinho da Gândara", "São Roque", "Travanca", "Ul", "Vila de Cucujães"],
      "Oliveira do Bairro": ["Bustos, Troviscal e Mamarrosa", "Oliveira do Bairro", "Oiã", "Palhaça"],
      "Ovar": ["Cortegaça", "Esmoriz", "Maceda", "Ovar, São João, Arada e São Vicente de Pereira Jusã", "São Martinho da Gândara", "Válega"],
      "Santa Maria da Feira": ["Argoncilhe", "Arrifana", "Canedo", "Escapães", "Feira", "Fiães", "Fornos", "Lobão", "Lourosa", "Milheirós de Poiares", "Mosteirô", "Nogueira da Regedoura", "Paços de Brandão", "Pigeiros", "Rio Meão", "Romariz", "Sanfins", "Santa Maria da Feira", "Santa Maria de Lamas", "São João de Ver", "São Paio de Oleiros", "Sanguedo", "Souto", "Travanca", "Vale"],
      "São João da Madeira": ["São João da Madeira"],
      "Sever do Vouga": ["Couto de Esteves", "Dornelas", "Paradela", "Rocas do Vouga", "Santos Evos", "Sever do Vouga", "Silva Escura", "Talhadas", "Cedrim e Paradela"],
      "Vagos": ["Covão do Lobo", "Fonte de Angeão e Covão do Lobo", "Gafanha da Boa Hora", "Ouca", "Ponte de Vagos e Santa Catarina", "Sosa", "Vagos"],
      "Vale de Cambra": ["Arões", "Codal", "Cepelos", "Junqueira", "Macieira de Cambra", "Rôge", "São Pedro de Castelões", "Vila Chã, Codal e Vila Cova de Perrinho"]
    }
  },
  "Beja": {
    concelhos: ["Aljustrel", "Almodôvar", "Alvito", "Barrancos", "Beja", "Castro Verde", "Cuba", "Ferreira do Alentejo", "Mértola", "Moura", "Odemira", "Ourique", "Serpa", "Vidigueira"]
  },
  "Braga": {
    concelhos: {
      "Braga": ["Adaúfe", "Arentim e Cunha", "Braga (Maximinos, Sé e Cividade)", "Braga (São José de São Lázaro e São João do Souto)", "Braga (São Vicente)", "Cabreiros", "Celeirós", "Dume", "Escudeiros e Penso (Santo Estêvão e São Vicente)", "Espinho", "Esporões", "Figueiredo", "Frossos", "Gondizalves", "Lamas", "Lamaçães", "Lomar e Arcos", "Merelim (São Paio), Panóias e Parada de Tibães", "Merelim (São Pedro)", "Morreira e Trandeiras", "Nogueira, Fraião e Lamaçães", "Nogueiró e Tenões", "Padim da Graça", "Palmeira", "Parada de Tibães", "Pedralva", "Pousada", "Priscos", "Real, Dume e Semelhe", "Ruilhe", "Sequeira", "Semelhe", "Sobreposta", "Tadim", "Tebosa", "Trandeiras", "Vimieiro"],
      "Barcelos": ["Abade de Neiva", "Aguiar", "Aldreu", "Alheira", "Alvelos", "Arcozelo", "Areias de Vilar e Encourados", "Balugães", "Barcelinhos", "Barcelos", "Barqueiros", "Cambeses", "Campo e Tamel (São Pedro Fins)", "Carapeços", "Carvalhal", "Chorente, Góios, Courel, Pedra Furada e Gueral", "Cristelo", "Crujeira", "Durrães e Tregosa", "Fragoso", "Galegos (Santa Maria)", "Gamil e Midões", "Gilmonde", "Lijó", "Manhente", "Martim", "Mariz", "Milhazes", "Monte de Fralães", "Moure", "Oliveira", "Palme", "Panque", "Pereira", "Perelhal", "Pousa", "Quintiães", "Remelhe", "Roriz (Santo Tirso)", "Sequeade", "Silva", "Tamel (Santa Leocádia)", "Tamel (São Veríssimo)", "Várzea", "Vila Boa", "Vila Cova", "Vila Frescaínha (São Martinho)", "Vila Frescaínha (São Pedro)", "Vila Seca", "Vilar de Figos", "Vilar do Monte"],
      "Guimarães": ["Abação (São Tomé)", "Airão (Santa Maria)", "Airão (São João Baptista)", "Aldão", "Atães", "Azurém", "Barco", "Brito", "Caldelas", "Candoso (Santiago)", "Candoso (São Martinho)", "Corvite", "Costa", "Creixomil", "Donim", "Fermentões", "Figueiredo", "Gandarela", "Gominhães", "Gonça", "Gondar", "Guimarães (Oliveira do Castelo, São Paio e São Sebastião)", "Infantas", "Leitões", "Longos e Valdreu", "Lordelo", "Mascotelos", "Mesão Frio", "Moreira de Cónegos", "Nespereira", "Pencelo", "Penselo", "Polvoreira", "Ponte", "Prazins (Santa Eufémia)", "Prazins (Santo Tirso)", "Rendufe", "Ronfe", "Sande (São Lourenço)", "Sande (São Martinho)", "São Torcato", "Selho (Santa Cristina)", "Selho (São Jorge)", "Selho (São Lourenço)", "Serzedo e Calvos", "Silvares", "Souto (Santa Maria)", "Souto (São Salvador)", "Tabuadelo", "Urgezes"],
      "Vila Nova de Famalicão": ["Antas e Abade de Vermoim", "Avidos e Lagoa", "Bairro", "Bente", "Brufe", "Calendário", "Carreira", "Castelões", "Cruz", "Delães", "Esmeriz e Cabeçudos", "Fradelos", "Gavião", "Gemunde", "Gondifelos, Cavalões e Outiz", "Joane", "Landim", "Lemenhe, Mouquim e Jesufrei", "Louro", "Mogege", "Nine", "Novais", "Oliveira (Santa Maria)", "Oliveira (São Mateus)", "Pedome", "Portela", "Requião", "Ribeirão", "Riba de Ave", "Ruivães e Novais", "Seide", "Telhado", "Vale (São Cosme)", "Vale (São Martinho)", "Vermoim", "Vila Nova de Famalicão", "Vilarinho das Cambas"],
      "Amares": ["Amares e Figueiredo", "Barreiros e Cepães", "Besteiros", "Bouro (Santa Maria)", "Bouro (Santa Marta)", "Caldelas", "Carrazedo", "Dornelas", "Ferreiros, Prozelo e Besteiros", "Figueiredo", "Goães", "Lago", "Paranhos", "Paredes Secas", "Portela e Extremo", "Prozelo", "Rendufe", "Santa Maria do Bouro", "Torre", "Vilela"],
      "Esposende": ["Antas", "Apúlia e Fão", "Belinho e Mar", "Esposende", "Fonte Boa e Rio Tinto", "Forjães", "Gandra e Tamel", "Gemeses", "Marinhas", "Palmeira de Faro e Curvos"],
      "Fafe": ["Aboim", "Agrela", "Antime", "Ardegão", "Armil", "Arnozela", "Bairros", "Calendário", "Castelões", "Fafe", "Faria", "Fornelos", "Freitas", "Golães", "Medelo", "Monte", "Moreira do Rei", "Passos", "Pedraído", "Quinchães", "Regadas", "Revelhe", "Ribeiros", "Santa Eulália", "São Gens", "Serafão", "Travassós", "Vale de Linhares", "Várzea Cova", "Vinhós"],
      "Póvoa de Lanhoso": ["Ajude", "Brunhais", "Calvos", "Campos e Louredo", "Covelas", "Esperança", "Ferreiros", "Frades", "Friande", "Galegos", "Garfe", "Geraz do Minho", "Lanhoso", "Louredo", "Monsul", "Moure", "Oliveira", "Póvoa de Lanhoso", "Rendufinho", "Santo Emilião", "São João de Rei", "Sobradelo da Goma", "Taíde", "Travassos", "Verim", "Vilela"],
      "Terras de Bouro": ["Brufe", "Campo do Gerês", "Chamoim", "Cibões", "Covide", "Gondoriz", "Moimenta", "Monte", "Morgade", "Rio Caldo", "Souto", "Terras de Bouro", "Valdreu", "Vilar", "Vilar da Veiga"],
      "Vieira do Minho": ["Anissó", "Campos", "Cantelães", "Caniçada", "Eira Vedra", "Guilhofrei", "Louredo", "Mosteiro", "Parada do Bouro", "Pinheiro", "Rossas", "Ruivães", "Salamonde", "Soengas", "Tabuaças", "Ventosa e Cova", "Vieira do Minho"],
      "Vila Verde": ["Arcozelo", "Atães", "Barbudo", "Cabanelas", "Carreiras (Santiago)", "Carreiras (São Miguel)", "Cervães", "Codeceda", "Coucieiro", "Dossãos", "Esqueiros", "Freiriz", "Geme", "Godinhaços", "Gondiães", "Lage", "Lanhas", "Loureira", "Marrancos", "Moure", "Nevogilde", "Oriz (Santa Marinha)", "Oriz (São Miguel)", "Passô", "Pico de Regalados", "Prado", "Rio Mau", "Sande", "Valdreu", "Vila Verde", "Vilarinho"],
      "Vizela": ["Caldas de Vizela (São João)", "Caldas de Vizela (São Miguel) e Caldelas", "Infias", "Santa Eulália", "São Paio", "Tagilde e Vizela (Santo Adrião)"],
      "Cabeceiras de Basto": ["Abadim", "Arco de Baúlhe", "Basto (Santa Tecla)", "Basto (São Clemente)", "Bucos", "Cabeceiras de Basto", "Gondiães", "Outeiro", "Pedraça", "Refojos de Basto", "Rio Douro"],
      "Celorico de Basto": ["Agilde", "Arnoia", "Bórnes de Aguiar", "Britelo", "Carvalho", "Celorico de Basto", "Codeçoso", "Corgo", "Fervença", "Gagos", "Gémeos", "Infesta", "Molares", "Moreira do Castelo", "Ourilhe", "Rego", "Ribas", "Vale de Bouro", "Veade"]
    }
  },
  "Bragança": {
    concelhos: ["Alfândega da Fé", "Bragança", "Carrazeda de Ansiães", "Freixo de Espada à Cinta", "Macedo de Cavaleiros", "Miranda do Douro", "Mirandela", "Mogadouro", "Torre de Moncorvo", "Vila Flor", "Vimioso", "Vinhais"]
  },
  "Castelo Branco": {
    concelhos: ["Belmonte", "Castelo Branco", "Covilhã", "Fundão", "Idanha-a-Nova", "Oleiros", "Penamacor", "Proença-a-Nova", "Sertã", "Vila de Rei", "Vila Velha de Ródão"]
  },
  "Coimbra": {
    concelhos: {
      "Coimbra": ["Almalaguês", "Ameal", "Antanhol", "Arzila", "Assafarge", "Brasfemes", "Ceira", "Coimbra (Almedina)", "Coimbra (Santo António dos Olivais)", "Coimbra (São Bartolomeu)", "Coimbra (Sé Nova, Santa Cruz, Almedina e São Bartolomeu)", "Ribeira de Frades", "Santa Clara e Castelo Viegas", "Santo António dos Olivais", "São João do Campo", "São Martinho de Árvore", "São Martinho do Bispo e Ribeira de Frades", "São Paulo de Frades", "São Silvestre", "Souselas e Botão", "Taveiro, Ameal e Arzila", "Torre de Vilela", "Torres do Mondego", "Trouxemil e Torre de Vilela"],
      "Figueira da Foz": ["Alhadas", "Bom Sucesso", "Buarcos e São Julião", "Ferreira-a-Nova", "Figueira da Foz", "Lavos", "Maiorca", "Marinha das Ondas", "Paião", "Quiaios", "São Pedro", "Tavarede", "Vila Verde"],
      "Cantanhede": ["Ançã", "Bolho", "Cadima", "Cantanhede", "Cordinhã", "Covões e Camarneira", "Febres", "Murtede", "Ourentã", "Pocariça", "Portunhos e Outil", "Tocha", "Vilamar"],
      "Lousã": ["Foz de Arouce", "Gândaras", "Lousã", "Serpins", "Vilarinho"],
      "Oliveira do Hospital": ["Aldeia das Dez", "Alvoco das Várzeas", "Avô", "Bobadela", "Ervedal", "Lajeosa", "Lourosa", "Meruge", "Nogueira do Cravo", "Oliveira do Hospital", "Penalva de Alva", "Santa Ovaia", "São Gião", "São Paio de Gramaços", "Seixo da Beira", "Travanca de Lagos", "Vila Pouca da Beira"],
      "Condeixa-a-Nova": ["Anobra", "Condeixa-a-Nova", "Condeixa-a-Velha e Condeixa-a-Nova", "Ega", "Furadouro", "Sebal e Belide", "Zambujal"],
      "Montemor-o-Velho": ["Abrunheira, Verride e Vila Nova da Barca", "Arazede", "Carapinheira", "Ereira", "Gatões", "Liceia", "Meãs do Campo", "Montemor-o-Velho e Gatões", "Pereira", "Santo Varão", "Seixo de Gatões", "Tentúgal", "Verride"],
      "Penacova": ["Carvalho", "Figueira de Lorvão", "Friúmes", "Lorvão", "Oliveira do Mondego", "Penacova", "Sazes do Lorvão", "São Paio do Mondego"],
      "Soure": ["Alfarelos", "Degracias e Pombalinho", "Figueiró do Campo", "Gesteira e Brunhós", "Granja do Ulmeiro", "Nova Palma", "Samuel", "Soure", "Tapéus", "Vinha da Rainha"],
      "Miranda do Corvo": ["Lamas", "Miranda do Corvo", "Rio Vide", "Semide e Rio Vide", "Vila Nova"],
      "Mira": ["Carapelhos", "Mira", "Praia de Mira", "Seixo"],
      "Arganil": ["Arganil", "Barril de Alva", "Benfeita", "Celavisa", "Cerdeira e Moura da Serra", "Coja e Barril de Alva", "Folques", "Piódão", "Pombeiro da Beira", "Pomares", "São Martinho da Cortiça", "Secarias", "Sordinhã", "Vila Cova de Alva"],
      "Góis": ["Alvares", "Cadafaz", "Colmeal", "Góis", "Vila Nova do Ceira"],
      "Penela": ["Cumeada", "Espinhal", "Penela", "Podentes", "Rabaçal", "São Miguel"],
      "Tábua": ["Ázere", "Candosa", "Carapinha", "Covas", "Espariz e Sinde", "Midões", "Mouronho", "Pinheiro de Coja e Meda de Mouros", "São João da Boa Vista", "Tábua", "Vila Nova de Oliveirinha"],
      "Vila Nova de Poiares": ["Arrifana", "Lavegadas", "Poiares (Santo André)", "São Miguel de Poiares"],
      "Pampilhosa da Serra": ["Cabril", "Dornelas do Zêzere", "Fajão-Vidual", "Janeiro de Baixo", "Machio", "Pampilhosa da Serra", "Pessegueiro", "Unhais-o-Velho", "Vidual"]
    }
  },
  "Évora": {
    concelhos: ["Alandroal", "Arraiolos", "Borba", "Estremoz", "Évora", "Montemor-o-Novo", "Mora", "Mourão", "Portel", "Redondo", "Reguengos de Monsaraz", "Vendas Novas", "Viana do Alentejo", "Vila Viçosa"]
  },
  "Faro": {
    concelhos: {
      "Faro": ["Conceição e Estoi", "Faro (Sé e São Pedro)", "Montenegro", "Santa Bárbara de Nexe"],
      "Albufeira": ["Albufeira e Olhos de Água", "Ferreiras", "Guia", "Paderne"],
      "Lagos": ["Bensafrim e Barão de São João", "Lagos (São Sebastião e Santa Maria)", "Luz", "Odiáxere"],
      "Portimão": ["Alvor", "Portimão"],
      "Loulé": ["Almancil", "Alte", "Ameixial", "Boliqueime", "Loulé (São Clemente)", "Loulé (São Sebastião)", "Querença, Tôr e Benafim", "Salir", "União das Freguesias de Quarteira"],
      "Olhão": ["Fuseta", "Moncarapacho e Fuseta", "Olhão", "Pechão", "Quelfes"],
      "Tavira": ["Cabanas de Tavira", "Conceição de Tavira", "Luz de Tavira e Santo Estêvão", "Santa Catarina da Fonte do Bispo", "Santa Luzia", "Santiago de Tavira", "Santo Estêvão", "Tavira (Santa Maria e Santiago)"],
      "Vila Real de Santo António": ["Monte Gordo", "Vila Nova de Cacela", "Vila Real de Santo António"],
      "Castro Marim": ["Azinhal", "Castro Marim", "Odeleite"],
      "Alcoutim": ["Alcoutim e Pereiro", "Giões", "Martim Longo", "Vaqueiros"],
      "Monchique": ["Alferce", "Marmelete", "Monchique"],
      "Aljezur": ["Aljezur e Bordeira", "Odeceixe", "Rogil"],
      "Vila do Bispo": ["Barão de São Miguel", "Budens", "Raposeira", "Sagres", "Vila do Bispo"],
      "Lagoa": ["Carvoeiro", "Estombar e Parchal", "Ferragudo", "Lagoa e Carvoeiro", "Porches"],
      "Silves": ["Alcantarilha e Pêra", "Algoz e Tunes", "Armação de Pêra", "São Bartolomeu de Messines", "São Marcos da Serra", "Silves"],
      "São Brás de Alportel": ["São Brás de Alportel"]
    }
  },
  "Guarda": {
    concelhos: ["Aguiar da Beira", "Almeida", "Celorico da Beira", "Figueira de Castelo Rodrigo", "Fornos de Algodres", "Gouveia", "Guarda", "Manteigas", "Meda", "Pinhel", "Sabugal", "Seia", "Trancoso", "Vila Nova de Foz Côa"]
  },
  "Leiria": {
    concelhos: {
      "Leiria": ["Barreira", "Bidoeira de Cima", "Boa Vista", "Caranguejeira", "Carvide", "Chainça", "Coimbrão", "Colmeias e Memória", "Cortes", "Leiria, Pousos, Barreira e Cortes", "Maceira", "Marrazes e Barosa", "Milagres", "Monte Redondo", "Monte Real e Carvide", "Ortigosa", "Parceiros e Azoia", "Pousos", "Regueira de Pontes", "Santa Catarina da Serra e Chainça", "Santa Eufémia e Boa Vista", "Souto da Carpalhosa e Ortigosa"],
      "Marinha Grande": ["Marinha Grande", "Moita", "São Pedro de Moel", "Vieira de Leiria"],
      "Caldas da Rainha": ["A dos Francos", "Alvorninha", "Caldas da Rainha (Nossa Senhora do Pópulo, Coto e São Gregório)", "Caldas da Rainha (Santo Onofre e Serra do Bouro)", "Carvalhal Benfeito", "Foz do Arelho", "Landal", "Nadadouro", "Salir de Matos", "Salir do Porto", "Santa Catarina", "São Martinho do Porto", "Tornada e Salir do Porto", "Vidais"],
      "Nazaré": ["Famalicão", "Nazaré", "Valado dos Frades"],
      "Óbidos": ["A dos Negros", "Amoreira", "Gaeiras", "Óbidos", "Olho Marinho", "Santa Maria, São Pedro e Sobral da Lagoa", "Usseira", "Vau"],
      "Peniche": ["Ajuda", "Atouguia da Baleia", "Conceição", "Ferrel", "Peniche", "São Pedro", "Serra d'El Rei"],
      "Bombarral": ["Bombarral e Vale Covo", "Carvalhal", "Roliça"],
      "Batalha": ["Batalha", "Golpilheira", "Reguengo do Fetal", "São Mamede"],
      "Porto de Mós": ["Alcaria", "Alvados", "Arrimal", "Cortes", "Juncal", "Mendiga", "Mira de Aire", "Pedreiras", "Porto de Mós", "São Bento", "São João Baptista", "Serro Ventoso"],
      "Pombal": ["Abiul", "Albergaria dos Doze", "Carnide", "Carriço", "Guia", "Ilha", "Louriçal", "Meirinhas", "Pelariga", "Pombal", "Redinha", "Santiago de Litém", "São Simão de Litém e Albergaria dos Doze", "Vermoil", "Vila Cã"],
      "Ansião": ["Alvorge", "Ansião", "Avelar", "Chão de Couce", "Lagarteira", "Pousaflores", "Santiago da Guarda", "Torre de Vale de Todos"],
      "Alvaiázere": ["Alvaiázere", "Maçãs de Dona Maria", "Pelmá", "Pussos São Pedro", "Rego da Murta"],
      "Castanheira de Pera": ["Castanheira de Pera", "Coentral", "Coentral Grande"],
      "Figueiró dos Vinhos": ["Aguda", "Arega", "Bairradas", "Campelo", "Figueiró dos Vinhos", "Mesas"],
      "Pedrógão Grande": ["Graça", "Pedrógão Grande", "Vila Facaia"]
    }
  },
  "Lisboa": {
    concelhos: {
      "Lisboa": ["Ajuda", "Alcântara", "Alvalade", "Areeiro", "Arroios", "Avenidas Novas", "Beato", "Belém", "Benfica", "Campo de Ourique", "Campolide", "Carnide", "Estrela", "Lumiar", "Mafra", "Marvila", "Misericórdia", "Olivais", "Parque das Nações", "Penha de França", "Santa Clara", "Santa Maria dos Olivais", "Santo António", "Santos", "São Domingos de Benfica", "São Vicente"],
      "Cascais": ["Alcabideche", "Carcavelos e Parede", "Cascais e Estoril", "São Domingos de Rana"],
      "Sintra": ["Agualva e Mira-Sintra", "Algueirão-Mem Martins", "Cacém e São Marcos", "Casal de Cambra", "Colares", "Massamá e Monte Abraão", "Queluz e Belas", "Rio de Mouro", "Santa Maria e São Miguel, São Martinho e São Pedro Penaferrim", "Sintra (Santa Maria e São Miguel)", "Terrugem e São Domingos de Rana"],
      "Oeiras": ["Algés, Linda-a-Velha e Cruz Quebrada-Dafundo", "Barcarena", "Carnaxide e Queijas", "Oeiras e São Julião da Barra, Paço de Arcos e Caxias", "Porto Salvo"],
      "Loures": ["Apelação", "Bobadela", "Bucelas", "Camarate, Unhos e Apelação", "Fanhões", "Frielas", "Loures", "Lousa", "Moscavide e Portela", "Odivelas", "Pontinha e Famões", "Prior Velho", "Ramada e Caneças", "Sacavém e Prior Velho", "Santa Iria de Azóia, São João da Talha e Bobadela", "Santo Antão do Tojal", "Santo António dos Cavaleiros e Frielas", "São João da Talha", "São Julião do Tojal"],
      "Odivelas": ["Odivelas", "Pontinha e Famões", "Ramada e Caneças"],
      "Mafra": ["Azueira e Sobral da Abelheira", "Carvoeira", "Cheleiros", "Encarnação", "Ericeira", "Igreja Nova e Cheleiros", "Mafra", "Malveira e São Miguel de Alcainça", "Milharado", "Santo Isidoro", "Sobral de Monte Agraço", "Venda do Pinheiro e Santo Estêvão das Galés", "Vila Franca do Rosário"],
      "Alenquer": ["Alenquer (Santo Estêvão e Triana)", "Aldeia Galega da Merceana e Aldeia Gavinha", "Cadaval e Pero Moniz", "Carregado", "Meca", "Ribafria e Pereiro de Palhacana", "Vila Verde dos Francos"],
      "Torres Vedras": ["A dos Cunhados e Maceira", "Campelos e Outeiro da Cabeça", "Carvoeira", "Dois Portos e Runa", "Freiria", "Maxial e Monte Redondo", "Ponte do Rol", "Ramalhal", "Santa Cruz", "São Pedro da Cadeira", "Silveira", "Torres Vedras (Santa Maria, São Miguel e Matacães)", "Torres Vedras (São Pedro, Santiago, Santa Maria do Castelo e São Miguel)", "Turcifal", "Ventosa"],
      "Vila Franca de Xira": ["Alhandra, São João dos Montes e Calhandriz", "Alverca do Ribatejo e Sobralinho", "Cachoeiras", "Castanheira do Ribatejo e Cachoeiras", "Póvoa de Santa Iria e Forte da Casa", "Vialonga", "Vila Franca de Xira"]
    }
  },
  "Portalegre": {
    concelhos: ["Alter do Chão", "Arronches", "Avis", "Campo Maior", "Castelo de Vide", "Crato", "Elvas", "Fronteira", "Gavião", "Marvão", "Monforte", "Nisa", "Ponte de Sor", "Portalegre", "Sousel"]
  },
  "Porto": {
    concelhos: {
      "Porto": ["Aldoar, Foz do Douro e Nevogilde", "Bonfim", "Campanhã", "Cedofeita, Santo Ildefonso, Sé, Miragaia, São Nicolau e Vitória", "Lordelo do Ouro e Massarelos", "Paranhos", "Ramalde"],
      "Vila Nova de Gaia": ["Arcozelo", "Avintes", "Canelas", "Canidelo", "Crestuma", "Grijó e Sermonde", "Gulpilhares e Valadares", "Lever", "Madalena", "Mafamude e Vilar do Paraíso", "Oliveira do Douro", "Pedroso e Seixezelo", "Sandim, Olival, Lever e Crestuma", "Santa Marinha e São Pedro da Afurada", "São Félix da Marinha", "Serzedo e Perosinho", "Vilar de Andorinho"],
      "Matosinhos": ["Custóias, Leça do Balio e Guifões", "Matosinhos e Leça da Palmeira", "Perafita, Lavra e Santa Cruz do Bispo", "São Mamede de Infesta e Senhora da Hora"],
      "Maia": ["Águas Santas", "Barca", "Castêlo da Maia", "Cidade da Maia", "Folgosa", "Gemunde", "Gondim", "Milheirós", "Moreira", "Nogueira e Silva Escura", "São Pedro Fins", "Silva Escura", "Vermoim", "Vila Nova da Telha"],
      "Gondomar": ["Baguim do Monte", "Covelo", "Fânzeres", "Gondomar (São Cosme), Valbom e Jovim", "Lomba", "Melres e Medas", "Rio Tinto", "São Pedro da Cova"],
      "Valongo": ["Alfena", "Campo e Sobrado", "Ermesinde", "Valongo"],
      "Paredes": ["Aguiar de Sousa", "Astromil", "Baltar", "Beire", "Besteiros", "Bitarães", "Castelões de Cepeda", "Cete", "Cristelo", "Duas Igrejas", "Gandra", "Lordelo", "Louredo", "Madalena", "Mouriz", "Parada de Todeia", "Paredes", "Rebordosa", "Recarei", "Sobreira", "Sobrosa", "Vandoma", "Vilela"],
      "Penafiel": ["Abragão", "Boelhe", "Bustelo", "Canelas", "Cabeça Santa", "Croca", "Duas Igrejas", "Eja", "Figueira", "Fonte Arcada", "Galegos", "Irivo", "Lagares e Figueira", "Milhundos", "Novelas", "Oldrões", "Paço de Sousa", "Penafiel", "Perozelo", "Pinheiro", "Portela", "Quintandona", "Rans", "Rio de Moinhos", "São Mamede de Recezinhos", "Sebolido", "Valpedre"],
      "Amarante": ["Amarante (São Gonçalo), Madalena, Cepelos e Gatão", "Ansiães", "Bustelo", "Canadelo", "Carneiro", "Figueiró (Santiago e Santa Cristina)", "Fregim", "Fridão", "Gouveia (São Simão)", "Jazente", "Lufrei", "Olo e Canadelo", "Padronelo", "Rebordelo", "Salvador do Monte", "São Gonçalo de Amarante", "Telões", "Travanca", "Vila Caiz", "Vila Chã do Marão"],
      "Santo Tirso": ["Agrela e Serafão", "Areias, Sequeiró, Lama e Palmeira", "Burgães e Ribeira do Neiva", "Carreira e Refojos de Riba de Ave", "Lamelas", "Monte Córdova", "Rebordões", "Roriz", "Santo Tirso, Couto (Santa Cristina e São Miguel) e Burgães", "São Martinho do Campo", "São Salvador do Campo", "Sequeiró", "Tiradentes", "Vilarinho"],
      "Póvoa de Varzim": ["Argivai", "Aver-o-Mar, Amorim e Terroso", "Balasar", "Beiriz e Argivai", "Estela", "Laundos", "Navais", "Póvoa de Varzim", "Rates", "Terroso"],
      "Vila do Conde": ["Arcos", "Azurara", "Fajozes", "Fornelo e Vairão", "Junqueira", "Labruge", "Malta", "Mindelo", "Modivas", "Retorta e Tougues", "Rio Mau", "São Paio de Antas", "Tougues", "Vila Chã", "Vila do Conde", "Vilar", "Vilar de Pinheiro"],
      "Trofa": ["Alvarelhos e Guidões", "Bougado (São Martinho e Santiago)", "Coronado (São Romão e São Mamede)", "Covelas", "Muro", "São Martinho de Bougado", "São Romão de Coronado"],
      "Lousada": ["Aveleda", "Boim", "Casais", "Cernadelo e Lousada (São Miguel e Santa Margarida)", "Covas", "Cristelos, Boim e Order", "Figueiras", "Lodares", "Lustosa", "Macieira", "Meinedo", "Nespereira e Casais", "Nevogilde", "Nogueira", "Order", "Pias", "Silvares", "Sousela", "Torno", "Vilar do Torno e Alentém"],
      "Felgueiras": ["Airó", "Arões", "Barrosas", "Borba de Godim", "Felgueiras", "Freamunde", "Idães", "Jugueiros", "Lagares", "Macieira da Lixa", "Margaride (Santa Eulália)", "Margaride (Santa Eulália), Várzea, Lagares, Varziela e Moure", "Milheirós", "Pombeiro de Ribavizela", "Rande", "Regilde", "Revinhade", "Sendim", "Sousa", "Unhão", "Varziela", "Vila Cova", "Vila Fria"],
      "Baião": ["Ancede e Ribadouro", "Baião (Santa Leocádia)", "Campelo", "Gestaçô", "Gove", "Loivos do Monte", "Mesquinhata", "Ovil", "Santa Cruz do Douro e São Tomé de Covelas", "Santa Marinha do Zêzere", "Teixeira e Teixeiró", "Tresouras", "Viariz"],
      "Marco de Canaveses": ["Alpendurada, Matos e Frades", "Alpendorada e Matos", "Avessadas e Rosém", "Constance", "Favões", "Folhada e Sande", "Frende", "Magrelos", "Marco", "Paços de Gaiolo", "Penha Longa", "Rio de Galinhas", "Sande", "Santo Isidoro", "São Lourenço do Douro", "São Nicolau", "Soalhães", "Tuías", "Vila Boa de Quires e Maureles", "Vila Boa do Bispo"]
    }
  },
  "Santarém": {
    concelhos: {
      "Santarém": ["Abitureiras", "Achete", "Alcanhões", "Almoster", "Alcanede", "Azoia de Baixo", "Azoia de Cima", "Póvoa de Santarém", "Romeira", "Salvador", "Santarém (Marvila, Santa Iria da Ribeira de Santarém, Santarém (São Salvador), Santarém (São Nicolau))", "São Vicente do Paúl", "Tremês", "Vale de Figueira", "Vaqueiros"],
      "Tomar": ["Além da Ribeira", "Asseiceira", "Beselga", "Carregueiros", "Casais e Alviobeira", "Junceira", "Madalena e Beselga", "Olalhas", "Paialvo", "Pedreira", "Sabachões", "Santa Maria dos Olivais", "São João Baptista", "São Pedro de Tomar", "Serra e Junceira", "Tomar (Santa Maria dos Olivais)", "Tomar (São João Baptista)"],
      "Torres Novas": ["Alcongosta", "Assentiz", "Brogueira, Parceiros de Igreja e Alcorochel", "Chancelaria", "Lapas", "Meia Via", "Olaia", "Parceiros de Igreja", "Riachos", "Ribeira Branca", "Torres Novas (Santa Maria, Salvador e Santiago)", "Zibreira"],
      "Abrantes": ["Aldeia do Mato e Souto", "Alferrarede", "Alvega e Concavada", "Bemposta", "Carvalhal", "Fontes", "Martinchel", "Mouriscas", "Pego", "Rio de Moinhos", "Rossio ao Sul do Tejo", "São Facundo", "São João", "São Miguel do Rio Torto", "São Vicente", "Tramagal", "Vale das Mós"],
      "Ourém": ["Atouguia", "Caxarias", "Cercal", "Espite", "Fátima", "Freixianda", "Gondemaria e Olival", "Matas e Cercal", "Nossa Senhora das Misericórdias", "Nossa Senhora de Fátima", "Olival", "Ourém", "Ribeira do Fárrio", "Rio de Couros", "Seiça", "Urqueira"],
      "Rio Maior": ["Alcobertas", "Arrouquelas", "Asseiceira Grande", "Azinheira", "Fráguas", "Marmeleira", "Outeiro da Cortiçada", "Ribeira de São João", "Rio Maior", "São João da Ribeira", "São Sebastião"],
      "Constância": ["Constância", "Montalvo"],
      "Entroncamento": ["Entroncamento"],
      "Vila Nova da Barquinha": ["Atalaia", "Moita do Norte", "Praia do Ribatejo", "Tancos", "Vila Nova da Barquinha"],
      "Ferreira do Zêzere": ["Águas Belas", "Areias", "Beco", "Chãos", "Ferreira do Zêzere", "Graça", "Igreja Nova do Sobral", "Paio Mendes", "Pias", "Punhete"],
      "Golegã": ["Azinhaga", "Golegã", "Pombalinho"],
      "Mação": ["Amêndoa", "Cardigos", "Carvoeiro", "Envendos", "Mação", "Ortiga", "Penhascoso"],
      "Sardoal": ["Alcaravela", "Sardoal", "Valhascos"],
      "Chamusca": ["Carregueira", "Chamusca e Pinheiro Grande", "Parreira e Chouto", "Ulme", "Vale de Atela"],
      "Alpiarça": ["Alpiarça"],
      "Almeirim": ["Almeirim", "Benfica do Ribatejo", "Fazendas de Almeirim"],
      "Salvaterra de Magos": ["Foros de Salvaterra", "Glória do Ribatejo e Granho", "Marinhais", "Salvaterra de Magos"],
      "Coruche": ["Biscainho", "Branca", "Coruche, Fajarda e Erra", "Couço", "Santana do Mato", "São José da Lamarosa"],
      "Benavente": ["Barrosa", "Benavente", "Samora Correia", "Santo Estêvão"],
      "Cartaxo": ["Cartaxo", "Ereira", "Lapa", "Pontével", "Vale da Pinta", "Vale da Pedra", "Valada"],
      "Alcanena": ["Alcanena", "Bugalhos", "Malhou, Louriceira e Espinheiro", "Minde", "Monsanto", "Vila Moreira"]
    }
  },
  "Setúbal": {
    concelhos: {
      "Setúbal": ["Setúbal (Santa Maria da Graça)", "Setúbal (São Julião, Nossa Senhora da Anunciada e Santa Maria da Graça)", "Setúbal (São Sebastião)", "Sado"],
      "Almada": ["Almada, Cova da Piedade, Pragal e Cacilhas", "Caparica e Trafaria", "Costa da Caparica", "Feijó", "Laranjeiro e Feijó"],
      "Barreiro": ["Barreiro", "Lavradio", "Santo André", "Santo António da Charneca", "Verderena"],
      "Moita": ["Alhos Vedros", "Baixa da Banheira e Vale da Amoreira", "Moita", "Sarilhos Pequenos"],
      "Montijo": ["Afonsoeiro", "Alto Estanqueiro-Jardia", "Atalaia", "Canha", "Montijo e Afonsoeiro", "Pegões", "Sarilhos Grandes"],
      "Alcochete": ["Alcochete", "São Francisco", "Samouco"],
      "Palmela": ["Águas de Moura", "Palmela", "Pinhal Novo", "Poceirão e Marateca", "Quinta do Anjo"],
      "Sesimbra": ["Castelo (Sesimbra)", "Quinta do Conde", "Santiago (Sesimbra)"],
      "Seixal": ["Aldeia de Paio Pires", "Amora", "Arrentela", "Corroios", "Fernão Ferro", "Seixal, Arrentela e Aldeia de Paio Pires"],
      "Alcácer do Sal": ["Alcácer do Sal (Santa Maria do Castelo e Santiago) e Santa Susana", "Comporta", "Torrão", "Santa Maria do Castelo"],
      "Grândola": ["Azinheira dos Barros e São Mamede do Sádão", "Carvalhal", "Grândola e Santa Margarida da Serra", "Melides"],
      "Santiago do Cacém": ["Abela", "Alvalade", "Cercal", "Ermidas-Sado", "Santiago do Cacém, Santa Cruz e São Bartolomeu da Serra", "Vale de Água"],
      "Sines": ["Porto Covo", "Sines"]
    }
  },
  "Viana do Castelo": {
    concelhos: {
      "Viana do Castelo": ["Afife", "Alvarães", "Areosa", "Barroselas e Carvoeiro", "Cardielos e Serreleis", "Carreço", "Castelo do Neiva", "Chafe", "Darque", "Deão", "Freixieiro de Soutelo", "Geraz do Lima (Santa Leocádia)", "Geraz do Lima (Santa Maria)", "Lanheses", "Mazarefes e Vila Fria", "Meadela", "Meixedo", "Monserrate", "Montaria", "Moreira de Geraz do Lima", "Mujães", "Neiva", "Nogueira, Meixedo e Vilar de Murteda", "Outeiro", "Perre", "Santa Leocádia de Geraz do Lima", "Santa Marta de Portuzelo", "São Romão de Neiva", "Subportela, Deocriste e Portela Susã", "Torre e Vila Mou", "União das Freguesias de Viana do Castelo (Santa Maria Maior e Monserrate) e Meadela", "Viana do Castelo (Santa Maria Maior)", "Vila de Punhe", "Vila Franca", "Vila Mou e Torre"],
      "Ponte de Lima": ["Arca e Ponte de Lima", "Ardegão", "Beiral do Lima", "Bertiandos", "Boivães", "Brandara", "Cabração e Moreira do Lima", "Cabaços e Fojo Lobal", "Calvelo", "Cepões", "Correlhã", "Estorãos", "Facha", "Feitosa", "Fontão", "Fornelos", "Freixo", "Gandra e Tamel (São Veríssimo)", "Gemieira", "Gondufe", "Labruja", "Labrujó", "Moreira do Lima", "Navió", "Poiares", "Queijada", "Refojos do Lima", "Ribeira", "Santa Comba", "Santa Cruz do Lima", "São João de Rei", "São Pedro de Arcos", "Seara", "Serdedelo", "Souto e Tamel (Santa Leocádia)", "Vitorino das Donas"],
      "Arcos de Valdevez": ["Aguiã", "Alvora e Loureda", "Arcos de Valdevez (Salvador), Giela e Vila Fonche", "Cabreiro", "Couto e Estorãos", "Eiras e São Paulo", "Gavieira", "Grade e Carralcova", "Guilhadeses e Santar", "Jolda (Madalena) e Rio Cabrão", "Mei", "Miranda do Lima", "Paçô", "Padreiro (Salvador)", "Padreiro (Santa Cristina)", "Portela do Gião", "Prozelo", "Rio de Moinhos e Abraão", "Santar", "São Cosme e São Damião e Sá", "São Jorge de Arcos de Valdevez", "São Paio de Jolda", "Soajo", "Taboado", "Valadares e Sá", "Valdreu", "Vila Fonche"],
      "Caminha": ["Âncora", "Arga (Baixo, Cima e São João)", "Azevedo", "Caminha (Matriz) e Vilarelho", "Cristelo", "Dem", "Gondar", "Lanhelas", "Moledo e Cristelo", "Orbacém", "Riba de Âncora", "Seixas", "Venade e Arcozelo", "Vila Praia de Âncora", "Vilar de Mouros"],
      "Melgaço": ["Alvaredo", "Castro Laboreiro", "Chaviães e Comenda", "Cousso e Espinhosela", "Cristoval", "Cubalhão", "Fiães", "Gave", "Lamas de Mouro", "Melgaço e Paderne", "Paços", "Parada do Monte e Cubalhão", "Penso", "Peso e Vales do Rio", "Prado e Remoães", "Roussas", "São Paio"],
      "Monção": ["Abedim", "Anhões", "Badim", "Barbeita", "Cambeses", "Ceivães", "Cortes", "Lapela", "Lara", "Longos Vales", "Mazedo e Cortes", "Merufe", "Monção e Troviscoso", "Moreira", "Pias", "Podame", "Riba de Mouro", "Sago, Lordelo e Parada", "Segude", "Silva", "Tangil", "Troporiz e Lapela", "Troviscoso", "Valadares"],
      "Paredes de Coura": ["Bico e Cristelo", "Cossourado e Linhares", "Cunha", "Ferreira", "Formariz e Ferreira", "Infesta", "Insalde e Porreiras", "Parada", "Paredes de Coura e Resende", "Romarigães", "Rubiães", "São Julião"],
      "Ponte da Barca": ["Azias", "Barca, Cruzeiro e Brufe", "Bravães", "Entre Ambos-os-Rios, Ermida e Germil", "Gandra", "Givões", "Gondomil e Sanfins", "Lindoso", "Oleiros", "Parada", "Ponte da Barca", "Sampriz", "São Miguel de Crasto", "Touvedo (Salvador)", "Touvedo (São Lourenço)", "Vila Nova de Muía"],
      "Valença": ["Arão e Codessoso", "Boivão", "Campos e Vila Meã", "Cristelo Covo e Torredeita", "Fontoura", "Gandra", "Ganfei", "Silva e Orelhã", "São Julião e Silva", "São Pedro da Torre", "Valença, Cristelo Covo e Arão"],
      "Vila Nova de Cerveira": ["Campos e Vila Meã", "Cerveira e Nogueira", "Cornes", "Gondarém", "Loivo", "Lovelhe e Cristelo", "Mentrestido", "Nogueira", "Reboreda", "Sapardos", "Vila Nova de Cerveira e Lovelhe"]
    }
  },
  "Vila Real": {
    concelhos: ["Alijó", "Boticas", "Chaves", "Mesão Frio", "Mondim de Basto", "Montalegre", "Murça", "Peso da Régua", "Ribeira de Pena", "Sabrosa", "Santa Marta de Penaguião", "Valpaços", "Vila Pouca de Aguiar", "Vila Real"]
  },
  "Viseu": {
    concelhos: {
      "Viseu": ["Abraveses", "Barreiros e Cepões", "Boa Aldeia, Farminhão e Torredeita", "Bodiosa", "Cavernães", "Cepões", "Coração de Jesus", "Cota", "Fail e Vila Chã de Sá", "Fragosela", "Lordosa", "Mundão", "Orgens", "Povolide", "Repeses e São Salvador", "Rio de Loba", "Santos Evos", "São Cipriano e Mundão", "São João de Lourosa", "São Pedro de France", "Silgueiros", "Viseu (Santa Maria)"],
      "Lamego": ["Almacave", "Avões", "Bigorne", "Briande", "Cambres", "Cepões", "Ferreirim", "Figueira", "Godim", "Lamego (Almacave e Sé)", "Lazarim", "Magueija", "Meijinhos", "Melcões", "Parada do Bispo", "Penajóia", "Pretarouca", "Samodães", "Sande", "São João de Tarouca", "Várzea de Abrunhais", "Vila Nova de Souto de El-Rei"],
      "Tondela": ["Barreiro de Besteiros", "Besteiros", "Campo de Besteiros", "Canas de Santa Maria", "Castelões", "Ferreira de Aves", "Guardão", "Lajeosa do Mondego", "Molelos", "Mosteirinho", "Nandufe", "Sabugosa", "São João do Monte e Mosteirinho", "São Miguel do Outeiro e Sabugosa", "Tondela e Nandufe", "Vila Nova da Rainha"],
      "Mangualde": ["Abrunhosa-a-Velha", "Alcafache", "Cunha Alta", "Espinho", "Fornos de Maceira Dão", "Mangualde", "Mesquitela", "Moimenta de Maceira Dão", "Quintela de Azurara", "Santiago de Cassurrães", "São João da Fresta"],
      "Santa Comba Dão": ["Couto do Mosteiro", "Óvoa", "Santa Comba Dão", "São João de Areias", "Treixedo e Nagozela"],
      "Carregal do Sal": ["Beijós", "Cabanas de Viriato", "Carregal do Sal", "Oliveira do Conde", "Parada"],
      "Nelas": ["Carvalhal Redondo", "Canas de Senhorim", "Lapa do Lobo", "Moreira", "Nelas", "Santar", "Senhorim", "Vilar Seco"],
      "Oliveira de Frades": ["Arca", "Destriz", "Oliveira de Frades", "Pinheiro", "Reigoso", "São João da Serra", "São Pedro do Sul", "Sejães", "Souto de Lafões"],
      "São Pedro do Sul": ["Baiões", "Bordonhos", "Carvalhais", "Manhouce", "Pindelo dos Milagres", "Santa Cruz da Trapa", "São Cristóvão de Lafões", "São Félix", "São Martinho das Moitas", "São Pedro do Sul", "Sul", "Valadares"],
      "Castro Daire": ["Almofala", "Cabril", "Cujó", "Ester", "Gafanhão", "Gosende", "Mamouros", "Mezio", "Moledo", "Parada de Ester", "Pepim", "Picão", "Ribolhos", "São Joaninho", "Touro"],
      "Sátão": ["Avelal", "Decermilo", "Ferreira de Aves", "Mioma", "Rio de Moinhos", "Sátão", "Vila de Frades"],
      "Penalva do Castelo": ["Antas", "Castelo", "Germil", "Ínsua", "Matela", "Penalva do Castelo", "Real", "Vila Cova à Coelheira"],
      "Mortágua": ["Cercosa", "Espinho", "Marmeleira", "Mortágua", "Pala", "Vale de Remígio"],
      "Vouzela": ["Cambra", "Campia", "Fataunços", "Figueiredo das Donas", "Paços de Vilharigues", "Queirã", "São Miguel do Mato", "Ventosa", "Vouzela"],
      "Armamar": ["Aricera", "Armamar", "Carrazedo de Montenegro", "Coura", "Fontelo", "Goujoim", "Queimada", "Santo Adrião", "São Cosmado", "Tões", "Vacalar"],
      "Cinfães": ["Alhões", "Bustelo", "Cinfães", "Escamarão", "Espadanedo", "Fornelos", "Gralheira", "Nespereira", "Oliveira do Douro", "Ramires", "Santiago de Piães", "São Cristóvão de Nogueira", "Souselo", "Tarouquela", "Tendais", "Travanca"],
      "Resende": ["Anreade", "Barrô", "Caldas de Aregos", "Felgueiras", "Freigil", "Miomães", "Ovadas", "Paus", "Resende", "São Cipriano", "São João de Fontoura", "São Martinho de Mouros"],
      "Tabuaço": ["Arcos", "Barcos", "Desejosa", "Granja do Tedo", "Long Álvares", "Pinheiros", "Santa Leocádia", "São Cosme", "Sendim", "Tabuaço", "Távora", "Vale de Figueira", "Valença do Douro", "Vilarinho de São Romão"],
      "São João da Pesqueira": ["Castanheiro do Sul", "Ervedosa do Douro", "Espinhosa", "Gouvinhas", "Nagozelo do Douro", "Paredes da Beira", "Pereiros", "Riodades", "São João da Pesqueira", "Soutelo do Douro", "Trevões", "Vale de Mendiz", "Valongo de Milhais", "Várzea de Trevões"],
      "Tarouca": ["Dálvares", "Gouviães", "Granja Nova", "Mondim da Beira", "São João de Tarouca", "Tarouca", "Ucanha", "Vila Chã da Beira"],
      "Moimenta da Beira": ["Alvite", "Ariz", "Cabaços", "Carapito", "Leomil", "Moimenta da Beira", "Paradinha", "Pêra Velha", "Rua", "Sernancelhe", "Vilar"],
      "Penedono": ["Antas", "Belaquel", "Castainço", "Granja", "Penedono", "Penela da Beira", "Póvoa de Penela", "Souto"],
      "Sernancelhe": ["Carregal", "Chosendo", "Cunha", "Faia", "Ferreirim", "Fonte Arcada", "Freixinho", "Lamosa", "Maçores", "Penso", "Quintela", "Sernancelhe", "Vila da Ponte"]
    }
  }
}

const serviceTypes = [
  "Box Braids",
  "Tranças Nagô", 
  "Twist Afro",
  "Dreadlocks",
  "Tranças Soltas",
  "Cornrows",
  "Ghana Braids",
  "Fulani Braids",
  "Crochet Braids",
  "Senegalese Twist",
  "Passion Twist",
  "Goddess Braids",
  "Dutch Braids",
  "French Braids",
  "Coloração Capilar",
  "Tratamentos Capilares",
  "Cortes Especializados"
]

export default function RegisterBraiderPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Dados pessoais
  const [personalData, setPersonalData] = useState({
    name: "",
    bio: "",
    contactEmail: "",
    contactPhone: "",
    whatsapp: "",
    instagram: "",
    profileImageUrl: ""
  })

  // Localização
  const [locationData, setLocationData] = useState({
    district: "",
    concelho: "",
    freguesia: "",
    address: "",
    postalCode: "",
    servesHome: false,
    servesStudio: false,
    maxTravelDistance: "10"
  })

  // Serviços e experiência
  const [serviceData, setServiceData] = useState({
    specialties: [] as string[],
    yearsExperience: "",
    certificates: "",
    portfolio: [],
    minPrice: "",
    maxPrice: "",
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    }
  })

  const [concelhos, setConcelhos] = useState<string[]>([])
  const [freguesias, setFreguesias] = useState<string[]>([])

  // Função para obter concelhos de um distrito
  const getConcelhos = (district: string): string[] => {
    const districtData = portugalDistricts[district as keyof typeof portugalDistricts]
    if (!districtData) return []
    
    if (Array.isArray(districtData.concelhos)) {
      return districtData.concelhos
    } else {
      return Object.keys(districtData.concelhos)
    }
  }

  // Função para obter freguesias de um concelho
  const getFreguesias = (district: string, concelho: string): string[] => {
    const districtData = portugalDistricts[district as keyof typeof portugalDistricts]
    if (!districtData || Array.isArray(districtData.concelhos)) return []
    
    return districtData.concelhos[concelho as keyof typeof districtData.concelhos] || []
  }

  const handleDistrictChange = (district: string) => {
    setLocationData(prev => ({
      ...prev,
      district,
      concelho: "",
      freguesia: ""
    }))
    setConcelhos(getConcelhos(district))
    setFreguesias([])
  }

  const handleConcelhoChange = (concelho: string) => {
    setLocationData(prev => ({
      ...prev,
      concelho,
      freguesia: ""
    }))
    setFreguesias(getFreguesias(locationData.district, concelho))
  }

  const handleSpecialtyToggle = (specialty: string) => {
    setServiceData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações
      if (!personalData.name || !personalData.bio || !personalData.contactEmail || !personalData.contactPhone) {
        toast.error("Por favor, preencha todos os campos obrigatórios dos dados pessoais.")
        setCurrentStep(1)
        return
      }

      if (!locationData.district || !locationData.concelho) {
        toast.error("Por favor, selecione pelo menos o distrito e concelho.")
        setCurrentStep(2)
        return
      }

      if (serviceData.specialties.length === 0) {
        toast.error("Por favor, selecione pelo menos uma especialidade.")
        setCurrentStep(3)
        return
      }

      const fullLocation = `${locationData.freguesia ? locationData.freguesia + ', ' : ''}${locationData.concelho}, ${locationData.district}, Portugal`

      const result = await addBraider({
        name: personalData.name,
        bio: personalData.bio,
        location: fullLocation,
        contactEmail: personalData.contactEmail,
        contactPhone: personalData.contactPhone,
        profileImageUrl: personalData.profileImageUrl,
      })

      if (result.success) {
        toast.success("Cadastro enviado com sucesso! Nossa equipe irá analisar e entrar em contato em breve. 🎉")
        // Reset form
        setPersonalData({
          name: "",
          bio: "",
          contactEmail: "",
          contactPhone: "",
          whatsapp: "",
          instagram: "",
          profileImageUrl: ""
        })
        setLocationData({
          district: "",
          concelho: "",
          freguesia: "",
          address: "",
          postalCode: "",
          servesHome: false,
          servesStudio: false,
          maxTravelDistance: "10"
        })
        setServiceData({
          specialties: [],
          yearsExperience: "",
          certificates: "",
          portfolio: [],
          minPrice: "",
          maxPrice: "",
          availability: {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
          }
        })
        setCurrentStep(1)
      } else {
        toast.error(result.message || "Erro ao enviar cadastro. Tente novamente.")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-primary via-brand-background to-accent-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
            <Award className="h-10 w-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
            Torne-se uma{" "}
            <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
              Trancista Parceira
            </span>
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Junte-se à maior rede de trancistas profissionais de Portugal. 
            Conecte-se com clientes e faça parte da nossa comunidade!
          </p>
        </div>
      </div>

      <main className="flex-1 -mt-8 relative z-10 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Progress Steps */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all",
                      currentStep >= step 
                        ? "bg-brand-primary text-white shadow-lg" 
                        : "bg-gray-200 text-gray-500"
                    )}>
                      {currentStep > step ? <Check className="h-6 w-6" /> : step}
                    </div>
                    {step < 3 && (
                      <div className={cn(
                        "h-1 w-20 md:w-32 mx-4 transition-all",
                        currentStep > step ? "bg-brand-primary" : "bg-gray-200"
                      )} />
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className={cn(
                  "p-4 rounded-xl transition-all",
                  currentStep === 1 ? "bg-brand-50 border-2 border-brand-primary" : "bg-gray-50"
                )}>
                  <User className={cn("h-8 w-8 mx-auto mb-2", currentStep === 1 ? "text-brand-primary" : "text-gray-400")} />
                  <h3 className="font-semibold">Dados Pessoais</h3>
                  <p className="text-sm text-gray-600">Informações básicas e contato</p>
                </div>
                <div className={cn(
                  "p-4 rounded-xl transition-all",
                  currentStep === 2 ? "bg-brand-50 border-2 border-brand-primary" : "bg-gray-50"
                )}>
                  <MapPin className={cn("h-8 w-8 mx-auto mb-2", currentStep === 2 ? "text-brand-primary" : "text-gray-400")} />
                  <h3 className="font-semibold">Localização</h3>
                  <p className="text-sm text-gray-600">Onde você atende</p>
                </div>
                <div className={cn(
                  "p-4 rounded-xl transition-all",
                  currentStep === 3 ? "bg-brand-50 border-2 border-brand-primary" : "bg-gray-50"
                )}>
                  <Star className={cn("h-8 w-8 mx-auto mb-2", currentStep === 3 ? "text-brand-primary" : "text-gray-400")} />
                  <h3 className="font-semibold">Serviços</h3>
                  <p className="text-sm text-gray-600">Especialidades e experiência</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Content */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-brand-primary">
                {currentStep === 1 && "Dados Pessoais"}
                {currentStep === 2 && "Localização e Atendimento"}
                {currentStep === 3 && "Serviços e Especialidades"}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {currentStep === 1 && "Conte-nos sobre você e como podemos entrar em contato"}
                {currentStep === 2 && "Onde você atende e qual sua área de cobertura"}
                {currentStep === 3 && "Suas especialidades, experiência e disponibilidade"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Step 1: Personal Data */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2 text-base font-semibold">
                          <User className="h-4 w-4" />
                          Nome Completo *
                        </Label>
                        <Input
                          id="name"
                          placeholder="Seu nome completo"
                          value={personalData.name}
                          onChange={(e) => setPersonalData(prev => ({...prev, name: e.target.value}))}
                          className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="flex items-center gap-2 text-base font-semibold">
                          <Mail className="h-4 w-4" />
                          Email *
                        </Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          placeholder="seu@email.com"
                          value={personalData.contactEmail}
                          onChange={(e) => setPersonalData(prev => ({...prev, contactEmail: e.target.value}))}
                          className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone" className="flex items-center gap-2 text-base font-semibold">
                          <Phone className="h-4 w-4" />
                          Telefone *
                        </Label>
                        <Input
                          id="contactPhone"
                          type="tel"
                          placeholder="+351 912 345 678"
                          value={personalData.contactPhone}
                          onChange={(e) => setPersonalData(prev => ({...prev, contactPhone: e.target.value}))}
                          className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="flex items-center gap-2 text-base font-semibold">
                          <Phone className="h-4 w-4" />
                          WhatsApp (opcional)
                        </Label>
                        <Input
                          id="whatsapp"
                          type="tel"
                          placeholder="+351 912 345 678"
                          value={personalData.whatsapp}
                          onChange={(e) => setPersonalData(prev => ({...prev, whatsapp: e.target.value}))}
                          className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="flex items-center gap-2 text-base font-semibold">
                        <User className="h-4 w-4" />
                        Sobre Você *
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Conte sobre sua experiência, paixão pelas tranças e o que te diferencia. Ex: Especialista em Box Braids com 5 anos de experiência, formada em técnicas afro-brasileiras..."
                        rows={4}
                        value={personalData.bio}
                        onChange={(e) => setPersonalData(prev => ({...prev, bio: e.target.value}))}
                        className="rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                        required
                      />
                      <p className="text-sm text-gray-500">
                        Mínimo 50 caracteres. Esta descrição será vista pelos clientes.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="flex items-center gap-2 text-base font-semibold">
                          <Camera className="h-4 w-4" />
                          Instagram (opcional)
                        </Label>
                        <Input
                          id="instagram"
                          placeholder="@seuperfil"
                          value={personalData.instagram}
                          onChange={(e) => setPersonalData(prev => ({...prev, instagram: e.target.value}))}
                          className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profileImageUrl" className="flex items-center gap-2 text-base font-semibold">
                          <Camera className="h-4 w-4" />
                          Foto de Perfil (opcional)
                        </Label>
                        <Input
                          id="profileImageUrl"
                          placeholder="URL da sua foto profissional"
                          value={personalData.profileImageUrl}
                          onChange={(e) => setPersonalData(prev => ({...prev, profileImageUrl: e.target.value}))}
                          className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Location */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                          <MapPin className="h-4 w-4" />
                          Distrito *
                        </Label>
                        <Select onValueChange={handleDistrictChange} value={locationData.district}>
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background">
                            <SelectValue placeholder="Selecione o distrito" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(portugalDistricts).map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                          <MapPin className="h-4 w-4" />
                          Concelho *
                        </Label>
                        <Select 
                          onValueChange={handleConcelhoChange} 
                          value={locationData.concelho}
                          disabled={!locationData.district}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background">
                            <SelectValue placeholder="Selecione o concelho" />
                          </SelectTrigger>
                          <SelectContent>
                            {concelhos.map((concelho) => (
                              <SelectItem key={concelho} value={concelho}>
                                {concelho}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                          <MapPin className="h-4 w-4" />
                          Freguesia (opcional)
                        </Label>
                        <Select 
                          onValueChange={(value) => setLocationData(prev => ({...prev, freguesia: value}))} 
                          value={locationData.freguesia}
                          disabled={!locationData.concelho}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background">
                            <SelectValue placeholder="Selecione a freguesia" />
                          </SelectTrigger>
                          <SelectContent>
                            {freguesias.map((freguesia) => (
                              <SelectItem key={freguesia} value={freguesia}>
                                {freguesia}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="flex items-center gap-2 text-base font-semibold">
                          <MapPin className="h-4 w-4" />
                          Código Postal (opcional)
                        </Label>
                        <Input
                          id="postalCode"
                          placeholder="1000-001"
                          value={locationData.postalCode}
                          onChange={(e) => setLocationData(prev => ({...prev, postalCode: e.target.value}))}
                          className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-2 text-base font-semibold">
                        <Home className="h-4 w-4" />
                        Morada Completa (opcional)
                      </Label>
                      <Input
                        id="address"
                        placeholder="Rua, número, andar (se aplicável)"
                        value={locationData.address}
                        onChange={(e) => setLocationData(prev => ({...prev, address: e.target.value}))}
                        className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                      />
                      <p className="text-sm text-gray-500">
                        Esta informação não será pública, apenas para contato administrativo.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Modalidades de Atendimento *</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center space-x-3 p-4 border rounded-xl">
                          <Checkbox
                            id="servesHome"
                            checked={locationData.servesHome}
                            onCheckedChange={(checked) => setLocationData(prev => ({...prev, servesHome: !!checked}))}
                          />
                          <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-brand-primary" />
                            <Label htmlFor="servesHome" className="font-semibold">
                              Atendimento ao Domicílio
                            </Label>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border rounded-xl">
                          <Checkbox
                            id="servesStudio"
                            checked={locationData.servesStudio}
                            onCheckedChange={(checked) => setLocationData(prev => ({...prev, servesStudio: !!checked}))}
                          />
                          <div className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-brand-primary" />
                            <Label htmlFor="servesStudio" className="font-semibold">
                              Atendimento no Estúdio/Casa
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {locationData.servesHome && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                          <Car className="h-4 w-4" />
                          Distância Máxima de Deslocação (km)
                        </Label>
                        <Select 
                          onValueChange={(value) => setLocationData(prev => ({...prev, maxTravelDistance: value}))} 
                          value={locationData.maxTravelDistance}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-200">
                            <SelectValue placeholder="Selecione a distância" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">Até 5 km</SelectItem>
                            <SelectItem value="10">Até 10 km</SelectItem>
                            <SelectItem value="20">Até 20 km</SelectItem>
                            <SelectItem value="30">Até 30 km</SelectItem>
                            <SelectItem value="50">Até 50 km</SelectItem>
                            <SelectItem value="100">Mais de 50 km</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Services */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Especialidades * (selecione todas que se aplicam)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {serviceTypes.map((service) => (
                          <div
                            key={service}
                            onClick={() => handleSpecialtyToggle(service)}
                            className={cn(
                              "p-3 rounded-xl border-2 cursor-pointer transition-all text-center text-sm font-medium",
                              serviceData.specialties.includes(service)
                                ? "border-brand-primary bg-brand-50 text-brand-primary"
                                : "border-gray-200 hover:border-brand-200 hover:bg-brand-50/50"
                            )}
                          >
                            {service}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">
                        Selecione pelo menos uma especialidade. Isso ajudará os clientes a encontrá-la.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="yearsExperience" className="flex items-center gap-2 text-base font-semibold">
                          <Clock className="h-4 w-4" />
                          Anos de Experiência
                        </Label>
                        <Select 
                          onValueChange={(value) => setServiceData(prev => ({...prev, yearsExperience: value}))} 
                          value={serviceData.yearsExperience}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-200">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iniciante">Iniciante (menos de 1 ano)</SelectItem>
                            <SelectItem value="1-2">1-2 anos</SelectItem>
                            <SelectItem value="3-5">3-5 anos</SelectItem>
                            <SelectItem value="6-10">6-10 anos</SelectItem>
                            <SelectItem value="10+">Mais de 10 anos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="certificates" className="flex items-center gap-2 text-base font-semibold">
                          <Award className="h-4 w-4" />
                          Certificações (opcional)
                        </Label>
                        <Input
                          id="certificates"
                          placeholder="Ex: Curso de Box Braids, Certificação em Dreadlocks..."
                          value={serviceData.certificates}
                          onChange={(e) => setServiceData(prev => ({...prev, certificates: e.target.value}))}
                          className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="minPrice" className="flex items-center gap-2 text-base font-semibold">
                          <Euro className="h-4 w-4" />
                          Preço Mínimo (€)
                        </Label>
                        <Input
                          id="minPrice"
                          type="number"
                          placeholder="25"
                          value={serviceData.minPrice}
                          onChange={(e) => setServiceData(prev => ({...prev, minPrice: e.target.value}))}
                          className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxPrice" className="flex items-center gap-2 text-base font-semibold">
                          <Euro className="h-4 w-4" />
                          Preço Máximo (€)
                        </Label>
                        <Input
                          id="maxPrice"
                          type="number"
                          placeholder="150"
                          value={serviceData.maxPrice}
                          onChange={(e) => setServiceData(prev => ({...prev, maxPrice: e.target.value}))}
                          className="h-12 rounded-xl border-gray-200 focus:border-brand-background focus:ring-brand-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Disponibilidade Semanal</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { key: 'monday', label: 'Segunda' },
                          { key: 'tuesday', label: 'Terça' },
                          { key: 'wednesday', label: 'Quarta' },
                          { key: 'thursday', label: 'Quinta' },
                          { key: 'friday', label: 'Sexta' },
                          { key: 'saturday', label: 'Sábado' },
                          { key: 'sunday', label: 'Domingo' }
                        ].map((day) => (
                          <div key={day.key} className="flex items-center space-x-2 p-3 border rounded-xl">
                            <Checkbox
                              id={day.key}
                              checked={serviceData.availability[day.key as keyof typeof serviceData.availability]}
                              onCheckedChange={(checked) => setServiceData(prev => ({
                                ...prev,
                                availability: {
                                  ...prev.availability,
                                  [day.key]: !!checked
                                }
                              }))}
                            />
                            <Label htmlFor={day.key} className="text-sm font-medium">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="px-6 py-3 rounded-xl"
                  >
                    Anterior
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-3 bg-brand-primary hover:bg-brand-background text-white rounded-xl"
                    >
                      Próximo
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-brand-primary to-brand-background hover:from-brand-800 hover:to-brand-700 text-white rounded-xl shadow-lg"
                    >
                      {loading ? "Enviando..." : "Finalizar Cadastro"}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid gap-6 md:grid-cols-3 mt-8">
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border-0">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 text-brand-primary" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Análise Cuidadosa</h3>
                <p className="text-sm text-gray-600">
                  Nossa equipe analisa cada cadastro para garantir a qualidade dos serviços.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border-0">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-accent-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Visibilidade</h3>
                <p className="text-sm text-gray-600">
                  Apareça nos resultados de busca e conecte-se com clientes próximos.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border-0">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Sem Taxas</h3>
                <p className="text-sm text-gray-600">
                  Cadastro gratuito. Sem mensalidades ou comissões sobre vendas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-brand-primary via-brand-background to-accent-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={40}
              height={40}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-2xl font-bold font-heading text-accent-300">WILNARA TRANÇAS</span>
          </div>
          <p className="text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}