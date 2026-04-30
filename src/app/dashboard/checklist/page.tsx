'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const defaultChecklist = [
  { id: '1', category: 'Alat Kelompok / Camp', name: 'Tenda Kapasitas Sesuai Tim', checked: false },
  { id: '2', category: 'Alat Kelompok / Camp', name: 'Kompor Portable & Gas', checked: false },
  { id: '3', category: 'Alat Kelompok / Camp', name: 'Nesting / Alat Masak', checked: false },
  { id: '4', category: 'Alat Pribadi', name: 'Carrier / Tas Gunung', checked: false },
  { id: '5', category: 'Alat Pribadi', name: 'Sleeping Bag (SB)', checked: false },
  { id: '6', category: 'Alat Pribadi', name: 'Matras', checked: false },
  { id: '7', category: 'Pakaian & Keamanan', name: 'Sepatu Gunung / Trekking', checked: false },
  { id: '8', category: 'Pakaian & Keamanan', name: 'Jaket Gunung (Windproof/Polar)', checked: false },
  { id: '9', category: 'Pakaian & Keamanan', name: 'Jas Hujan / Ponco', checked: false },
  { id: '10', category: 'Pakaian & Keamanan', name: 'Headlamp & Baterai Cadangan', checked: false },
]

export default function ChecklistPage() {
  const [items, setItems] = useState(defaultChecklist)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('hikeit_checklist')
    if (saved) {
      setItems(JSON.parse(saved))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('hikeit_checklist', JSON.stringify(items))
    }
  }, [items, isLoaded])

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const resetChecklist = () => {
    if(confirm('Yakin ingin mereset semua checklist?')) {
      setItems(defaultChecklist)
    }
  }

  const categories = Array.from(new Set(items.map(i => i.category)))

  const totalItems = items.length
  const checkedItems = items.filter(i => i.checked).length
  const progress = Math.round((checkedItems / totalItems) * 100)

  if (!isLoaded) return null 

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#2e2e2e] pb-6">
          <div>
            <Link href="/dashboard" className="text-emerald-500 text-sm font-medium hover:underline mb-2 inline-block">
              &larr; Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white mb-1">Checklist Pendakian</h1>
            <p className="text-gray-400">Persiapan logistik & alat tempur Muncak gunung tujuanmu.</p>
          </div>
          <button 
            onClick={resetChecklist}
            className="text-sm text-red-500 hover:text-red-400 border border-red-500/30 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors w-fit"
          >
            Reset Ulang
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-[#161616] p-6 rounded-2xl border border-[#2e2e2e] mb-8 shadow-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-300">Kesiapan Alat</span>
            <span className="font-bold text-emerald-400">{progress}% ({checkedItems}/{totalItems})</span>
          </div>
          <div className="w-full bg-[#0a0a0a] rounded-full h-3 overflow-hidden border border-[#2e2e2e]">
            <div 
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {progress === 100 && (
            <p className="text-emerald-500 text-sm mt-3 font-medium text-center animate-pulse">
              Semua perlengkapan sudah siap! Gas muncak!
            </p>
          )}
        </div>

        {/* Daftar Checklist */}
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category}>
              <h2 className="text-lg font-bold text-emerald-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.filter(i => i.category === category).map(item => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      item.checked 
                        ? 'bg-[#161616] border-emerald-500/30 opacity-70' 
                        : 'bg-[#161616] border-[#2e2e2e] hover:border-gray-500'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded flex items-center justify-center border ${
                        item.checked ? 'bg-emerald-500 border-emerald-500' : 'bg-[#0a0a0a] border-gray-500'
                      }`}>
                        {item.checked && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`font-medium ${item.checked ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                        {item.name}
                      </span>
                    </div>
                    
                    {!item.checked && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          const searchKeyword = item.name.split(' ')[0];
                        }}
                        className="text-xs text-emerald-500 hover:text-white hover:bg-emerald-600 border border-emerald-600/50 px-2 py-1 rounded transition-colors"
                      >
                        Sewa
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}