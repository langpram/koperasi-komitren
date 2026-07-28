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
  setSatuanOutput: (v: string) => void;
  satuanOptions: string[];
  customSatuan: string;
  setCustomSatuan: (v: string) => void;
  handleAddSatuan: (type: 'input' | 'output') => void;
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

export default function OutputSection({ stokData, customers, namaProdukOutput, setNamaProdukOutput, jumlahOutput, setJumlahOutput, satuanOutput, setSatuanOutput, satuanOptions, customSatuan, setCustomSatuan, handleAddSatuan, tujuanCustomer, setTujuanCustomer, getAvailableFor, addToCart, cart, removeFromCart, processOutput, loading }: Props) {
  const [productSearch, setProductSearch] = useState(namaProdukOutput);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

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

  const filteredProductOptions = productOptions.filter((opt) =>
    opt.label.toLowerCase().includes(productSearch.toLowerCase())
  );

  useEffect(() => {
    setProductSearch(namaProdukOutput);
  }, [namaProdukOutput]);

  const selectProduct = (name: string) => {
    const stockItem = stokData.find((s) => s.namaProduk === name);
    setNamaProdukOutput(name);
    setProductSearch(name);
    setSatuanOutput(stockItem?.satuan || satuanOutput);
    setShowProductDropdown(false);
  };

  // Hitung TOTAL HARGA semua item di keranjang!
  const totalHargaCart = cart.reduce(
    (acc, item) => acc + (item.jumlah * item.hargaSatuan),
    0
  );

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

        <div className="relative">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Nama Barang <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ketik nama barang..."
            value={productSearch}
            onChange={(e) => {
              const value = e.target.value;
              setProductSearch(value);
              setNamaProdukOutput(value);
              const stockItem = stokData.find((s) => s.namaProduk === value.toUpperCase());
              if (stockItem) {
                setSatuanOutput(stockItem.satuan);
              }
              setShowProductDropdown(true);
            }}
            onFocus={() => setShowProductDropdown(true)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition text-black"
          />
          {showProductDropdown && filteredProductOptions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {filteredProductOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => selectProduct(opt.value)}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 transition text-gray-800 font-medium border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{opt.label}</span>
                    <span className="text-xs text-gray-500">{opt.badge}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
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
          <select
            value={satuanOutput}
            onChange={(e) => setSatuanOutput(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition text-gray-800 bg-white"
          >
            {satuanOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Tambah satuan (misal: KG, LITER)"
              value={customSatuan}
              onChange={(e) => setCustomSatuan(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition text-gray-800"
            />
            <button
              type="button"
              onClick={() => handleAddSatuan('output')}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
            >
              Tambah
            </button>
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
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center justify-between pb-3 border-b-2 border-gray-100">
            <span className="flex items-center gap-2 text-lg">
              🛒 Keranjang
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-sm font-bold">
                {cart.length} item
              </span>
            </span>
            <span className="text-base bg-gray-900 text-white px-3 py-1 rounded-md font-bold">
              Rp {totalHargaCart.toLocaleString("id-ID")}
            </span>
          </h4>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 mb-4">
            {cart.map((item, idx) => {
              const subtotal = item.jumlah * item.hargaSatuan;
              return (
                <div key={idx} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1 mr-3">
                    <div className="font-semibold text-gray-900 text-sm line-clamp-2">{item.namaProduk}</div>
                    <div className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-1">
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200 font-medium">
                        {item.jumlah} {item.satuan}
                      </span>
                      <span className="text-gray-400">×</span>
                      <span className="font-medium">
                        Rp {item.hargaSatuan.toLocaleString("id-ID")}
                      </span>
                      <span className="text-gray-400 ml-1">=</span>
                      <span className="font-bold text-gray-900">
                        Rp {subtotal.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition font-bold text-lg"
                    title="Hapus item"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-100">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-700 text-base">TOTAL HARGA</span>
              <span className="font-black text-2xl text-gray-900">
                Rp {totalHargaCart.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <button
            onClick={processOutput}
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {loading ? "⏳ Memproses..." : "🧾 Proses & Cetak Struk"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
