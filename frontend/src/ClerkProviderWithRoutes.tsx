import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ClerkProvider, useAuth, useClerk } from '@clerk/react'

function AutoLogoutManager({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    // 1. If this tab has already verified the active session, do nothing.
    if (sessionStorage.getItem('envision_session_active') === 'true') {
      setCheckingSession(false)
      return
    }

    const hasBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window

    if (!hasBroadcastChannel) {
      // Fallback if BroadcastChannel is not supported: do not auto-logout
      sessionStorage.setItem('envision_session_active', 'true')
      setCheckingSession(false)
      return
    }

    // 2. Set up BroadcastChannel to ping other tabs
    const channel = new BroadcastChannel('envision_tab_session')
    let receivedPong = false

    channel.onmessage = (event) => {
      if (event.data === 'pong') {
        receivedPong = true
      }
    }

    // Ask other open tabs if they exist
    channel.postMessage('ping')

    // Wait 300ms for a response from any active tab
    const timer = setTimeout(async () => {
      if (!receivedPong) {
        // No other active tab is open; this is a brand new site session.
        // If a user session is active in the persistent cookies, clear it.
        if (isSignedIn) {
          try {
            await signOut()
          } catch (error) {
            console.error('[SessionSync] Auto logout failed:', error)
          }
        }
      }

      // Mark this tab's session as active
      sessionStorage.setItem('envision_session_active', 'true')
      setCheckingSession(false)
      channel.close()
    }, 300)

    return () => {
      clearTimeout(timer)
      channel.close()
    }
  }, [isLoaded, isSignedIn, signOut])

  useEffect(() => {
    const hasBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
    if (!hasBroadcastChannel) return

    // 3. Listen for pings from other tabs and reply with a pong (only if verified)
    const channel = new BroadcastChannel('envision_tab_session')
    channel.onmessage = (event) => {
      if (event.data === 'ping') {
        if (sessionStorage.getItem('envision_session_active') === 'true') {
          channel.postMessage('pong')
        }
      }
    }

    return () => {
      channel.close()
    }
  }, [])

  if (checkingSession) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b1326]/85 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4cd7f6] border-t-transparent" />
          <p className="font-sans text-xs font-semibold text-[#dae2fd]/70 tracking-widest uppercase">
            Verifying secure session...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function ClerkProviderWithRoutes({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <AutoLogoutManager>{children}</AutoLogoutManager>
    </ClerkProvider>
  )
}