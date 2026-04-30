'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // STATE UNTUK PROFILE
  const [profile, setProfile] = useState<any>(null)

  // STATE UNTUK MODAL DETAIL ALAT
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<any>(null)

  // === STATE UNTUK DUMMY PAYMENT GATEWAY ===
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('qris')

  // === STATE BARU: CHECKBOX JAMINAN IDENTITAS ===
  const [isGuaranteeChecked, setIsGuaranteeChecked] = useState(false)

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
    setUserId(session.user.id)

    // Fetch data profile agar tidak error saat memanggil profile.full_name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileData) {
      setProfile(profileData)
    }

    const { data } = await supabase
      .from('carts')
      .select('id, item_id, quantity, items(name, description, category, price_per_day, image_url, stock, stores(store_name))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (data) setCartItems(data)
    setLoading(false)
  }

  const handleRemove = async (cartId: string) => {
    const confirmDelete = window.confirm("Hapus barang ini dari keranjang?")
    if (!confirmDelete) return;

    setCartItems(prev => prev.filter(item => item.id !== cartId))
    await supabase.from('carts').delete().eq('id', cartId)
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

  const calculateDays = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 1
  }

  const totalDays = calculateDays()
  const totalPricePerDay = cartItems.reduce((total, cart) => total + (cart.items.price_per_day * cart.quantity), 0)
  const grandTotal = totalPricePerDay * totalDays

  // TRIGGER UNTUK MEMBUKA MODAL PEMBAYARAN
  const handleOpenPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || cartItems.length === 0) return
    setIsPaymentModalOpen(true)
  }

  // FUNGSI EKSEKUSI CHECKOUT (SIMULASI BERHASIL)
  const executePaymentSuccess = async () => {
    setCheckoutLoading(true)

    try {
      const rentalsData = cartItems.map(cartItem => ({
        tenant_id: userId,
        item_id: cartItem.item_id,
        start_date: startDate,
        end_date: endDate,
        quantity: cartItem.quantity,
        total_price: (cartItem.items.price_per_day * cartItem.quantity) * totalDays,
        status: 'diproses'
      }))

      const { error: insertError } = await supabase.from('rentals').insert(rentalsData)
      if (insertError) throw insertError

      await supabase.from('carts').delete().eq('user_id', userId)

      alert("Pembayaran berhasil diverifikasi oleh sistem!")
      setIsPaymentModalOpen(false)
      router.push('/dashboard/my-rentals')

    } catch (error: any) {
      alert("Gagal checkout: " + error.message)
    } finally {
      setCheckoutLoading(false)
    }
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-100 flex justify-center relative">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Daftar Keranjang */}
        <div className="lg:col-span-2 space-y-6">
          <Link href="/dashboard" className="text-emerald-500 text-sm font-medium hover:underline inline-block">
            Kembali ke Katalog
          </Link>
          <h1 className="text-2xl font-bold text-white">Keranjang Sewa</h1>
          
          {cartItems.length === 0 ? (
            <div className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-12 text-center">
              <p className="text-gray-500 mb-4">Keranjangmu masih kosong.</p>
              <Link href="/dashboard" className="bg-emerald-600 text-white px-6 py-2 rounded-xl">Cari Alat</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((cart) => (
                <div key={cart.id} className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="w-20 h-20 bg-[#0a0a0a] rounded-lg overflow-hidden border border-[#2e2e2e] shrink-0">
                    {cart.items.image_url ? (
                      <img src={cart.items.image_url} alt={cart.items.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No Img</div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{cart.items.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{cart.items.stores.store_name}</p>
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
                        className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                      >
                        Lihat Detail
                      </button>
                    </div>
                    
                    <button onClick={() => handleRemove(cart.id)} className="text-red-500 hover:bg-red-900/20 p-2 rounded-lg transition-colors mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ringkasan Checkout */}
        {cartItems.length > 0 && (
          <div className="bg-[#161616] p-6 rounded-2xl border border-[#2e2e2e] h-fit sticky top-24">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-[#2e2e2e] pb-2">Jadwal Pendakian</h2>
            <form onSubmit={handleOpenPayment} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Tanggal Ambil</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#2c1f1f] text-white outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Tanggal Kembali</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate || new Date().toISOString().split('T')[0]} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>

              <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#2e2e2e] space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Durasi Sewa</span>
                  <span>{totalDays} Hari</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Total Item</span>
                  <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)} Pcs</span>
                </div>
                <div className="pt-2 border-t border-[#2e2e2e] flex justify-between font-bold text-white items-center mt-2">
                  <span>Grand Total</span>
                  <span className="text-emerald-400 text-lg">{formatRupiah(grandTotal)}</span>
                </div>
              </div>

              {/* CHECKBOX JAMINAN IDENTITAS */}
              <div className="bg-amber-900/10 border border-amber-500/30 rounded-xl p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isGuaranteeChecked}
                    onChange={(e) => setIsGuaranteeChecked(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-amber-500 bg-gray-700 border-gray-600 rounded shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-300 leading-relaxed">
                    Saya bersedia menjaminkan identitas asli (<span className="text-amber-400 font-bold">KTP / SIM / KK / KTM</span>) kepada Mitra saat pengambilan alat.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!startDate || !endDate || !isGuaranteeChecked}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lanjutkan Pembayaran
              </button>
            </form>
          </div>
        )}

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

      {/* ================= MODAL DUMMY PAYMENT GATEWAY ================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 text-gray-900">
            
            {/* Payment Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Payment Gateway</p>
                <p className="font-bold text-gray-800">HikeIt Secure Pay</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                Batal
              </button>
            </div>

            {/* Payment Body */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">Total Tagihan</p>
                <p className="text-3xl font-extrabold text-gray-900">{formatRupiah(grandTotal)}</p>
                <p className="text-xs text-red-500 mt-2 font-medium">Bayar sebelum batas waktu berakhir</p>
              </div>

              {/* Tabs Mode Pembayaran */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-6">
                <button 
                  onClick={() => setPaymentMethod('qris')}
                  className={`flex-1 py-2 text-sm font-bold transition-colors ${paymentMethod === 'qris' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  QRIS
                </button>
                <button 
                  onClick={() => setPaymentMethod('va')}
                  className={`flex-1 py-2 text-sm font-bold transition-colors ${paymentMethod === 'va' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  Virtual Account
                </button>
              </div>

              {/* Mencegah lompatan ukuran card dengan memberikan min-height tetap */}
              <div className="min-h-[250px] flex flex-col justify-center">
                {/* Tampilan QRIS */}
                {paymentMethod === 'qris' && (
                  <div className="flex flex-col items-center">
                    <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
                      <div className="grid grid-cols-4 grid-rows-4 gap-1 w-32 h-32 opacity-20">
                        {[...Array(16)].map((_, i) => (
                          <div key={i} className={`bg-black ${i % 2 === 0 ? 'rounded-tl-lg' : ''} ${i % 3 === 0 ? 'rounded-br-lg' : ''}`}></div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white px-2 py-1 rounded text-xs font-bold border border-gray-200 shadow-sm">GOPAY / OVO / DANA</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">Scan QR Code di atas menggunakan aplikasi e-Wallet atau Mobile Banking Anda.</p>
                  </div>
                )}

                {/* Tampilan Virtual Account */}
                {paymentMethod === 'va' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 border border-gray-200 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">BCA Virtual Account</p>
                      <div className="flex justify-between items-center">
                        <p className="text-xl font-mono font-bold text-gray-900 tracking-wider">8077 1234 5678</p>
                        <button className="text-blue-600 text-sm font-bold hover:text-blue-800">Salin</button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">Pastikan nama penerima adalah <span className="font-bold">HikeIt - {profile?.full_name || 'Pendaki'}</span></p>
                  </div>
                )}
              </div>

            </div>

            {/* Payment Footer - Dummy Simulator Button */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <button 
                onClick={executePaymentSuccess}
                disabled={checkoutLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                {checkoutLoading ? 'Memverifikasi...' : 'Simulasikan Pembayaran Berhasil'}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-3 font-medium">
                *Tombol ini khusus untuk keperluan simulasi demonstrasi aplikasi.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}