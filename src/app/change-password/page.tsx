'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Komponen icon mata (bisa lihat)
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

// Komponen icon mata dicoret (tersembunyi)
function EyeSlashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase])

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Validasi input
      if (!oldPassword) {
        setError('Password lama wajib diisi.')
        return
      }

      if (newPassword !== confirmPassword) {
        setError('Password baru dan konfirmasi password tidak cocok.')
        return
      }

      if (newPassword.length < 6) {
        setError('Password baru minimal 6 karakter.')
        return
      }

      if (oldPassword === newPassword) {
        setError('Password baru tidak boleh sama dengan password lama.')
        return
      }

      setSaving(true)

      // Ambil data user aktif
      const { data: { user }, error: getUserError } = await supabase.auth.getUser()

      if (getUserError || !user?.email) {
        setError('Sesi login tidak valid. Silakan login kembali.')
        return
      }

      // Verifikasi password lama
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      })

      if (signInError) {
        setError('Password lama yang kamu masukkan salah. Silakan coba lagi.')
        return
      }

      // Update ke password baru
      const { error: pwdError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (pwdError) throw pwdError

      router.push('/dashboard')
      router.refresh()

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError('Gagal memperbarui password: ' + err.message)
      } else {
        setError('Terjadi kesalahan tak terduga. Silakan coba lagi.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-100 flex justify-center items-start">
      <div className="max-w-2xl w-full bg-[#161616] p-8 rounded-2xl shadow-2xl border border-[#2e2e2e]">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-emerald-500 text-sm font-semibold hover:text-emerald-300 transition-colors group mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Kembali ke Dashboard
        </Link>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Ganti Password</h1>
          <p className="text-gray-400 text-sm">Amankan akun HikeIt kamu dengan memperbarui password secara berkala.</p>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#2e2e2e] pb-2">
              <h2 className="text-lg font-bold text-emerald-500">Ubah Password Akun</h2>
            </div>

            {/* Field Password Lama */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password Lama</label>
              <div className="relative">
                <input
                  id="old-password"
                  type={showOldPassword ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm"
                  placeholder="Masukkan password saat ini"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  title={showOldPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showOldPassword ? <EyeIcon /> : <EyeSlashIcon />}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#2e2e2e]" />

            {/* Field Password Baru & Konfirmasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Password Baru</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    title={showNewPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showNewPassword ? <EyeIcon /> : <EyeSlashIcon />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-sm"
                    placeholder="Ulangi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    title={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showConfirmPassword ? <EyeIcon /> : <EyeSlashIcon />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#2e2e2e]">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Batal
            </button>
            <button
              id="submit-change-password"
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Memverifikasi & Menyimpan...' : 'Ubah Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
