'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // State untuk Modal Review
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedRental, setSelectedRental] = useState<any>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  
  // State tambahan untuk Edit Mode
  const [isEditing, setIsEditing] = useState(false)
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchMyRentals()
  }, [])

  async function fetchMyRentals() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/')
      return
    }

    // Ambil data sewa beserta ulasannya (TAMBAHKAN 'reply' DI SINI)
    const { data: rentalsData, error } = await supabase
      .from('rentals')
      .select(`
        id,
        start_date,
        end_date,
        total_price,
        status,
        item_id,
        items (name, image_url, stores (store_name)),
        reviews (id, rating, comment, reply) 
      `)
      .eq('tenant_id', session.user.id)
      .order('created_at', { ascending: false })

    if (rentalsData) {
      // Normalisasi Data (Menangani objek vs array dari Supabase)
      const normalizedRentals = rentalsData.map((rental: any) => ({
        ...rental,
        reviews: Array.isArray(rental.reviews) 
          ? rental.reviews 
          : (rental.reviews ? [rental.reviews] : [])
      }))
      
      setRentals(normalizedRentals)
    }
    
    if (error) console.error(error)
    setLoading(false)
  }

  const openReviewModal = (rental: any, review?: any) => {
    setSelectedRental(rental)
    if (review) {
      setRating(review.rating)
      setComment(review.comment)
      setIsEditing(true)
      setExistingReviewId(review.id)
    } else {
      setRating(5)
      setComment('')
      setIsEditing(false)
      setExistingReviewId(null)
    }
    setReviewModalOpen(true)
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRental) return
    setSubmittingReview(true)

    const { data: { session } } = await supabase.auth.getSession()

    try {
      if (isEditing && existingReviewId) {
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: rating,
            comment: comment
          })
          .eq('id', existingReviewId)
        
        if (error) throw error
        alert("Ulasan berhasil diperbarui!")
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert({
            rental_id: selectedRental.id,
            item_id: selectedRental.item_id,
            user_id: session?.user.id,
            rating: rating,
            comment: comment
          })

        if (error) throw error
        alert("Terima kasih! Ulasanmu berhasil dikirim.")
      }

      setReviewModalOpen(false)
      fetchMyRentals()
    } catch (error: any) {
      alert("Gagal memproses ulasan: " + error.message)
    } finally {
      setSubmittingReview(false)
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 border-b border-[#2e2e2e] pb-6">
          <Link href="/dashboard" className="text-emerald-500 text-sm font-medium hover:underline mb-2 inline-block">
            &larr; Kembali ke Katalog
          </Link>
          <h1 className="text-3xl font-bold text-white">Riwayat Sewa Saya</h1>
          <p className="text-gray-400 mt-1">Pantau status perlengkapan outdoor yang sedang kamu sewa.</p>
        </div>

        {rentals.length === 0 ? (
          <div className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-12 text-center">
            <p className="text-gray-500 text-lg">Kamu belum pernah menyewa alat apapun.</p>
            <Link href="/dashboard" className="text-emerald-500 hover:underline mt-2 inline-block">Mulai cari alat sekarang</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rentals.map((rental) => {
              const existingReview = Array.isArray(rental.reviews) ? rental.reviews[0] : rental.reviews;
              const isReviewed = existingReview && existingReview.id ? true : false;

              return (
                <div key={rental.id} className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-6 flex flex-col gap-4">
                  
                  {/* BAGIAN ATAS: Info Barang & Status */}
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="w-16 h-16 bg-[#0a0a0a] rounded-lg overflow-hidden border border-[#2e2e2e] shrink-0">
                        {rental.items.image_url ? (
                          <img src={rental.items.image_url} alt={rental.items.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Img</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{rental.items.name}</h3>
                        <p className="text-xs text-gray-500 mb-1">{rental.items.stores.store_name}</p>
                        <p className="text-xs text-emerald-500">
                          {formatTanggalIndo(rental.start_date)} - {formatTanggalIndo(rental.end_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                      <div className="text-left sm:text-right flex items-center sm:items-end sm:flex-col justify-between w-full sm:w-auto">
                        <p className="font-bold text-white text-lg leading-tight">{formatRupiah(rental.total_price)}</p>
                        <div className={`px-3 py-1 mt-1 rounded-full text-[10px] font-bold border uppercase text-center ${getStatusColor(rental.status)}`}>
                          {rental.status}
                        </div>
                      </div>
                      
                      {rental.status === 'selesai' && (
                        <button 
                          onClick={() => openReviewModal(rental, existingReview)}
                          className={`w-full sm:w-auto text-xs font-semibold py-2 px-4 rounded-lg transition-colors border ${
                            isReviewed 
                            ? 'bg-[#2e2e2e] border-[#3e3e3e] text-gray-300 hover:text-white hover:bg-[#3e3e3e]' 
                            : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500'
                          }`}
                        >
                          {isReviewed ? 'Edit Ulasan' : 'Beri Ulasan Alat'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BAGIAN BAWAH: Tampilan Komentar & Balasan (Muncul kalau sudah ada ulasan) */}
                  {isReviewed && (
                    <div className="pt-4 mt-2 border-t border-[#2e2e2e]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-300">Ulasanmu:</span>
                        <div className="flex text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < existingReview.rating ? "currentColor" : "none"} stroke={i < existingReview.rating ? "currentColor" : "#4b5563"} className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 italic mb-3">"{existingReview.comment}"</p>

                      {/* Tampilan Balasan dari Toko */}
                      {existingReview.reply && (
                        <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#2e2e2e] relative mt-4 ml-4">
                          {/* Segitiga kecil ala Chat Bubble */}
                          <div className="absolute -top-2 left-6 w-4 h-4 bg-[#0a0a0a] border-t border-l border-[#2e2e2e] transform rotate-45"></div>
                          
                          <p className="text-xs font-bold text-emerald-500 mb-1 relative z-10">
                            Balasan dari {rental.items.stores.store_name}:
                          </p>
                          <p className="text-sm text-gray-300 relative z-10">{existingReview.reply}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

        {/* MODAL (Bisa digunakan untuk Tambah/Edit) */}
        {reviewModalOpen && selectedRental && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#161616] border border-[#2e2e2e] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setReviewModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
              
              <h2 className="text-xl font-bold text-white mb-2">{isEditing ? 'Edit Ulasan Alat' : 'Nilai Perlengkapan'}</h2>
              <p className="text-sm text-gray-400 mb-6 border-b border-[#2e2e2e] pb-4">
                Barang: {selectedRental.items.name}
              </p>

              <form onSubmit={submitReview} className="space-y-6">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-10 h-10 ${rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}>
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Komentar Singkat</label>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Contoh: Frame tendanya masih kokoh banget..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none h-24 resize-none text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Kirim Ulasan')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}