declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      avatar_url?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    avatar_url?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}
