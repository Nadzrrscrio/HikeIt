'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [role, setRole] = useState('')
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [mapsLink, setMapsLink] = useState('')
  const [hours, setHours] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      setUserId(session.user.id)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setFullName(profileData.full_name || '')
        setPhoneNumber(profileData.phone_number || '')
        setRole(profileData.role)

        if (profileData.role === 'penyedia') {
          const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', session.user.id)
            .single()
            
          if (storeData) {
            setStoreId(storeData.id)
            setStoreName(storeData.store_name || '')
            setAddress(storeData.address || '')
            setMapsLink(storeData.maps_link || '')
            setHours(storeData.operational_hours || '')
          }
        }
      }
      setLoading(false)
    }
    loadData()
  }, [router, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone_number: phoneNumber })
        .eq('id', userId)

      if (profileError) throw profileError

      if (role === 'penyedia' && storeId) {
        const { error: storeError } = await supabase
          .from('stores')
          .update({
            store_name: storeName,
            address: address,
            maps_link: mapsLink,
            operational_hours: hours
          })
          .eq('id', storeId)
        
        if (storeError) throw storeError
      }
      
      alert('Perubahan berhasil disimpan!')
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      alert('Gagal menyimpan perubahan: ' + error.message)
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
        <Link href="/dashboard" className="text-emerald-500 text-sm font-medium hover:underline mb-6 inline-block">
          &larr; Kembali ke Dashboard
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Pengaturan Akun</h1>
          <p className="text-gray-400 text-sm">Kelola informasi pribadi {role === 'penyedia' && 'dan data tokomu'} di sini.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-emerald-500 border-b border-[#2e2e2e] pb-2">Informasi Pribadi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  placeholder="Contoh: 081234567890"
                />
              </div>
            </div>
          </div>

          {role === 'penyedia' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-emerald-500 border-b border-[#2e2e2e] pb-2">Informasi Toko (Mitra)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Nama Toko</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Jam Operasional</label>
                  <input
                    type="text"
                    required
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Alamat Lengkap</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none h-20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Link Google Maps</label>
                <input
                  type="url"
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  placeholder="https://goo.gl/maps/..."
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-[#2e2e2e]">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-[#2e2e2e] hover:bg-[#3e3e3e] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}