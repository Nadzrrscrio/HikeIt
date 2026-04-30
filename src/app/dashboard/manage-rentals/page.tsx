'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ManageRentalsPage() {
  const [rentals, setRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchRentals()
  }, [])

  async function fetchRentals() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/')
      return
    }

    const { data: storeData } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', session.user.id)
      .single()

    if (storeData) {
      const { data: rentalsData, error } = await supabase
        .from('rentals')
        .select(`
          id,
          start_date,
          end_date,
          total_price,
          status,
          profiles:tenant_id (full_name, phone_number),
          items!inner (name, image_url, store_id)
        `)
        .eq('items.store_id', storeData.id)
        .order('created_at', { ascending: false })

      if (rentalsData) setRentals(rentalsData)
      if (error) console.error(error)
    }
    setLoading(false)
  }

  const handleUpdateStatus = async (rentalId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('rentals')
        .update({ status: newStatus })
        .eq('id', rentalId)

      if (error) throw error
      
      fetchRentals()
    } catch (error: any) {
      alert("Gagal update status: " + error.message)
    }
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka)
  }

  const formatTanggalIndo = (tanggal: string) => {
    if (!tanggal) return '';
    const [year, month, day] = tanggal.split('-');
    return `${day}/${month}/${year}`;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'diproses': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'
      case 'dikirim': return 'bg-blue-500/20 text-blue-500 border-blue-500/50' 
      case 'digunakan': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50'
      case 'selesai': return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      case 'dibatalkan': return 'bg-red-500/20 text-red-500 border-red-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
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
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between border-b border-[#2e2e2e] pb-6">
          <div>
            <Link href="/dashboard" className="text-emerald-500 text-sm font-medium hover:underline mb-2 inline-block">
              &larr; Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Kelola Tracking Sewa</h1>
            <p className="text-gray-400 mt-1">Pantau pesanan masuk dan perbarui status penyewaan alatmu.</p>
          </div>
        </div>

        {rentals.length === 0 ? (
          <div className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-12 text-center">
            <p className="text-gray-500 text-lg">Belum ada pesanan yang masuk ke tokomu.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rentals.map((rental) => (
              <div key={rental.id} className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                
                {/* Info Barang & Penyewa */}
                <div className="flex gap-4 flex-1">
                  <div className="w-20 h-20 bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#2e2e2e] shrink-0">
                    {rental.items.image_url ? (
                      <img src={rental.items.image_url} alt={rental.items.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No Img</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{rental.items.name}</h3>
                    <p className="text-sm text-gray-400 mb-1">
                      Penyewa: <span className="text-gray-200">{rental.profiles.full_name}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Jadwal: <span className="text-emerald-400">{formatTanggalIndo(rental.start_date)} s/d {formatTanggalIndo(rental.end_date)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 text-left md:text-right">
                  <p className="text-sm text-gray-400 mb-1">Total Biaya</p>
                  <p className="text-xl font-bold text-white mb-2">{formatRupiah(rental.total_price)}</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(rental.status)}`}>
                    {rental.status === 'dikirim' ? 'DIAMBIL' : rental.status.toUpperCase()}
                  </div>
                </div>

                {/* Dropdown Update Status */}
                <div className="w-full md:w-48 shrink-0 border-t md:border-t-0 md:border-l border-[#2e2e2e] pt-4 md:pt-0 md:pl-6">
                  <label className="block text-xs font-medium text-gray-400 mb-2">Update Status</label>
                  <select
                    value={rental.status}
                    onChange={(e) => handleUpdateStatus(rental.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none text-sm cursor-pointer appearance-none"
                  >
                    <option value="diproses">Diproses</option>
                    <option value="dikirim">Diambil</option>
                    <option value="digunakan">Sedang Digunakan</option>
                    <option value="selesai">Selesai (Kembali)</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}