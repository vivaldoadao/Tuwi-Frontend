export interface User {
  id: string
  name: string
  email: string
}

// Simulate user login: always succeeds with a dummy user
export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: User }> {
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay

  // Always return a success with a dummy user
  const dummyUser: User = {
    id: "user-1700000000000", // Matches dummy orders in lib/orders.ts
    name: "Usuário Teste",
    email: email || "teste@example.com", // Use provided email or a default
  }
  return { success: true, message: "Login bem-sucedido!", user: dummyUser }
}
