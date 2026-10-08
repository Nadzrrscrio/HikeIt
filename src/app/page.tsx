'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // === STATE UNTUK FITUR LUPA PASSWORD ===
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)
  const [forgotError, setForgotError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard') 
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError(null)
    setForgotMessage(null)

    if (!forgotEmail) {
      setForgotError('Silakan masukkan email kamu.')
      setForgotLoading(false)
      return
    }

    try {
      const redirectUrl = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: redirectUrl,
      })

      if (error) {
        setForgotError(error.message)
      } else {
        setForgotMessage(
          `Instruksi reset password telah dikirim ke ${forgotEmail}. Silakan periksa folder Inbox/Spam email kamu.`
        )
      }
    } catch (err: any) {
      setForgotError(err.message || 'Gagal mengirim instruksi reset password.')
    } finally {
      setForgotLoading(false)
    }
  }

  const openForgotModal = () => {
    setForgotEmail(email) // Otomatis isi jika sudah pernah diketik di form login
    setForgotError(null)
    setForgotMessage(null)
    setIsForgotPasswordOpen(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 font-sans text-gray-100">
      <div className="max-w-md w-full bg-[#161616] p-8 rounded-2xl shadow-2xl border border-[#2e2e2e]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Masuk ke HikeIt</h1>
          <p className="text-gray-400 text-sm">Selamat datang kembali, siap menyewa alat?</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <button
                type="button"
                onClick={openForgotModal}
                className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors font-medium hover:underline"
              >
                Lupa password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? 'Memeriksa...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-400">
          Belum punya akun?{' '}
          <Link href="/register" className="text-emerald-500 font-semibold hover:text-emerald-400 transition-colors">
            Daftar sekarang
          </Link>
        </p>
      </div>

      {/* ================= MODAL LUPA PASSWORD ================= */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#2e2e2e] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsForgotPasswordOpen(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Lupa Password?</h2>
                <p className="text-xs text-gray-400">Masukkan email untuk memulihkan akses akun</p>
              </div>
            </div>

            {forgotMessage ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm rounded-xl space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <span>✓</span> Email Terkirim!
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {forgotMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="w-full bg-[#2e2e2e] hover:bg-[#3e3e3e] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Kembali ke Form Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotError && (
                  <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 text-xs rounded-xl">
                    {forgotError}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email Terdaftar</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/50 outline-none text-sm"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Kami akan mengirimkan link untuk membuat password baru ke email ini.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 bg-[#2e2e2e] hover:bg-[#3e3e3e] text-gray-300 text-sm font-semibold py-3 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {forgotLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}