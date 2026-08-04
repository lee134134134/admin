import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') ?? '')
  const name = ref<string>('')

  function setToken(value: string) {
    token.value = value
    localStorage.setItem('token', value)
  }

  function setName(value: string) {
    name.value = value
  }

  function logout() {
    token.value = ''
    name.value = ''
    localStorage.removeItem('token')
  }

  return { token, name, setToken, setName, logout }
})