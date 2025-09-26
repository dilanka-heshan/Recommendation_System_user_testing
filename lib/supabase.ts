import { createClient } from '@supabase/supabase-js'

// Type definitions for user preferences
interface UserPreferences {
  topic?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Function to create or update user in custom users table
export const createUserRecord = async (userId: string, email: string, preferences?: UserPreferences) => {
  try {
    // First check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error checking existing user:', checkError)
      return { error: checkError }
    }

    // If user doesn't exist, create new record
    if (!existingUser) {
      const defaultPreferences = preferences || {
        topic: "Technology, Science, Innovation"
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          email: email,
          created_at: new Date().toISOString(),
          preferences: JSON.stringify(defaultPreferences),
          embedding_id: '[]'
        })
        .select()

      if (error) {
        console.error('Error creating user record:', error)
        return { error }
      }

      console.log('User record created successfully:', data)
      return { data }
    } else {
      console.log('User record already exists')
      return { data: existingUser }
    }
  } catch (error) {
    console.error('Unexpected error in createUserRecord:', error)
    return { error }
  }
}

// Function to update user preferences
export const updateUserPreferences = async (userId: string, preferences: UserPreferences) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        preferences: JSON.stringify(preferences)
      })
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error updating user preferences:', error)
      return { error }
    }

    console.log('User preferences updated successfully:', data)
    return { data }
  } catch (error) {
    console.error('Unexpected error in updateUserPreferences:', error)
    return { error }
  }
}

// Function to get user preferences
export const getUserPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error getting user preferences:', error)
      return { error }
    }

    const preferences = data.preferences ? JSON.parse(data.preferences) : null
    return { data: preferences }
  } catch (error) {
    console.error('Unexpected error in getUserPreferences:', error)
    return { error }
  }
}