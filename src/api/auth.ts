import { httpPost } from './request'

export interface LoginResponse {
  token: string
  name: string
}

/** 登录认证 */
export function login(username: string, password: string) {
  return httpPost<LoginResponse>('/auth/login', { username, password })
}
