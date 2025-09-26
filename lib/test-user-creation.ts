// Test script to verify user creation functionality
// Run this in the browser console after authentication

import { supabase, createUserRecord, updateUserPreferences, getUserPreferences } from '@/lib/supabase'

// Test function to verify user creation works
export const testUserCreation = async () => {
  try {
    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('No authenticated user found')
      return
    }

    console.log('Current user:', user.id, user.email)

    // Test getting user preferences
    const preferencesResult = await getUserPreferences(user.id)
    if (preferencesResult.error) {
      console.error('Error getting preferences:', preferencesResult.error)
    } else {
      console.log('Current preferences:', preferencesResult.data)
    }

    // Test updating preferences
    const newPreferences = {
      topic: "Artificial Intelligence, Machine Learning, Data Science"
    }
    
    const updateResult = await updateUserPreferences(user.id, newPreferences)
    if (updateResult.error) {
      console.error('Error updating preferences:', updateResult.error)
    } else {
      console.log('Preferences updated successfully:', updateResult.data)
    }

    // Verify the update
    const verifyResult = await getUserPreferences(user.id)
    if (verifyResult.error) {
      console.error('Error verifying preferences:', verifyResult.error)
    } else {
      console.log('Verified preferences:', verifyResult.data)
    }

    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
    } else {
      console.log('User data in users table:', userData)
    }

  } catch (error) {
    console.error('Test error:', error)
  }
}

// Call this function to run the test
// testUserCreation()