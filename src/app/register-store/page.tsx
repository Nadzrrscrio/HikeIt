'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MapSelector = dynamic(() => import('@/components/MapSelector'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-[#161616] animate-pulse rounded-xl flex items-center justify-center text-gray-500">Memuat Peta...</div>
})

export default function RegisterStorePage() {
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [operationalHours, setOperationalHours] = useState('')
  const [mapsLink, setMapsLink] = useState('')
  
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Silakan login terlebih dahulu")

      const { error: storeError } = await supabase
        .from('stores')
        .insert([
          {
            owner_id: session.user.id,
            store_name: storeName,
            address: address,
            operational_hours: operationalHours,
            maps_link: mapsLink,
            latitude: latitude,   
            longitude: longitude, 
          }
        ])

      if (storeError) throw storeError

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'penyedia' })
        .eq('id', session.user.id)

      if (profileError) throw profileError

      alert("Toko berhasil didaftarkan! Selamat datang sebagai Mitra HikeIt.")
      router.push('/dashboard')
      
    } catch (error: any) {
      alert(error.message || "Terjadi kesalahan saat mendaftar toko.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 py-12">
      <div className="bg-[#161616] p-8 rounded-2xl border border-[#2e2e2e] w-full max-w-2xl shadow-2xl">
        <div className="mb-6 border-b border-[#2e2e2e] pb-6">
          <Link href="/dashboard" className="text-emerald-500 text-sm font-medium hover:underline mb-4 inline-block">
            &larr; Kembali
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Buka Rental Pertamamu</h1>
          <p className="text-gray-400">Bergabung jadi Mitra HikeIt dan mulai sewakan peralatan outdoormu ke ribuan pendaki.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nama Toko / Rental</label>
              <input 
                type="text" 
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Contoh: Semeru Outdoor Rent"
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Jam Operasional</label>
              <input 
                type="text" 
                required
                value={operationalHours}
                onChange={(e) => setOperationalHours(e.target.value)}
                placeholder="08:00 - 20:00"
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Alamat Lengkap</label>
            <textarea 
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Panglima Sudirman No.12, Malang..."
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none h-20 resize-none"
            />
          </div>

          <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#2e2e2e]">
            <div className="flex justify-between items-end mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Pin Lokasi Peta (Wajib)</label>
                <p className="text-xs text-gray-500">Klik pada peta untuk menaruh pin lokasi pasti tokomu secara manual.</p>
              </div>
            </div>
            
            <MapSelector 
              onLocationChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }} 
            />
            
            {latitude && longitude ? (
              <div className="mt-3 text-emerald-500 text-xs font-medium text-center bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                ✅ Titik tersimpan! (Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)})
              </div>
            ) : (
              <div className="mt-3 text-yellow-500 text-xs font-medium text-center bg-yellow-500/10 py-2 rounded-lg border border-yellow-500/20">
                ⚠️ Silakan klik lokasi di peta.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Link Google Maps (Opsional)</label>
            <input 
              type="url" 
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={loading || !latitude || !longitude} 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </button>
            {!latitude && !longitude && (
               <p className="text-xs text-red-400 text-center">* Wajib menitikkan pin di peta sebelum mendaftar.</p>
            )}
            <Link href="/dashboard" className="w-full bg-[#2e2e2e] hover:bg-[#3e3e3e] text-center text-white font-medium py-3 rounded-xl transition-colors">
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}