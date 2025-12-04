"use client";

import React, { useState, useRef, useEffect } from "react";

interface CartItem {
  namaProduk: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
}

interface StokItem {
  namaProduk: string;
  totalJumlah: number;
  satuan: string;
}

interface Customer {
  id: string;
  nama: string;
}

interface Props {
  stokData: StokItem[];
  customers: Customer[];
  namaProdukOutput: string;
  setNamaProdukOutput: (v: string) => void;
  jumlahOutput: string;
  setJumlahOutput: (v: string) => void;
  satuanOutput: string;
  tujuanCustomer: string;
  setTujuanCustomer: (v: string) => void;
  getAvailableFor: (productName: string) => number;
  addToCart: () => void;
  cart: CartItem[];
  removeFromCart: (index: number) => void;
  processOutput: () => void;
  loading: boolean;
}

function CustomDropdown({ value, onChange, options, placeholder, icon }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: any) => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition text-gray-800 bg-white hover:border-red-300 cursor-pointer shadow-sm hover:shadow text-left flex items-center justify-between"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {icon} {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Cari..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-red-500 text-sm text-black"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-60">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-gray-400 text-center">Tidak ada data</div>
            ) : (
              filteredOptions.map((opt: any) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-red-50 transition flex items-center justify-between group ${
                    value === opt.value ? "bg-red-50 border-l-4 border-red-500" : ""
                  }`}
                >
                  <span className="font-medium text-gray-800">{opt.label}</span>
                  {opt.badge && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                      {opt.badge}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OutputSection({ stokData, customers, namaProdukOutput, setNamaProdukOutput, jumlahOutput, setJumlahOutput, satuanOutput, tujuanCustomer, setTujuanCustomer, getAvailableFor, addToCart, cart, removeFromCart, processOutput, loading }: Props) {
  const customerOptions = customers.map(c => ({
    value: c.nama,
    label: c.nama
  }));

  const productOptions = stokData
    .filter(s => s.totalJumlah > 0)
    .sort((a, b) => a.namaProduk.localeCompare(b.namaProduk))
    .map(s => ({
      value: s.namaProduk,
      label: s.namaProduk,
      badge: `${s.totalJumlah} ${s.satuan}`
    }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-3">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Tujuan Customer <span className="text-red-500">*</span>
          </label>
          <CustomDropdown
            value={tujuanCustomer}
            onChange={setTujuanCustomer}
            options={customerOptions}
            placeholder="Pilih customer tujuan..."
            icon="👤"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Nama Barang <span className="text-red-500">*</span>
          </label>
          <CustomDropdown
            value={namaProdukOutput}
            onChange={setNamaProdukOutput}
            options={productOptions}
            placeholder="Pilih barang dari stok..."
            icon="📦"
          />
          {namaProdukOutput ? (
            <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              ✅ Stok tersedia: <span className="font-bold">{getAvailableFor(namaProdukOutput)} {satuanOutput}</span>
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Jumlah <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            placeholder="50"
            value={jumlahOutput}
            onChange={(e) => setJumlahOutput(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition text-black font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Satuan <span className="text-red-500">*</span>
          </label>
          <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 font-semibold bg-gradient-to-br from-gray-50 to-gray-100 cursor-not-allowed shadow-sm">
            ⚖️ {satuanOutput}
          </div>
        </div>
      </div>

      <button
        onClick={addToCart}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl"
      >
        ➕ Tambah ke Keranjang
      </button>

      {cart.length > 0 ? (
        <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            🛒 Keranjang ({cart.length} item)
          </h4>
          <div className="space-y-2">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="font-semibold text-gray-900">{item.namaProduk}</span>
                  <span className="text-gray-600 ml-3">{item.jumlah} {item.satuan}</span>
                </div>
                <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-700 font-bold">
                  ❌
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={processOutput}
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? "⏳ Memproses..." : "🧾 Proses & Cetak Struk"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
