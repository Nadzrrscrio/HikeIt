'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  
  const [store, setStore] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchStoreData() {
      const { data: storeData } = await supabase
        .from('stores')
        .select('*, profiles(full_name, phone_number)')
        .eq('id', resolvedParams.id)
        .single()

      if (storeData) setStore(storeData)

      const { data: itemsData } = await supabase
        .from('items')
        .select('*')
        .eq('store_id', resolvedParams.id)
        .order('created_at', { ascending: false })

      if (itemsData) setItems(itemsData)

      const itemIds = itemsData?.map(i => i.id) || [];
      if (itemIds.length > 0) {
        // Tanda bintang (*) otomatis memanggil kolom 'reply' juga
        const { data: reviewsData, error: reviewError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles(full_name),
            items(name)
          `)
          .in('item_id', itemIds) 
          .order('created_at', { ascending: false });

        if (reviewsData) setReviews(reviewsData);
        if (reviewError) console.error("Review Error:", reviewError);
      }
      
      setLoading(false)
    }

    fetchStoreData()
  }, [resolvedParams.id, supabase])

  // === FUNGSI TAMBAH KE KERANJANG ===
  const handleAddToCart = async (itemId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert("Silakan login terlebih dahulu.")
      return
    }
    
    const { data: existingCart } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('item_id', itemId)
      .single()

    if (existingCart) {
      const { error } = await supabase
        .from('carts')
        .update({ quantity: existingCart.quantity + 1 })
        .eq('id', existingCart.id)
        
      if (!error) alert("Jumlah barang di keranjang berhasil ditambahkan!")
    } else {
      const { error } = await supabase
        .from('carts')
        .insert({ user_id: session.user.id, item_id: itemId, quantity: 1 })

      if (!error) alert("Barang ditambahkan ke keranjang!")
    }
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "0"

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka)
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
      <div className="max-w-7xl mx-auto">
        
        <Link href="/dashboard" className="text-emerald-500 text-sm font-medium hover:underline mb-6 inline-block">
          &larr; Kembali ke Katalog Utama
        </Link>

        <div className="bg-[#161616] rounded-2xl p-8 border border-[#2e2e2e] shadow-xl mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{store.store_name}</h1>
                <div className="bg-yellow-500/10 border border-yellow-500/50 px-2 py-1 rounded-lg flex items-center gap-1">
                  <span className="text-yellow-500 text-sm font-bold">⭐ {averageRating}</span>
                  <span className="text-gray-500 text-xs">({reviews.length})</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">Pemilik: {store.profiles?.full_name}</p>
            </div>
            
            <div className="flex gap-3">
              {store.maps_link && (
                <a 
                  href={store.maps_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#2e2e2e] hover:bg-[#3e3e3e] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-[#3e3e3e]"
                >
                  Maps
                </a>
              )}
              {/* Tombol WhatsApp */}
              <a 
                href={`https://wa.me/${store.profiles?.phone_number}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223ZM8.25 10.875a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25ZM10.875 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z" clipRule="evenodd" />
                </svg>
                Chat
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-[#2e2e2e]">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Alamat</p>
              <p className="text-gray-300 text-sm leading-relaxed">{store.address}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Operasional</p>
              <p className="text-emerald-400 font-medium text-sm">{store.operational_hours}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-6">Daftar Alat ({items.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {items.map((item) => (
                <div key={item.id} className="bg-[#161616] rounded-2xl border border-[#2e2e2e] overflow-hidden hover:border-emerald-500/50 transition-colors group">
                  <div className="h-44 bg-[#0a0a0a] overflow-hidden relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No Image</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="text-lg font-bold text-white mb-1 line-clamp-1">{item.name}</h4>
                    <p className="text-emerald-400 font-bold mb-4">{formatRupiah(item.price_per_day)}<span className="text-xs text-gray-500"> /hari</span></p>
                    {/* PERBAIKAN: Gunakan button dan panggil handleAddToCart */}
                    <button 
                      onClick={() => handleAddToCart(item.id)}
                      disabled={item.stock === 0}
                      className="w-full block text-center bg-[#2e2e2e] hover:bg-emerald-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {item.stock === 0 ? 'Habis' : 'Tambah Keranjang'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-6">Ulasan Pendaki</h2>
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-gray-500 italic text-sm">Belum ada ulasan untuk toko ini.</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="bg-[#161616] p-4 rounded-xl border border-[#2e2e2e]">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold text-white">{rev.profiles?.full_name}</p>
                      <div className="flex text-yellow-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <span key={i} className="text-xs">⭐</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-500 mb-2 uppercase font-medium">Sewa: {rev.items?.name}</p>
                    <p className="text-sm text-gray-400 italic leading-relaxed">"{rev.comment}"</p>

                    {/* === TAMBAHAN: TAMPILAN BALASAN TOKO === */}
                    {rev.reply && (
                      <div className="mt-3 ml-3 relative bg-[#0a0a0a] border border-[#2e2e2e] p-3 rounded-xl">
                        <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#0a0a0a] border-t border-l border-[#2e2e2e] transform rotate-45"></div>
                        <p className="text-[10px] font-bold text-emerald-500 mb-0.5 relative z-10 uppercase tracking-wider">Balasan Toko</p>
                        <p className="text-xs text-gray-400 relative z-10 leading-relaxed">{rev.reply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
