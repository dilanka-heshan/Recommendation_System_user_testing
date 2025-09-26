'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NODE_ENV === 'production' ? 'https://recommendation-system-user-testing.vercel.app' : window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Check your email for the login link!')
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Sign In
      </h2>
      <p className="text-sm text-gray-600 text-center mb-4">
        Enter your email to get a magic link for sign in
      </p>
      
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${
          message.includes('Check your email') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500 text-center">
        We&apos;ll send you a secure link to sign in without a password
      </div>
    </div>
  )
}