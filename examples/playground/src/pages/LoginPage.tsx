import { useState } from 'react'
import Login from '@/views/pages/Login.terse'

/** Dummy login: no backend, just echoes who "signed in". */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const login = () => setMessage(email && password ? `Signed in as ${email}` : 'Enter an email and password')

  return (
    <Login
      email={email}
      password={password}
      message={message}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onLogin={login}
    />
  )
}
