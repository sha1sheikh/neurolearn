// src/pages/Home.tsx
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

export const Home = () => {
  const { isSignedIn } = useUser()
  const navigate = useNavigate()

  return (
    <div className="home">
      <h1>Welcome to NeuroLearn</h1>
      <p>A virtual learning studio for neurodivergent students</p>
      
      {isSignedIn ? (
        <button onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </button>
      ) : (
        <div className="cta-buttons">
          <button onClick={() => navigate('/sign-up')}>
            Get Started
          </button>
          <button onClick={() => navigate('/sign-in')}>
            Sign In
          </button>
        </div>
      )}
    </div>
  )
}
