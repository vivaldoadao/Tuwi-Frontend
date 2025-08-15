const fetch = require('node-fetch')

async function testRegistrationFix() {
  console.log('🧪 Testing braider registration fix...')
  
  // Test data for the existing email
  const testData = {
    name: "Test User",
    bio: "Test bio",
    location: "Test Location",
    contactEmail: "znattechnology95@gmail.com", // This email already exists
    contactPhone: "+123456789",
    whatsapp: "",
    instagram: "",
    district: "Test District",
    concelho: "Test Concelho",
    freguesia: "Test Freguesia",
    address: "Test Address",
    postalCode: "1234-567",
    servesHome: true,
    servesStudio: false,
    servesSalon: false,
    maxTravelDistance: 10,
    salonName: "",
    salonAddress: "",
    specialties: ["box-braids"],
    yearsExperience: "5-10",
    certificates: "Test certificates",
    minPrice: 20,
    maxPrice: 100,
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    }
  }

  try {
    console.log('📤 Sending registration request...')
    const response = await fetch('http://localhost:3001/api/braiders/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })

    const result = await response.json()
    
    console.log('📊 Response Status:', response.status)
    console.log('📊 Response Body:', result)
    
    if (response.status === 400 && result.message.includes('já tem uma conta aprovada')) {
      console.log('✅ SUCCESS: Registration properly blocked for existing approved braider!')
    } else if (response.status === 400 && result.message.includes('pedido de cadastro pendente')) {
      console.log('✅ SUCCESS: Registration properly blocked for pending braider!')
    } else if (response.status === 200) {
      console.log('❌ FAILURE: Registration was allowed when it should have been blocked!')
    } else {
      console.log('⚠️ UNEXPECTED: Unexpected response')
    }

  } catch (error) {
    console.error('💥 Error testing registration:', error.message)
    console.log('💡 Make sure the development server is running with: npm run dev')
  }
}

testRegistrationFix()