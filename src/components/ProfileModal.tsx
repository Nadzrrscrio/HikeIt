'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: {
    id?: string
    full_name?: string
    phone_number?: string
    role?: 'penyewa' | 'penyedia' | string
  } | null
  userEmail?: string
  storeData?: {
    store_name?: string
    address?: string
    maps_link?: string
    operational_hours?: string
  } | null
  cartCount?: number
  activeRentalsCount?: number
  monthlyRevenue?: number
  itemsCount?: number
  onLogout: () => void
  onOpenBundleModal?: () => void
}

export default function ProfileModal({
  isOpen,
  onClose,
  profile,
  userEmail,
  storeData,
  cartCount = 0,
  activeRentalsCount = 0,
  monthlyRevenue = 0,
  itemsCount = 0,
  onLogout,
  onOpenBundleModal
}: ProfileModalProps) {
  const router = useRouter()

  if (!isOpen || !profile) return null

  const isPenyedia = profile.role === 'penyedia'
  const isPenyewa = profile.role === 'penyewa'
  const initial = profile.full_name?.charAt(0).toUpperCase() || 'P'

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#161616] border border-[#2e2e2e] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-[#2e2e2e] bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <h2 className="text-lg font-bold text-white">Pop-up Profil Akun</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#2e2e2e] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3e3e3e] [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* Card User Info */}
          <div className="flex items-center gap-4 bg-[#0a0a0a] p-4 rounded-xl border border-[#2e2e2e]">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ring-2 shadow-lg ${
              isPenyedia ? 'bg-amber-600 ring-amber-500/50' : 'bg-emerald-600 ring-emerald-500/50'
            }`}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-base font-bold text-white truncate">{profile.full_name || 'Pengguna HikeIt'}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  isPenyedia 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                }`}>
                  {isPenyedia ? 'Mitra (Penyedia)' : 'Pendaki (Penyewa)'}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">{userEmail || 'Email tidak tersedia'}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>📱 WA:</span>
                <span className="text-gray-300 font-medium">{profile.phone_number || 'Belum diatur'}</span>
              </p>
            </div>
          </div>

          {/* ROLE SPECIFIC STATS & DETAILS */}
          {isPenyewa && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Ringkasan Aktivitas Pendaki</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a0a0a] p-3.5 rounded-xl border border-[#2e2e2e]">
                  <p className="text-xs text-gray-400">Keranjang Saya</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{cartCount} <span className="text-xs text-gray-500 font-normal">item</span></p>
                </div>
                <div className="bg-[#0a0a0a] p-3.5 rounded-xl border border-[#2e2e2e]">
                  <p className="text-xs text-gray-400">Status Akun</p>
                  <p className="text-xs font-semibold text-emerald-400 mt-2">✓ Verified Hiker</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">Navigasi Cepat:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    href="/dashboard/checklist"
                    onClick={onClose}
                    className="p-3 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] rounded-xl text-xs text-gray-200 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>📋</span> Checklist Alat
                  </Link>
                  <Link 
                    href="/dashboard/my-rentals"
                    onClick={onClose}
                    className="p-3 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] rounded-xl text-xs text-gray-200 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>📦</span> Pesanan Saya
                  </Link>
                  <Link 
                    href="/dashboard/cart"
                    onClick={onClose}
                    className="p-3 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] rounded-xl text-xs text-gray-200 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>🛒</span> Keranjang
                  </Link>
                  <Link 
                    href="/register-store"
                    onClick={onClose}
                    className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs text-amber-400 transition-colors flex items-center gap-2 font-medium"
                  >
                    <span>🏪</span> Jadi Mitra Toko
                  </Link>
                </div>
              </div>
            </div>
          )}

          {isPenyedia && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Informasi & Performa Toko</h4>
              
              {/* Store details */}
              <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#2e2e2e] space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#2e2e2e] pb-2">
                  <span className="text-gray-400">Nama Toko:</span>
                  <span className="font-bold text-amber-400">{storeData?.store_name || 'Toko Mitra HikeIt'}</span>
                </div>
                <div className="flex justify-between border-b border-[#2e2e2e] pb-2">
                  <span className="text-gray-400">Jam Operasional:</span>
                  <span className="text-gray-200">{storeData?.operational_hours || 'Belum diisi'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Alamat Lengkap:</span>
                  <span className="text-gray-300 leading-relaxed block">{storeData?.address || 'Belum diisi'}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0a0a0a] p-3 rounded-xl border border-[#2e2e2e] text-center">
                  <p className="text-[10px] text-gray-400">Total Alat</p>
                  <p className="text-base font-bold text-white mt-1">{itemsCount}</p>
                </div>
                <div className="bg-[#0a0a0a] p-3 rounded-xl border border-[#2e2e2e] text-center">
                  <p className="text-[10px] text-gray-400">Sewa Aktif</p>
                  <p className="text-base font-bold text-amber-400 mt-1">{activeRentalsCount}</p>
                </div>
                <div className="bg-[#0a0a0a] p-3 rounded-xl border border-[#2e2e2e] text-center">
                  <p className="text-[10px] text-gray-400">Omset Bulan Ini</p>
                  <p className="text-xs font-bold text-emerald-400 mt-1 truncate">{formatRupiah(monthlyRevenue)}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">Aksi Cepat Mitra:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    href="/dashboard/add-item"
                    onClick={onClose}
                    className="p-2.5 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] rounded-xl text-xs text-gray-200 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>➕</span> Tambah Alat
                  </Link>
                  <button 
                    type="button"
                    onClick={() => {
                      onClose()
                      if (onOpenBundleModal) onOpenBundleModal()
                    }}
                    className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs text-amber-400 transition-colors flex items-center gap-2 text-left"
                  >
                    <span>🎁</span> Paket Bundling
                  </button>
                  <Link 
                    href="/dashboard/manage-rentals"
                    onClick={onClose}
                    className="col-span-2 p-2.5 bg-[#0a0a0a] hover:bg-[#2e2e2e] border border-[#2e2e2e] rounded-xl text-xs text-gray-200 hover:text-white transition-colors flex items-center gap-2 justify-center"
                  >
                    <span>🚚</span> Kelola Tracking Sewa Pelanggan
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#2e2e2e] bg-[#0a0a0a] flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => {
              onClose()
              router.push('/profile')
            }}
            className="flex-1 bg-[#2e2e2e] hover:bg-[#3e3e3e] text-gray-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>⚙️</span> Edit Profil
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              router.push('/change-password')
            }}
            className="flex-1 bg-[#2e2e2e] hover:bg-[#3e3e3e] text-gray-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>🔑</span> Ganti Password
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onLogout()
            }}
            className="bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 text-red-400 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span>🚪</span> Logout
          </button>
        </div>

      </div>
    </div>
  )
}
