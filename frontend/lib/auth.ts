import { useAuthStore, User } from '@/stores/authStore'
import { authApi } from './api'

export async function login(email: string, password: string): Promise<User> {
  const response = await authApi.login({ email, password })

  const user: User = {
    id: response.user.id,
    email: response.user.email,
    name: response.user.email.split('@')[0], // Default name from email
    isAdmin: response.user.is_admin,
  }

  useAuthStore.getState().login(user, response.access_token)

  return user
}

export async function logout(): Promise<void> {
  const token = useAuthStore.getState().token

  if (token) {
    try {
      await authApi.logout(token)
    } catch (error) {
      // Continue with local logout even if API call fails
      console.error('Logout API error:', error)
    }
  }

  useAuthStore.getState().logout()
}

export async function checkAuth(): Promise<User | null> {
  const { token, setLoading, logout } = useAuthStore.getState()

  if (!token) {
    setLoading(false)
    return null
  }

  try {
    const userData = await authApi.me(token)
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.email.split('@')[0],
      isAdmin: userData.is_admin,
    }
    useAuthStore.getState().setUser(user)
    setLoading(false)
    return user
  } catch (error) {
    // Token is invalid or expired
    logout()
    setLoading(false)
    return null
  }
}

export function getAuthToken(): string | null {
  return useAuthStore.getState().token
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated
}
