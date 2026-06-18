import { useState, useCallback } from 'react'
import api from '../services/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(initialData: T | null = null) {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const request = useCallback(
    async (url: string, method: 'get' | 'post' | 'put' | 'delete' = 'get', body?: any) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const response = await api.request<T>({
          url,
          method,
          data: body,
        })
        const data = response as unknown as T
        setState((prev) => ({ ...prev, data, loading: false }))
        return data
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || '请求失败',
          loading: false,
        }))
        throw error
      }
    },
    []
  )

  return {
    ...state,
    request,
    setData: (data: T | null) => setState((prev) => ({ ...prev, data })),
  }
}
