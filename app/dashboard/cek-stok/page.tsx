//dashboard/cek-stok/page.tsx
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, deleteDoc, doc, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";

interface StokItem {
  namaProduk: string;
  totalJumlah: number;
  satuan: string;
  suppliers: { nama: string; jumlah: number }[];
}

interface TransaksiItem {
  id: string;
  type: string;
  namaProduk: string;
  namaSupplier?: string;
  jumlah: number;
  satuan: string;
  timestamp: any;
  user: string;
  masaBerlaku?: string;
  hargaBeliSatuan?: number;
  hargaJualSatuan?: number;
}

export default function CekStokPage() {
  const [cabang, setCabang] = useState("");
  const [stokData, setStokData] = useState<StokItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<StokItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [productPrices, setProductPrices] = useState<Record<string, number>>({});
  const [editPrice, setEditPrice] = useState<string>("");

  // State untuk modal riwayat transaksi + delete
  const [showTransaksiModal, setShowTransaksiModal] = useState(false);
  const [transaksiList, setTransaksiList] = useState<TransaksiItem[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [suppliersMap, setSuppliersMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const storedCabang = localStorage.getItem("cabang") || "";
    setCabang(storedCabang);

    if (storedCabang) {
      loadStokData(storedCabang);
      loadAllTransaksi(storedCabang);
      loadProductPrices(storedCabang);
      loadSuppliers(storedCabang);
    }
  }, []);

  const loadStokData = (cabangName: string) => {
    setLoading(true);
    
    // Real-time listener untuk transaksi
    const q = query(collection(db, "cabang", cabangName, "transaksi"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transaksi = snapshot.docs.map((doc) => doc.data());

      // Kalkulasi stok per produk dengan NORMALISASI NAMA
      const stokMap: { [key: string]: StokItem } = {};

      transaksi.forEach((item: any) => {
        // NORMALISASI: Semua huruf besar & trim whitespace
        const normalizedName = item.namaProduk.toUpperCase().trim();

        if (!stokMap[normalizedName]) {
          stokMap[normalizedName] = {
            namaProduk: normalizedName,
            totalJumlah: 0,
            satuan: item.satuan || "",
            suppliers: [],
          };
        }

        if (item.type === "input") {
          // Tambah stok
          stokMap[normalizedName].totalJumlah += item.jumlah;
          stokMap[normalizedName].satuan = item.satuan || stokMap[normalizedName].satuan;

          // Track supplier
          const supplierIndex = stokMap[normalizedName].suppliers.findIndex(
            (s) => s.nama === item.namaSupplier
          );
          if (supplierIndex >= 0) {
            stokMap[normalizedName].suppliers[supplierIndex].jumlah += item.jumlah;
          } else {
            stokMap[normalizedName].suppliers.push({
              nama: item.namaSupplier,
              jumlah: item.jumlah,
            });
          }
        } else if (item.type === "output") {
          // Kurangi stok
          stokMap[normalizedName].totalJumlah -= item.jumlah;
        }
      });

      const stokArray = Object.values(stokMap);
      setStokData(stokArray);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const loadAllTransaksi = (cabangName: string) => {
    const q = query(collection(db, "cabang", cabangName, "transaksi"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TransaksiItem[];

      // Sort by timestamp descending
      data.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setTransaksiList(data);
    });

    return () => unsubscribe();
  };

  const loadProductPrices = (cabangName: string) => {
    const q = query(collection(db, "cabang", cabangName, "produk"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, number> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as any;
        const name = (data.namaProduk || doc.id || "").toUpperCase();
        if (name && typeof data.hargaJualSatuan === "number") {
          map[name] = data.hargaJualSatuan;
        }
      });
      setProductPrices(map);
    });
    return () => unsubscribe();
  };

  const loadSuppliers = (cabangName: string) => {
    const q = query(collection(db, "cabang", cabangName, "suppliers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data() as any;
        const name = (data.nama || "").toUpperCase();
        if (name) map[name] = data;
      });
      setSuppliersMap(map);
    });
    return () => unsubscribe();
  };

  const getLatestHargaBeli = (productName: string, supplierName?: string) => {
    const filtered = transaksiList.filter(
      (t) => t.type === "input" && t.namaProduk?.toUpperCase() === productName.toUpperCase() && (!supplierName || t.namaSupplier === supplierName)
    );
    if (filtered.length === 0) return 0;
    filtered.sort((a, b) => {
      const timeA = a.timestamp?.toMillis?.() || 0;
      const timeB = b.timestamp?.toMillis?.() || 0;
      return timeB - timeA;
    });
    return (filtered[0] as any).hargaBeliSatuan || 0;
  };

  const saveProductPrice = async () => {
    if (!selectedProduct) return;
    const price = parseFloat(editPrice);
    if (!price || price <= 0) {
      alert("Masukkan harga jual yang valid");
      return;
    }
    const ref = doc(db, "cabang", cabang, "produk", selectedProduct.namaProduk);
    await setDoc(ref, { namaProduk: selectedProduct.namaProduk, hargaJualSatuan: price, updatedAt: new Date() }, { merge: true });
    setEditPrice("");
    alert("✅ Harga jual disimpan");
  };

  const inMonth = (t: TransaksiItem) => {
    const time = t.timestamp?.toMillis?.() || (t.timestamp?.toDate?.()?.getTime?.() || new Date(t.timestamp).getTime());
    const start = new Date(year, month - 1, 1).getTime();
    const end = new Date(year, month, 0, 23, 59, 59, 999).getTime();
    return time >= start && time <= end;
  };

  const exportLaporanBulanan = () => {
    const data = transaksiList.filter(inMonth);
    if (data.length === 0) {
      alert("❌ Tidak ada transaksi di bulan ini");
      return;
    }
    const byProduk: Record<string, any> = {};
    data.forEach((t) => {
      const name = t.namaProduk.toUpperCase();
      if (!byProduk[name]) {
        byProduk[name] = { namaProduk: name, satuan: t.satuan || "", qtyIn: 0, qtyOut: 0, costSum: 0, revenueSum: 0 };
      }
      if (t.type === "input") {
        byProduk[name].qtyIn += t.jumlah;
        const hb = typeof t.hargaBeliSatuan === "number" ? t.hargaBeliSatuan : 0;
        byProduk[name].costSum += (t.jumlah || 0) * hb;
      } else if (t.type === "output") {
        byProduk[name].qtyOut += t.jumlah;
        const hj = typeof t.hargaJualSatuan === "number" ? t.hargaJualSatuan : (productPrices[name] || 0);
        byProduk[name].revenueSum += (t.jumlah || 0) * hj;
      }
      byProduk[name].satuan = t.satuan || byProduk[name].satuan;
    });
    const rows = Object.values(byProduk).map((p: any, idx) => {
      const avgHB = p.qtyIn > 0 ? p.costSum / p.qtyIn : 0;
      const profit = p.revenueSum - p.costSum;
      return {
        No: idx + 1,
        Produk: p.namaProduk,
        "Qty IN": p.qtyIn,
        "Qty OUT": p.qtyOut,
        Satuan: p.satuan,
        "HB Rata2": Math.round(avgHB),
        "Total HPP": Math.round(p.costSum),
        "Total Penjualan": Math.round(p.revenueSum),
        "Laba Kotor": Math.round(profit),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Bulanan");
    ws["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
    ];
    const fileName = `Laporan_Bulanan_${cabang}_${year}-${String(month).padStart(2, "0")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportSupplierKategori = () => {
    const inputs = transaksiList.filter((t) => t.type === "input" && inMonth(t));
    if (inputs.length === 0) {
      alert("❌ Tidak ada transaksi input di bulan ini");
      return;
    }
    const productMap: Record<string, Record<string, { qty: number; satuan: string }>> = {};

    inputs.forEach((t) => {
      const produk = t.namaProduk.toUpperCase();
      const supplier = (t.namaSupplier || "-").toUpperCase();
      if (!productMap[produk]) productMap[produk] = {};
      if (!productMap[produk][supplier]) productMap[produk][supplier] = { qty: 0, satuan: t.satuan || "" };
      productMap[produk][supplier].qty += t.jumlah || 0;
      productMap[produk][supplier].satuan = t.satuan || productMap[produk][supplier].satuan;
    });

    const wb = XLSX.utils.book_new();
    Object.keys(productMap).forEach((prod) => {
      const rows: any[] = [];
      let idx = 0;
      const suppliers = Object.keys(productMap[prod]).sort();
      suppliers.forEach((sup) => {
        const agg = productMap[prod][sup];
        const hb = getLatestHargaBeli(prod, sup) || (suppliersMap[sup]?.hargaBeliSatuan || 0);
        const hj = productPrices[prod] || 0;
        const marginUnit = hj - hb;
        rows.push({
          No: ++idx,
          Supplier: sup,
          Produk: prod,
          "Qty IN Bulan": agg.qty,
          Satuan: agg.satuan,
          "HB Terakhir": Math.round(hb),
          "HJ Satuan": Math.round(hj),
          "Margin/Unit": Math.round(marginUnit),
        });
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 24 },
        { wch: 24 },
        { wch: 14 },
        { wch: 10 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
      ];
      const sheetName = (prod || "PRODUK").substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const fileName = `Supplier_Per_Produk_${cabang}_${year}-${String(month).padStart(2, "0")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleDeleteTransaksi = async (transaksiId: string) => {
    if (!confirm("❗ Yakin mau hapus transaksi ini? Data tidak bisa dikembalikan!")) {
      return;
    }

    setDeleteLoading(transaksiId);

    try {
      await deleteDoc(doc(db, "cabang", cabang, "transaksi", transaksiId));
      alert("✅ Transaksi berhasil dihapus!");
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const openModal = (item: StokItem) => {
    setSelectedProduct(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  const openTransaksiModal = () => {
    setShowTransaksiModal(true);
  };

  const closeTransaksiModal = () => {
    setShowTransaksiModal(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter berdasarkan search
  const filteredStok = stokData.filter((item) =>
    item.namaProduk.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="text-3xl">📦</span>
            Cek Stok Barang
          </h2>
          <div className="flex gap-2">
            <button
              onClick={openTransaksiModal}
              className="px-5 py-2.5 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg"
            >
              📋 Kelola Transaksi
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 rounded-xl text-gray-800 font-medium outline-none focus:ring-4 focus:ring-blue-300 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="flex-1 px-4 py-3 rounded-xl text-blue-600 font-bold bg-white hover:bg-blue-50 transition"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="flex-1 px-4 py-3 rounded-xl text-blue-600 font-bold bg-white hover:bg-blue-50 transition"
            >
              {Array.from({ length: 6 }, (_, k) => new Date().getFullYear() - 3 + k).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportLaporanBulanan}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition shadow-md"
            >
              📊 Export Laporan Bulanan
            </button>
            <button
              onClick={exportSupplierKategori}
              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition shadow-md"
            >
              📈 Export Supplier per Produk
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-blue-500">
          <div className="text-sm font-semibold text-gray-600 mb-1">Total Produk</div>
          <div className="text-3xl font-bold text-gray-900">{stokData.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-green-500">
          <div className="text-sm font-semibold text-gray-600 mb-1">Stok Tersedia</div>
          <div className="text-3xl font-bold text-gray-900">
            {stokData.filter((s) => s.totalJumlah > 0).length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-red-500">
          <div className="text-sm font-semibold text-gray-600 mb-1">Stok Habis</div>
          <div className="text-3xl font-bold text-gray-900">
            {stokData.filter((s) => s.totalJumlah <= 0).length}
          </div>
        </div>
      </div>

      {/* Tabel Stok */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">⏳</div>
            <div className="text-gray-500 font-medium">Loading data stok...</div>
          </div>
        ) : filteredStok.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📭</div>
            <div className="text-gray-500 font-medium">
              {searchQuery ? "Produk tidak ditemukan" : "Belum ada data stok"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-bold text-gray-900">No</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Nama Produk</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Jumlah Stok</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Status</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStok.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-blue-50 transition"
                  >
                    <td className="py-4 px-4 font-semibold text-gray-700">{index + 1}</td>
                    <td className="py-4 px-4 font-bold text-gray-900">{item.namaProduk}</td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-2xl text-gray-900">
                        {item.totalJumlah}
                      </span>
                      <span className="ml-2 text-gray-600 font-semibold">{item.satuan}</span>
                    </td>
                    <td className="py-4 px-4">
                      {item.totalJumlah > 10 ? (
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                          ✅ Aman
                        </span>
                      ) : item.totalJumlah > 0 ? (
                        <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold">
                          ⚠️ Menipis
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                          ❌ Habis
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => openModal(item)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg"
                      >
                        📊 Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Stok */}
      {showModal && selectedProduct && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-3xl">📦</span>
                Detail Stok: {selectedProduct.namaProduk}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold transition"
              >
                ×
              </button>
            </div>

            {/* Total Stok */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-6 text-white">
              <div className="text-sm font-semibold mb-2 opacity-90">Total Stok Tersedia</div>
              <div className="text-5xl font-bold">
                {selectedProduct.totalJumlah}{" "}
                <span className="text-2xl opacity-90">{selectedProduct.satuan}</span>
              </div>
            </div>

            {/* Detail per Supplier */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-lg">
                📊 Detail per Supplier:
              </h4>
              {selectedProduct.suppliers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Belum ada data supplier
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProduct.suppliers.map((supplier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition"
                    >
                      <div>
                        <div className="font-bold text-gray-900 text-lg">
                          {supplier.nama}
                        </div>
                        <div className="text-sm text-gray-600">
                          HB terakhir: Rp {getLatestHargaBeli(selectedProduct.namaProduk, supplier.nama).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-3xl text-blue-600">
                          {supplier.jumlah}
                        </div>
                        <div className="text-sm text-gray-600 font-semibold">
                          {selectedProduct.satuan}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Harga Beli & Jual */}
            <div className="mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  <div className="text-sm text-gray-600">Harga Beli Terakhir (semua supplier)</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">Rp {getLatestHargaBeli(selectedProduct.namaProduk).toLocaleString("id-ID")}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  <div className="text-sm text-gray-600">Harga Jual Satuan (konfigurasi)</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">Rp {(productPrices[selectedProduct.namaProduk] || 0).toLocaleString("id-ID")}</div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Tetapkan Harga Jual</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Contoh: 18000"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition text-black"
                  />
                  <button onClick={saveProductPrice} className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-md">💾 Simpan</button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Harga jual ini dipakai saat output barang.</p>
              </div>
            </div>

          {/* Close Button */}
          <button
            onClick={closeModal}
            className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-bold transition"
          >
            Tutup
          </button>
          </div>
        </div>
      )}

      {/* Modal Kelola Transaksi (Bisa Hapus) */}
      {showTransaksiModal && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
          onClick={closeTransaksiModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-3xl">📋</span>
                Kelola Transaksi
              </h3>
              <button
                onClick={closeTransaksiModal}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold transition"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {transaksiList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-3">📦</div>
                  <div className="font-medium">Belum ada transaksi</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Waktu</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Type</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Produk</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Supplier</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Jumlah</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">User</th>
                        <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaksiList.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-red-50 transition">
                          <td className="py-3 px-3 text-xs font-medium text-gray-700">
                            {formatDate(item.timestamp)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                item.type === "input"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {item.type === "input" ? "📥 IN" : "📤 OUT"}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-900 text-sm">
                            {item.namaProduk}
                          </td>
                          <td className="py-3 px-3 text-gray-700 font-medium text-sm">
                            {item.namaSupplier || "-"}
                          </td>
                          <td className="py-3 px-3 font-bold text-gray-900 text-sm">
                            {item.jumlah} <span className="text-gray-600">{item.satuan}</span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-600 font-medium">
                            {item.user}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleDeleteTransaksi(item.id)}
                              disabled={deleteLoading === item.id}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-bold text-xs transition"
                            >
                              {deleteLoading === item.id ? "⏳" : "🗑️ Hapus"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t-2 border-gray-200">
              <button
                onClick={closeTransaksiModal}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
