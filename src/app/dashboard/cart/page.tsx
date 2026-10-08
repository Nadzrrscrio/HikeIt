'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // STATE UNTUK MODAL DETAIL ALAT
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<any>(null)

  // STATE UNTUK MODAL KONFIRMASI HAPUS
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [cartIdToDelete, setCartIdToDelete] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCart()
  }, [])

  async function fetchCart() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/')
      return
    }
    const currentUserId = session.user.id
    setUserId(currentUserId)

    const { data } = await supabase
      .from('carts')
      .select('id, item_id, quantity, items(name, description, category, price_per_day, image_url, stock, stores(store_name))')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: true })

    if (data) {
      setCartItems(data)
      
      // Ambil daftar yang pernah dicentang dari localStorage
      const storageKey = `selected_cart_ids_${currentUserId}`
      const savedSelected = localStorage.getItem(storageKey)

      if (savedSelected) {
        try {
          const parsed: string[] = JSON.parse(savedSelected)
          // Validasi agar hanya ID yang masih ada di keranjang yang disimpan
          const validIds = parsed.filter(id => data.some((item: any) => item.id === id))
          
          // Cek apakah ada barang baru yang baru ditambahkan (belum ada catatan di localStorage)
          // Jika tidak ada di saved, kita tambahkan barang baru tersebut ke list centang
          const allSavedKnownKey = `all_known_cart_ids_${currentUserId}`
          const knownIds: string[] = JSON.parse(localStorage.getItem(allSavedKnownKey) || '[]')
          
          const newCartItemIds = data.filter((item: any) => !knownIds.includes(item.id)).map((item: any) => item.id)
          const finalSelectedIds = Array.from(new Set([...validIds, ...newCartItemIds]))

          setSelectedCartIds(finalSelectedIds)
          localStorage.setItem(storageKey, JSON.stringify(finalSelectedIds))
          localStorage.setItem(allSavedKnownKey, JSON.stringify(data.map((item: any) => item.id)))
        } catch (e) {
          const initialIds = data.map((item: any) => item.id)
          setSelectedCartIds(initialIds)
          localStorage.setItem(storageKey, JSON.stringify(initialIds))
        }
      } else {
        // Jika belum pernah diset, centang semua barang secara default
        const initialIds = data.map((item: any) => item.id)
        setSelectedCartIds(initialIds)
        localStorage.setItem(storageKey, JSON.stringify(initialIds))
        localStorage.setItem(`all_known_cart_ids_${currentUserId}`, JSON.stringify(initialIds))
      }
    }
    setLoading(false)
  }

  const handleToggleSelectAll = () => {
    let next: string[] = []
    if (selectedCartIds.length === cartItems.length) {
      next = []
    } else {
      next = cartItems.map(item => item.id)
    }
    setSelectedCartIds(next)
    if (userId) {
      localStorage.setItem(`selected_cart_ids_${userId}`, JSON.stringify(next))
    }
  }

  const handleToggleSelectItem = (id: string) => {
    setSelectedCartIds(prev => {
      const next = prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
      if (userId) {
        localStorage.setItem(`selected_cart_ids_${userId}`, JSON.stringify(next))
      }
      return next
    })
  }

  const handleRemove = (cartId: string) => {
    setCartIdToDelete(cartId)
    setIsDeleteModalOpen(true)
  }

  const confirmRemove = async () => {
    if (!cartIdToDelete) return
    setCartItems(prev => prev.filter(item => item.id !== cartIdToDelete))
    setSelectedCartIds(prev => {
      const next = prev.filter(id => id !== cartIdToDelete)
      if (userId) {
        localStorage.setItem(`selected_cart_ids_${userId}`, JSON.stringify(next))
      }
      return next
    })
    await supabase.from('carts').delete().eq('id', cartIdToDelete)
    setIsDeleteModalOpen(false)
    setCartIdToDelete(null)
  }

  const handleUpdateQuantity = async (cartId: string, currentQty: number, change: number, maxStock: number) => {
    const newQty = currentQty + change
    if (newQty < 1 || newQty > maxStock) return 

    setCartItems(prev => prev.map(item => item.id === cartId ? { ...item, quantity: newQty } : item))

    await supabase.from('carts').update({ quantity: newQty }).eq('id', cartId)
  }

  const openDetailModal = (itemData: any) => {
    setSelectedDetail(itemData)
    setIsDetailModalOpen(true)
  }

  // Hitung total harga barang yang dicentang (default hitungan 1 hari)
  const selectedItems = cartItems.filter(item => selectedCartIds.includes(item.id))
  const totalPriceDefault1Day = selectedItems.reduce(
    (total, cart) => total + (cart.items.price_per_day * cart.quantity), 
    0
  )

  const handleProceedToCheckout = () => {
    if (selectedCartIds.length === 0) return
    sessionStorage.setItem('checkout_cart_ids', JSON.stringify(selectedCartIds))
    router.push('/dashboard/checkout')
  }

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

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 border-b border-[#2e2e2e] pb-6 flex items-center gap-4">
            <Link href="/dashboard" title="Kembali" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors group">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-white">Keranjang Sewa</h1>
          </div>
          <div className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-12 text-center flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-600 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <p className="text-gray-400 text-lg font-semibold mb-2">Keranjangmu masih kosong</p>
            <p className="text-gray-600 text-sm mb-6">Yuk, cari peralatan outdoor yang kamu butuhkan!</p>
            <Link href="/dashboard" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-semibold transition-colors">Cari Alat Sekarang</Link>
          </div>
        </div>
      </div>
    )
  }

  const isAllSelected = cartItems.length > 0 && selectedCartIds.length === cartItems.length

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-100 flex justify-center relative pb-32">
      <div className="max-w-4xl w-full space-y-6">
        
        {/* Header Page */}
        <div className="flex items-center gap-4 border-b border-[#2e2e2e] pb-6">
          <Link href="/dashboard" title="Kembali" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-white">Keranjang Sewa</h1>
        </div>

        {/* Daftar Keranjang */}
        <div className="space-y-4">
          {cartItems.map((cart) => {
            const isSelected = selectedCartIds.includes(cart.id)

            return (
              <div 
                key={cart.id} 
                className={`bg-[#161616] rounded-2xl border p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-all ${
                  isSelected ? 'border-emerald-500/50 bg-[#161616]' : 'border-[#2e2e2e] opacity-75'
                }`}
              >
                {/* Checkbox item */}
                <div className="flex items-center self-center shrink-0">
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelectItem(cart.id)}
                    className="w-5 h-5 rounded accent-emerald-500 cursor-pointer bg-[#0a0a0a] border-[#2e2e2e]"
                  />
                </div>

                <div className="w-20 h-20 bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#2e2e2e] shrink-0">
                  {cart.items.image_url ? (
                    <img src={cart.items.image_url} alt={cart.items.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No Img</div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-white text-base">{cart.items.name}</h3>
                  <p className="text-xs text-gray-400 mb-2">{cart.items.stores?.store_name}</p>
                  <p className="text-emerald-400 font-bold">{formatRupiah(cart.items.price_per_day)}<span className="text-xs text-gray-500 font-normal"> /hari</span></p>
                </div>

                <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center bg-[#0a0a0a] rounded-lg border border-[#2e2e2e] overflow-hidden">
                      <button 
                        onClick={() => handleUpdateQuantity(cart.id, cart.quantity, -1, cart.items.stock)}
                        className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#2e2e2e] transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-white">{cart.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(cart.id, cart.quantity, 1, cart.items.stock)}
                        className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#2e2e2e] transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => openDetailModal(cart.items)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      Lihat Detail
                    </button>
                  </div>
                  
                  <button onClick={() => handleRemove(cart.id)} className="text-red-500 hover:bg-red-900/20 p-2 rounded-lg transition-colors mt-0.5" title="Hapus dari keranjang">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* STICKY BOTTOM BAR (Shopee / TikTok Shop Pattern) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#161616]/95 backdrop-blur-md border-t border-[#2e2e2e] p-4 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="w-5 h-5 rounded accent-emerald-500 cursor-pointer bg-[#0a0a0a] border-[#2e2e2e]"
              />
              <span className="text-sm font-semibold text-gray-300">Pilih Semua</span>
            </label>
            <div>
              <p className="text-xs text-gray-400">
                Total Ringkasan ({selectedCartIds.length} Alat) <span className="text-[10px] text-emerald-400 font-semibold">(Est. 1 Hari)</span>
              </p>
              <p className="text-emerald-400 font-bold text-xl sm:text-2xl">
                {formatRupiah(totalPriceDefault1Day)}
              </p>
            </div>
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={selectedCartIds.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 sm:px-10 rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-sm sm:text-base flex items-center gap-2"
          >
            <span>Sewa Sekarang</span>
            {selectedCartIds.length > 0 && (
              <span className="bg-emerald-700 text-white text-xs px-2 py-0.5 rounded-full font-extrabold">
                {selectedCartIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= MODAL DETAIL ALAT ================= */}
      {isDetailModalOpen && selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#2e2e2e] rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full hover:bg-black transition-colors z-10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
            <div className="h-56 bg-[#0a0a0a] relative shrink-0">
              {selectedDetail.image_url ? (
                <img src={selectedDetail.image_url} alt={selectedDetail.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
              )}
              {selectedDetail.category && (
                <div className="absolute bottom-3 left-3 bg-[#0a0a0a]/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-[#2e2e2e]">
                  <p className="text-xs font-bold text-amber-500">{selectedDetail.category}</p>
                </div>
              )}
            </div>
            <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3e3e3e] [&::-webkit-scrollbar-thumb]:rounded-full">
              <h2 className="text-2xl font-bold text-white mb-1">{selectedDetail.name}</h2>
              <p className="text-sm text-emerald-500 font-medium mb-6">Mitra: {selectedDetail.stores?.store_name}</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#0a0a0a] p-4 rounded-xl border border-[#2e2e2e]">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Harga Sewa</p>
                    <p className="text-lg font-bold text-emerald-400">{formatRupiah(selectedDetail.price_per_day)}<span className="text-xs text-gray-500 font-normal">/hari</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">Sisa Stok</p>
                    <p className="text-lg font-bold text-white">{selectedDetail.stock} pcs</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    Deskripsi Alat
                  </p>
                  <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#2e2e2e]">
                    <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {selectedDetail.description || 'Penyedia tidak mencantumkan deskripsi untuk alat ini.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS BARANG ================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#2e2e2e] rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hapus Barang?</h3>
            <p className="text-sm text-gray-400 mb-6">Barang ini akan dihapus dari keranjang sewamu. Tindakan ini tidak bisa dibatalkan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setCartIdToDelete(null) }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}