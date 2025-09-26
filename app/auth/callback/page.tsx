'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, createUserRecord } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setError('Authentication failed. Please try again.')
          console.error('Auth callback error:', error)
        } else if (data.session) {
          // Create user record in the users table
          const userResult = await createUserRecord(
            data.session.user.id, 
            data.session.user.email!
          )
          
          if (userResult.error) {
            console.error('Error creating user record:', userResult.error)
            // Still proceed to main app even if user record creation fails
          }
          
          // Successful authentication, redirect to main app
          router.push('/')
        } else {
          setError('No session found. Please try signing in again.')
        }
      } catch (err) {
        setError('An unexpected error occurred.')
        console.error('Callback error:', err)
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return null
}