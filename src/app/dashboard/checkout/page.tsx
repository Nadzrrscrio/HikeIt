'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // STATE UNTUK PROFILE
  const [profile, setProfile] = useState<any>(null)

  // === STATE UNTUK DUMMY PAYMENT GATEWAY ===
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('qris')

  // === STATE CHECKBOX JAMINAN IDENTITAS ===
  const [isGuaranteeChecked, setIsGuaranteeChecked] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCheckoutData()
  }, [])

  async function fetchCheckoutData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/')
      return
    }
    setUserId(session.user.id)

    // Ambil list ID cart yang dikirim dari halaman Keranjang
    const storedIdsJson = sessionStorage.getItem('checkout_cart_ids')
    if (!storedIdsJson) {
      router.push('/dashboard/cart')
      return
    }

    try {
      const ids: string[] = JSON.parse(storedIdsJson)
      if (!ids || ids.length === 0) {
        router.push('/dashboard/cart')
        return
      }
      setSelectedCartIds(ids)

      // Fetch data profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }

      // Fetch items cart yang dipilih
      const { data } = await supabase
        .from('carts')
        .select('id, item_id, quantity, items(name, description, category, price_per_day, image_url, stock, stores(store_name))')
        .in('id', ids)

      if (data && data.length > 0) {
        setCartItems(data)
      } else {
        router.push('/dashboard/cart')
        return
      }
    } catch (e) {
      router.push('/dashboard/cart')
      return
    } finally {
      setLoading(false)
    }
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
  const grandTotal = totalPricePerDay * (totalDays > 0 ? totalDays : 1)

  // TRIGGER UNTUK MEMBUKA MODAL PEMBAYARAN
  const handleOpenPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || cartItems.length === 0 || !isGuaranteeChecked || !startDate || !endDate) return
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
        total_price: (cartItem.items.price_per_day * cartItem.quantity) * (totalDays > 0 ? totalDays : 1),
        status: 'diproses'
      }))

      const { error: insertError } = await supabase.from('rentals').insert(rentalsData)
      if (insertError) throw insertError

      // Hapus hanya barang yang dicentang/dicheckout dari tabel carts
      await supabase.from('carts').delete().in('id', selectedCartIds)

      // Bersihkan session storage
      sessionStorage.removeItem('checkout_cart_ids')

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
        
        {/* Kolom Kiri: Rincian Produk & Pengisian Tanggal + Identitas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4 border-b border-[#2e2e2e] pb-6">
            <Link href="/dashboard/cart" title="Kembali ke Keranjang" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors group">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-white">Checkout Sewa</h1>
          </div>

          {/* Rincian Peralatan yang Disewa */}
          <div className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-[#2e2e2e] pb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              Peralatan yang Disewa ({cartItems.length} Jenis)
            </h2>

            <div className="divide-y divide-[#2e2e2e]">
              {cartItems.map((cart) => (
                <div key={cart.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center">
                  <div className="w-16 h-16 bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#2e2e2e] shrink-0">
                    {cart.items.image_url ? (
                      <img src={cart.items.image_url} alt={cart.items.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No Img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm sm:text-base truncate">{cart.items.name}</h3>
                    <p className="text-xs text-gray-400 mb-1">{cart.items.stores?.store_name}</p>
                    <p className="text-xs text-gray-300">
                      {cart.quantity} x <span className="text-emerald-400 font-semibold">{formatRupiah(cart.items.price_per_day)}</span>/hari
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">Subtotal/Hari</p>
                    <p className="text-emerald-400 font-bold text-sm sm:text-base">
                      {formatRupiah(cart.items.price_per_day * cart.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Jadwal Pendakian */}
          <div className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-[#2e2e2e] pb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              Atur Jadwal Pendakian
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Tanggal Ambil</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white outline-none focus:border-emerald-500 transition-colors [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:saturate-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:sepia [&::-webkit-calendar-picker-indicator]:hue-rotate-[100deg]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Tanggal Kembali</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate || new Date().toISOString().split('T')[0]} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white outline-none focus:border-emerald-500 transition-colors [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:saturate-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:sepia [&::-webkit-calendar-picker-indicator]:hue-rotate-[100deg]"
                />
              </div>
            </div>
          </div>

          {/* Form Jaminan Identitas */}
          <div className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-[#2e2e2e] pb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-amber-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm-3.75 6.75c0-1.875 1.875-3 3.75-3s3.75 1.125 3.75 3" />
              </svg>
              Jaminan Identitas
            </h2>

            <div className="bg-amber-900/10 border border-amber-500/30 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isGuaranteeChecked}
                  onChange={(e) => setIsGuaranteeChecked(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-amber-500 bg-gray-700 border-gray-600 rounded shrink-0 cursor-pointer"
                />
                <span className="text-sm text-gray-300 leading-relaxed">
                  Saya bersedia menjaminkan identitas asli (<span className="text-amber-400 font-bold">KTP / SIM / KK / KTM</span>) kepada Mitra saat pengambilan alat pendakian.
                </span>
              </label>
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Ringkasan Tagihan & Tombol Bayar */}
        <div className="lg:col-span-1">
          <div className="bg-[#161616] p-6 rounded-2xl border border-[#2e2e2e] h-fit sticky top-8 space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-[#2e2e2e] pb-3">Ringkasan Pembayaran</h2>

            <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#2e2e2e] space-y-3">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Total Alat</span>
                <span className="text-white font-medium">{cartItems.reduce((acc, item) => acc + item.quantity, 0)} Pcs</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Harga / Hari</span>
                <span className="text-white font-medium">{formatRupiah(totalPricePerDay)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Durasi Pendakian</span>
                <span className="text-emerald-400 font-semibold">{totalDays > 0 ? `${totalDays} Hari` : '-'}</span>
              </div>
              <div className="pt-3 border-t border-[#2e2e2e] flex justify-between font-bold text-white items-center">
                <span>Total Tagihan</span>
                <span className="text-emerald-400 text-xl font-extrabold">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleOpenPayment}
              disabled={!startDate || !endDate || !isGuaranteeChecked}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              Lanjutkan Pembayaran
            </button>

            {!isGuaranteeChecked && (
              <p className="text-[11px] text-amber-400 text-center font-medium">
                *Centang persetujuan jaminan identitas terlebih dahulu
              </p>
            )}
          </div>
        </div>

      </div>

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
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors text-sm font-semibold">
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
