'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function AddItemPage() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Tenda')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [image, setImage] = useState<File | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getStoreData() {
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
        setStoreId(storeData.id)
      } else {
        alert("Anda belum memiliki toko terdaftar!")
        router.push('/register-store')
      }
    }
    getStoreData()
  }, [router, supabase])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId) return
    
    setLoading(true)

    try {
      let imageUrl = ''

      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${storeId}/${fileName}` 

        const { error: uploadError } = await supabase.storage
          .from('items')
          .upload(filePath, image)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('items')
          .getPublicUrl(filePath)
        
        imageUrl = publicUrlData.publicUrl
      }

      const { error: insertError } = await supabase
        .from('items')
        .insert({
          store_id: storeId,
          name,
          category,
          description,
          price_per_day: parseFloat(price),
          stock: parseInt(stock),
          image_url: imageUrl
        })

      if (insertError) throw insertError

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      alert("Gagal menambahkan barang: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-100">
      <div className="max-w-3xl mx-auto bg-[#161616] p-8 rounded-2xl shadow-2xl border border-[#2e2e2e]">
        <div className="mb-8 border-b border-[#2e2e2e] pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Tambah Alat Outdoor</h1>
          <p className="text-gray-400">Masukkan detail perlengkapan yang ingin Anda sewakan.</p>
        </div>

        <form onSubmit={handleAddItem} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Alat */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Nama Alat</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                placeholder="Contoh: Tenda Rei 4 Orang"
              />
            </div>

            {/* Kategori */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
              >
                <option value="Tenda">Tenda</option>
                <option value="Carrier">Carrier</option>
                <option value="Sepatu">Sepatu</option>
                <option value="Jaket">Jaket</option>
                <option value="Alat Masak">Alat Masak (Nesting, Kompor)</option>
                <option value="Sleeping Bag">Sleeping Bag / Matras</option>
                <option value="Aksesoris">Aksesoris (Senter, Tracking Pole)</option>
              </select>
            </div>

            {/* Harga Sewa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Harga Sewa / Hari (Rp)</label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                placeholder="Contoh: 25000"
              />
            </div>

            {/* Stok */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Jumlah Stok</label>
              <input
                type="number"
                required
                min="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Deskripsi Barang</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2e2e2e] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none h-32 resize-none"
              placeholder="Sebutkan spesifikasi, kondisi barang, kelengkapan, dll..."
            />
          </div>

          {/* Upload Foto */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Foto Barang</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImage(e.target.files[0])
                }
              }}
              className="w-full file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-900/30 file:text-emerald-500 hover:file:bg-emerald-900/50 text-gray-400 cursor-pointer"
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-[#2e2e2e]">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-[#2e2e2e] hover:bg-[#3e3e3e] text-white font-semibold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan & Mengunggah...' : 'Simpan Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}