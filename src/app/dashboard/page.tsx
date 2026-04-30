'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { calculateDistance } from '@/utils/distance'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [cartCount, setCartCount] = useState(0)

  // === STATE UNTUK STATISTIK MITRA ===
  const [activeRentalsCount, setActiveRentalsCount] = useState(0)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)

  // === STATE UNTUK FITUR GPS ===
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [useLocationFilter, setUseLocationFilter] = useState(false)

  // === STATE UNTUK FITUR EDIT ALAT ===
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('Tenda')
  const [editPrice, setEditPrice] = useState(0)
  const [editStock, setEditStock] = useState(0)
  const [isUpdatingItem, setIsUpdatingItem] = useState(false)

  // === STATE BARU: BALAS ULASAN ===
  const [storeReviews, setStoreReviews] = useState<any[]>([])
  const [replyModalOpen, setReplyModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  // === STATE BARU: PAKET BUNDLING ===
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false)
  const [bundleName, setBundleName] = useState('')
  const [bundleStock, setBundleStock] = useState(1)
  const [selectedBundleItems, setSelectedBundleItems] = useState<any[]>([])
  const [isSubmittingBundle, setIsSubmittingBundle] = useState(false)
  const [bundleImageFile, setBundleImageFile] = useState<File | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/')
        return
      }

      // 1. Ambil data Profile
      let currentProfile = null;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profileData) {
        const fallbackName = session.user.user_metadata?.full_name || 'Pendaki'
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: session.user.id, full_name: fallbackName, role: 'penyewa' })
          .select().single()
        currentProfile = newProfile
      } else {
        currentProfile = profileData
      }
      
      setProfile(currentProfile)

      // Fetch Cart Count
      const { count } = await supabase
        .from('carts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
      
      if (count !== null) setCartCount(count)

      // 2. Ambil data Barang (Items) berdasarkan Role
      if (currentProfile?.role === 'penyedia') {
        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', session.user.id)
          .single()

        if (storeData) {
          // Ambil daftar barang milik toko
          const { data: myItems } = await supabase
            .from('items')
            .select('*')
            .eq('store_id', storeData.id)
            .order('created_at', { ascending: false })
          
          if (myItems) setItems(myItems)

          // === HITUNG STATISTIK TOKO (Sewa Aktif & Pendapatan) ===
          const { data: myRentals } = await supabase
            .from('rentals')
            .select('total_price, status, created_at, items!inner(store_id)')
            .eq('items.store_id', storeData.id)

          if (myRentals) {
            const active = myRentals.filter(r => r.status === 'diproses').length
            setActiveRentalsCount(active)

            const currentMonth = new Date().getMonth()
            const currentYear = new Date().getFullYear()
            
            const revenue = myRentals
              .filter(r => {
                const rentalDate = new Date(r.created_at)
                return (
                  rentalDate.getMonth() === currentMonth && 
                  rentalDate.getFullYear() === currentYear && 
                  r.status === 'selesai'
                )
              })
              .reduce((sum, r) => sum + r.total_price, 0)

            setMonthlyRevenue(revenue)
          }

          // === FETCH ULASAN UNTUK TOKO INI ===
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select(`
              id, rating, comment, reply, created_at,
              profiles:user_id (full_name),
              items!inner (name, store_id)
            `)
            .eq('items.store_id', storeData.id)
            .order('created_at', { ascending: false })
            .limit(10) // Ambil 10 ulasan terbaru
            
          if (reviewsData) setStoreReviews(reviewsData)
        }
      } else {
        const { data: allItems } = await supabase
          .from('items')
          .select(`
            *,
            stores ( store_name, latitude, longitude )
          `)
          .order('created_at', { ascending: false })
        
        if (allItems) setItems(allItems)
      }
      
      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAddToCart = async (itemId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert("Sesi habis, silakan login ulang.")
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
      else alert("Gagal update keranjang.")
    } else {
      const { error } = await supabase
        .from('carts')
        .insert({ user_id: session.user.id, item_id: itemId, quantity: 1 })

      if (!error) {
        setCartCount(prev => prev + 1)
        alert("Barang ditambahkan ke keranjang!")
      } else {
        alert("Gagal menambahkan barang.")
      }
    }
  }

  const handleGetLocation = () => {
    setIsLocating(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError("Browser kamu tidak mendukung akses GPS.")
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setUseLocationFilter(true)
        setIsLocating(false)
      },
      (error) => {
        setLocationError("Gagal mendapatkan lokasi. Pastikan izin lokasi aktif di browsermu.")
        setIsLocating(false)
      }
    )
  }

  const openEditModal = (item: any) => {
    setSelectedItem(item)
    setEditName(item.name || '')
    setEditCategory(item.category || 'Tenda')
    setEditPrice(item.price_per_day || 0)
    setEditStock(item.stock || 0)
    setIsEditModalOpen(true)
  }

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    setIsUpdatingItem(true)

    try {
      const { error } = await supabase
        .from('items')
        .update({
          name: editName,
          category: editCategory,
          price_per_day: editPrice,
          stock: editStock
        })
        .eq('id', selectedItem.id)

      if (error) throw error

      alert("Data alat berhasil diperbarui!")
      setIsEditModalOpen(false)
      
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === selectedItem.id 
            ? { ...item, name: editName, category: editCategory, price_per_day: editPrice, stock: editStock }
            : item
        )
      )
    } catch (error: any) {
      alert("Gagal memperbarui data: " + error.message)
    } finally {
      setIsUpdatingItem(false)
    }
  }

  // === FUNGSI HAPUS ALAT ===
  const handleDeleteItem = async (itemId: string, itemName: string) => {
    // Tampilkan konfirmasi keamanan agar tidak tidak sengaja terhapus
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus "${itemName}" dari katalog?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      alert("Alat berhasil dihapus!");
      
      // Update state lokal agar baris di tabel langsung hilang tanpa perlu refresh
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error: any) {
      alert("Gagal menghapus alat. Pastikan alat ini tidak sedang dalam transaksi aktif. Error: " + error.message);
    }
  }

  // === FUNGSI KIRIM BALASAN ULASAN ===
  const handleReplyReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReview) return
    setIsSubmittingReply(true)

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ reply: replyText })
        .eq('id', selectedReview.id)

      if (error) throw error

      alert("Balasan berhasil dikirim!")
      setReplyModalOpen(false)
      
      // Update data di state lokal agar muncul langsung tanpa refresh
      setStoreReviews(prev => prev.map(r => 
        r.id === selectedReview.id ? { ...r, reply: replyText } : r
      ))
    } catch (error: any) {
      alert("Gagal mengirim balasan: " + error.message)
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const openReplyModal = (review: any) => {
    setSelectedReview(review)
    setReplyText(review.reply || '')
    setReplyModalOpen(true)
  }

  // === FUNGSI LOGIKA PAKET BUNDLING ===
  const toggleBundleItem = (item: any) => {
    if (selectedBundleItems.find(i => i.id === item.id)) {
      setSelectedBundleItems(selectedBundleItems.filter(i => i.id !== item.id))
    } else {
      setSelectedBundleItems([...selectedBundleItems, { ...item, bundleQuantity: 1 }])
    }
  }

  const updateBundleItemQuantity = (itemId: string, qty: number) => {
    if (qty < 1) return;
    setSelectedBundleItems(prev => prev.map(i => i.id === itemId ? { ...i, bundleQuantity: qty } : i))
  }

  const bundleOriginalPrice = selectedBundleItems.reduce((sum, item) => sum + (item.price_per_day * item.bundleQuantity), 0)
  const bundleDiscountPrice = bundleOriginalPrice * 0.95 

  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedBundleItems.length < 2) {
      alert("Pilih minimal 2 alat untuk dijadikan satu paket bundling!")
      return
    }

    setIsSubmittingBundle(true)
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', profile.id)
        .single()

      if (!storeData) {
        alert("Data toko tidak ditemukan.")
        setIsSubmittingBundle(false)
        return
      }

      // Proses upload gambar jika user memilih file
      let imageUrl = null;
      if (bundleImageFile) {
        const fileExt = bundleImageFile.name.split('.').pop();
        const fileName = `bundle-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // PENTING: Ganti 'items' dengan nama bucket Storage milikmu di Supabase jika berbeda
        const { error: uploadError } = await supabase.storage
          .from('items') 
          .upload(fileName, bundleImageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('items')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrlData.publicUrl;
      }

      const isiPaket = selectedBundleItems.map(i => i.bundleQuantity > 1 ? `${i.bundleQuantity}x ${i.name}` : i.name).join(' + ')
      const finalBundleName = `${bundleName} (${isiPaket})`

      const { data: newBundle, error } = await supabase
        .from('items')
        .insert({
          store_id: storeData.id,
          name: finalBundleName,
          category: 'Paket Bundling',
          price_per_day: bundleDiscountPrice,
          stock: bundleStock,
          image_url: imageUrl, // Masukkan URL gambar ke database
        })
        .select()
        .single()

      if (error) throw error

      alert("Paket Bundling berhasil dibuat!")
      if (newBundle) setItems([newBundle, ...items])
      
      // Reset semua state modal
      setIsBundleModalOpen(false)
      setBundleName('')
      setSelectedBundleItems([])
      setBundleStock(1)
      setBundleImageFile(null) // Reset gambar
    } catch (error: any) {
      alert("Gagal membuat paket bundling: " + error.message)
    } finally {
      setIsSubmittingBundle(false)
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

  const initial = profile?.full_name?.charAt(0).toUpperCase() || 'P'
  
  // Penambahan kategori Paket Bundling
  const categories = ['Semua', 'Paket Bundling', 'Tenda', 'Carrier', 'Sepatu', 'Jaket', 'Alat Masak', 'Sleeping Bag', 'Aksesoris']

  const filteredItems = items.map(item => {
    let distance = null; 
    if (useLocationFilter && userLocation && item.stores?.latitude && item.stores?.longitude) {
      distance = calculateDistance(userLocation.lat, userLocation.lng, item.stores.latitude, item.stores.longitude);
    }
    return { ...item, distance };
  }).filter(item => {
    const matchName = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory
    const matchLocation = useLocationFilter ? (item.distance !== null && item.distance <= 10) : true;
    return matchName && matchCategory && matchLocation
  }).sort((a, b) => {
    if (useLocationFilter && a.distance !== null && b.distance !== null) {
       return a.distance - b.distance;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans relative">
      <nav className="bg-[#161616] border-b border-[#2e2e2e] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex-shrink-0 font-bold text-2xl text-emerald-500 tracking-tight">
              HikeIt.
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              
              {profile?.role === 'penyewa' && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link href="/dashboard/checklist" title="Checklist Alat" className="p-2 text-gray-400 hover:text-white hover:bg-[#2e2e2e] rounded-xl transition-all flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                    </svg>
                  </Link>
                  <Link href="/dashboard/my-rentals" title="Pesanan Saya" className="p-2 text-gray-400 hover:text-white hover:bg-[#2e2e2e] rounded-xl transition-all flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
                    </svg>
                  </Link>
                  <Link href="/dashboard/cart" title="Keranjang" className="relative p-2 text-gray-400 hover:text-white hover:bg-[#2e2e2e] rounded-xl transition-all flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#161616]">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}
              
              <div className="h-6 w-[1px] bg-[#2e2e2e] mx-1"></div>

              <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 focus:outline-none hover:bg-[#2e2e2e] p-1.5 rounded-xl transition-colors">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-white">{profile?.full_name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      {profile?.role === 'penyedia' ? 'Mitra' : 'Pendaki'}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-[#2e2e2e]">
                    {initial}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-[#161616] border border-[#2e2e2e] rounded-xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-[#2e2e2e] sm:hidden">
                      <p className="text-sm font-medium text-white">{profile?.full_name}</p>
                      <p className="text-xs text-gray-400">{profile?.role === 'penyedia' ? 'Mitra' : 'Pendaki'}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2e2e2e] hover:text-white transition-colors">
                        Edit Profil
                    </Link>
                    {profile?.role === 'penyewa' && (
                        <Link href="/register-store" className="block px-4 py-2 text-sm text-emerald-400 hover:bg-[#2e2e2e] transition-colors">
                        Daftar Jadi Mitra
                        </Link>
                    )}
                    <div className="border-t border-[#2e2e2e] mt-2 pt-2">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-900/20 transition-colors">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ================= TAMPILAN PENYEWA ================= */}
        {profile?.role === 'penyewa' && (
          <div className="space-y-8">
            <div className="bg-[#161616] rounded-2xl p-8 border border-[#2e2e2e] shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">Mau muncak ke mana hari ini? </h2>
              <p className="text-gray-400 mb-6">Cari peralatan outdoor terbaik di dekatmu dan booking sekarang.</p>
              
              <div className="flex gap-4 max-w-2xl mb-6">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tenda, paket bundling, jaket..." 
                  className="flex-1 px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      selectedCategory === cat 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : (cat === 'Paket Bundling' 
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30'
                            : 'bg-[#0a0a0a] border-[#2e2e2e] text-gray-400 hover:text-white hover:border-gray-500')
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  onClick={useLocationFilter ? () => setUseLocationFilter(false) : handleGetLocation}
                  disabled={isLocating}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    useLocationFilter 
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 hover:bg-emerald-600/30'
                    : 'bg-[#2e2e2e] border-[#3e3e3e] text-white hover:bg-[#3e3e3e]'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {isLocating ? 'Mencari lokasi GPS...' : (useLocationFilter ? 'Matikan Filter Lokasi' : 'Cari di Sekitarku (Max 10km)')}
                </button>
                
                {locationError && <span className="text-red-500 text-xs">{locationError}</span>}
                {useLocationFilter && userLocation && (
                  <span className="text-emerald-500 text-xs font-medium">✅ Menampilkan alat di sekitarmu (Jarak terdekat)</span>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Katalog Alat Outdoor</h3>
              {filteredItems.length === 0 ? (
                <div className="bg-[#161616] rounded-2xl border border-[#2e2e2e] p-12 text-center">
                  <p className="text-gray-500 text-lg">Peralatan tidak ditemukan di areamu.</p>
                  <button onClick={() => {setSearchQuery(''); setSelectedCategory('Semua'); setUseLocationFilter(false)}} className="text-emerald-500 hover:underline mt-2">Reset Pencarian & Lokasi</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredItems.map((item) => (
                    <div key={item.id} className={`bg-[#161616] rounded-2xl border overflow-hidden hover:border-emerald-500/50 transition-colors group cursor-pointer flex flex-col ${item.category === 'Paket Bundling' ? 'border-amber-500/30' : 'border-[#2e2e2e]'}`}>
                      <div className="h-48 bg-[#0a0a0a] overflow-hidden relative shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Image</div>
                        )}
                        <span className={`absolute top-3 right-3 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          item.category === 'Paket Bundling' ? 'bg-amber-500/80 text-white border-amber-400' : 'bg-[#0a0a0a]/80 text-gray-200 border-[#2e2e2e]'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div>
                          <Link href={`/store/${item.store_id}`} className="text-xs text-emerald-500 font-medium mb-1 hover:underline inline-block">
                            {item.stores?.store_name || 'Mitra HikeIt'}
                          </Link>
                          {item.distance !== null && useLocationFilter && (
                            <span className="inline-block align-middle ml-2 text-[10px] text-gray-400 bg-[#2e2e2e] px-1.5 py-0.5 rounded">
                              {item.distance.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1 line-clamp-2" title={item.name}>{item.name}</h4>
                        <div className="mt-auto pt-4 flex items-end justify-between">
                          <div>
                            {item.category === 'Paket Bundling' && <p className="text-[10px] text-yellow-500 font-bold mb-0.5">Diskon 5%</p>}
                            <p className="text-lg font-bold text-emerald-400">{formatRupiah(item.price_per_day)}<span className="text-xs text-gray-500 font-normal">/hari</span></p>
                          </div>
                          <button onClick={() => handleAddToCart(item.id)} className="bg-[#2e2e2e] hover:bg-emerald-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                            + Keranjang
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAMPILAN PENYEDIA / MITRA ================= */}
        {profile?.role === 'penyedia' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white">Dashboard Mitra Anda</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#161616] p-6 rounded-2xl border border-[#2e2e2e]">
                <div className="text-gray-400 text-sm mb-1">Total Alat Disewakan</div>
                <div className="text-3xl font-bold text-white">{items.length}</div>
              </div>
              <div className="bg-[#161616] p-6 rounded-2xl border border-[#2e2e2e]">
                <div className="text-gray-400 text-sm mb-1">Sewa Aktif (Diproses)</div>
                <div className="text-3xl font-bold text-white">{activeRentalsCount}</div>
              </div>
              <div className="bg-[#161616] p-6 rounded-2xl border border-[#2e2e2e]">
                <div className="text-gray-400 text-sm mb-1">Pendapatan Bulan Ini</div>
                <div className="text-3xl font-bold text-emerald-500">{formatRupiah(monthlyRevenue)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link 
                href="/dashboard/add-item" 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors inline-block"
              >
                + Tambah Alat Baru
              </Link>
              <button 
                onClick={() => setIsBundleModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors inline-block"
              >
                + Buat Paket Bundling
              </button>
              <Link href="/dashboard/manage-rentals"className="bg-[#2e2e2e] hover:bg-[#3e3e3e] text-white font-semibold py-3 px-6 rounded-xl transition-colors inline-block">
                Kelola Tracking Sewa
              </Link>
            </div>

            <div className="pt-6 border-t border-[#2e2e2e]">
              <h3 className="text-xl font-bold text-white mb-6">Daftar Alat Anda</h3>
              {items.length === 0 ? (
                <p className="text-gray-500 italic">Anda belum menambahkan alat apapun.</p>
              ) : (
                <div className="bg-[#161616] rounded-2xl border border-[#2e2e2e] overflow-hidden">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-[#0a0a0a] border-b border-[#2e2e2e]">
                      <tr>
                        <th className="px-6 py-4">Nama Barang</th>
                        <th className="px-6 py-4">Kategori</th>
                        <th className="px-6 py-4">Harga / Hari</th>
                        <th className="px-6 py-4">Stok</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className={`border-b border-[#2e2e2e] hover:bg-[#2e2e2e]/50 transition-colors ${item.category === 'Paket Bundling' ? 'bg-amber-900/10' : ''}`}>
                          <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                            {item.image_url 
                              ? <img src={item.image_url} alt="thumb" className="w-10 h-10 rounded-lg object-cover bg-[#0a0a0a]" />
                              : <div className="w-10 h-10 rounded-lg bg-[#2e2e2e] flex items-center justify-center text-xs text-gray-500">No Img</div>
                            }
                            <span className="line-clamp-2 max-w-[200px]" title={item.name}>{item.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            {item.category === 'Paket Bundling' 
                              ? <span className="text-amber-400 font-bold">Paket Bundling</span> 
                              : item.category}
                          </td>
                          <td className="px-6 py-4 text-emerald-400">{formatRupiah(item.price_per_day)}</td>
                          <td className="px-6 py-4">{item.stock}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-3">
                              <button 
                                onClick={() => openEditModal(item)}
                                className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                              >
                                Edit
                              </button>
                              <span className="text-[#2e2e2e]">|</span>
                              <button 
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="text-red-500 hover:text-red-400 font-medium transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* === BAGIAN BARU: ULASAN PELANGGAN === */}
            <div className="pt-8 mt-8 border-t border-[#2e2e2e]">
              <h3 className="text-xl font-bold text-white mb-6">Ulasan Pelanggan Terbaru</h3>
              {storeReviews.length === 0 ? (
                <p className="text-gray-500 italic">Belum ada ulasan untuk alat Anda.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {storeReviews.map((review) => (
                    <div key={review.id} className="bg-[#161616] p-5 rounded-2xl border border-[#2e2e2e] flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-white text-sm">{review.profiles?.full_name}</p>
                          <p className="text-xs text-gray-500">Menyewa: {review.items?.name}</p>
                        </div>
                        <div className="flex gap-1 text-yellow-500">
                          {/* Render Bintang */}
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < review.rating ? "currentColor" : "none"} stroke={i < review.rating ? "currentColor" : "#4b5563"} className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 italic">"{review.comment}"</p>
                      
                      <div className="mt-auto pt-4">
                        {review.reply ? (
                          <div className="bg-[#0a0a0a] border border-[#2e2e2e] p-3 rounded-xl mt-2">
                            <p className="text-xs font-semibold text-emerald-500 mb-1">Balasan Anda:</p>
                            <p className="text-sm text-gray-400">{review.reply}</p>
                            <button onClick={() => openReplyModal(review)} className="text-[10px] text-gray-500 hover:text-white mt-2">Edit Balasan</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => openReplyModal(review)}
                            className="text-xs text-emerald-500 border border-emerald-500/50 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Balas Ulasan
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* ================= MODAL EDIT ALAT ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#2e2e2e] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h2 className="text-xl font-bold text-white mb-6">Edit Data Alat</h2>
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nama Barang</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Kategori</label>
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none">
                  {categories.filter(c => c !== 'Semua').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Harga / Hari</label>
                  <input type="number" required min="0" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Stok Tersedia</label>
                  <input type="number" required min="0" value={editStock} onChange={e => setEditStock(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none" />
                </div>
              </div>
              <button type="submit" disabled={isUpdatingItem} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 mt-4 rounded-xl transition-colors disabled:opacity-50">
                {isUpdatingItem ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL BALAS ULASAN ================= */}
      {replyModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#2e2e2e] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setReplyModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h2 className="text-xl font-bold text-white mb-2">Balas Ulasan</h2>
            <p className="text-xs text-gray-400 mb-4 border-b border-[#2e2e2e] pb-4">
              Dari: {selectedReview.profiles?.full_name} <br/>
              Komentar: "{selectedReview.comment}"
            </p>
            <form onSubmit={handleReplyReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tanggapan Anda</label>
                <textarea 
                  required 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)} 
                  placeholder="Terima kasih sudah menyewa alat kami..."
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none h-24 resize-none text-sm" 
                />
              </div>
              <button type="submit" disabled={isSubmittingReply} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 mt-2 rounded-xl transition-colors disabled:opacity-50">
                {isSubmittingReply ? 'Mengirim...' : 'Kirim Balasan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL BUAT PAKET BUNDLING ================= */}
      {isBundleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#2e2e2e] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3e3e3e] [&::-webkit-scrollbar-thumb]:rounded-full">
            <button onClick={() => setIsBundleModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            
            <h2 className="text-xl font-bold text-white mb-2">Buat Paket Bundling</h2>
            <p className="text-sm text-gray-400 mb-6">Pilih beberapa alat untuk dijadikan satu paket dengan diskon otomatis 5%.</p>

            <form onSubmit={handleCreateBundle} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nama Paket</label>
                <input 
                  type="text" 
                  required 
                  value={bundleName} 
                  onChange={e => setBundleName(e.target.value)} 
                  placeholder="Contoh: Paket Nanjak Berdua"
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-amber-500/50 outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Foto Paket (Opsional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setBundleImageFile(e.target.files[0])
                    }
                  }} 
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-amber-500/50 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 text-sm cursor-pointer" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pilih Alat (Minimal 2)</label>
                {/* Scrollbar digelapkan di sini juga */}
                <div className="bg-[#0a0a0a] border border-[#2e2e2e] rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3e3e3e] [&::-webkit-scrollbar-thumb]:rounded-full">
                  {items.filter(i => i.category !== 'Paket Bundling').map(item => {
                    // Cek apakah item sedang dipilih
                    const selectedItemInfo = selectedBundleItems.find(i => i.id === item.id);
                    
                    return (
                      <div key={item.id} className="flex flex-col gap-2 p-2 hover:bg-[#161616] rounded-lg transition-colors border border-transparent hover:border-[#2e2e2e]">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!selectedItemInfo}
                            onChange={() => toggleBundleItem(item)}
                            className="w-4 h-4 accent-amber-500 bg-gray-700 border-gray-600 rounded shrink-0"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white line-clamp-1">{item.name}</p>
                            <p className="text-xs text-gray-500">{formatRupiah(item.price_per_day)}</p>
                          </div>
                        </label>
                        
                        {/* Input Jumlah Muncul Hanya Jika Alat Di-ceklis */}
                        {selectedItemInfo && (
                          <div className="flex items-center gap-2 ml-7 pl-2 border-l-2 border-[#2e2e2e]">
                            <span className="text-xs text-gray-400">Jumlah:</span>
                            <input 
                              type="number" 
                              min="1" 
                              max={item.stock} // Maksimal tidak boleh melebihi stok toko
                              value={selectedItemInfo.bundleQuantity || ''} // Fallback || '' Mencegah uncontrolled input error
                              onChange={(e) => updateBundleItemQuantity(item.id, Number(e.target.value))}
                              className="w-16 px-2 py-1 rounded bg-[#0a0a0a] border border-[#2e2e2e] text-white text-xs outline-none focus:border-amber-500 text-center"
                            />
                            <span className="text-[10px] text-gray-500">Maks: {item.stock} pcs</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {items.filter(i => i.category !== 'Paket Bundling').length === 0 && (
                    <p className="text-xs text-center text-gray-500 py-4">Kamu belum memiliki alat biasa untuk dibundling.</p>
                  )}
                </div>
              </div>

              <div className="bg-amber-900/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Harga Asli:</span>
                  <span className="text-gray-300 line-through">{formatRupiah(bundleOriginalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-400 font-medium">Diskon Bundling (5%):</span>
                  <span className="text-amber-400 font-medium">- {formatRupiah(bundleOriginalPrice * 0.05)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-amber-500/20 pt-2 mt-2">
                  <span className="text-white">Harga Paket Jadi:</span>
                  <span className="text-emerald-400">{formatRupiah(bundleDiscountPrice)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Stok Paket Tersedia</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  value={bundleStock} 
                  onChange={e => setBundleStock(Number(e.target.value))} 
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-amber-500/50 outline-none" 
                />
                <p className="text-[10px] text-gray-500 mt-1">*Pastikan stok paket tidak melebihi stok barang aslinya.</p>
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingBundle || selectedBundleItems.length < 2} 
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 mt-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingBundle ? 'Memproses...' : 'Terbitkan Paket Bundling'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}


