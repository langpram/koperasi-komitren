"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import * as XLSX from "xlsx";

interface TransaksiItem {
  id: string;
  type: string;
  namaProduk: string;
  jumlah: number;
  satuan: string;
  hargaBeliSatuan?: number;
  hargaJualSatuan?: number;
  tujuanCustomer?: string;
  timestamp: any;
  user: string;
}

/* ============================================================
   ICON SET — konsisten dengan Beranda / Data Customer / Data Supplier
   ============================================================ */
type IconProps = { className?: string };

const IconChartBar = ({ className = "w-6 h-6" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20V10M10 20V4M16 20v-7" />
    <path d="M3 20h18" />
  </svg>
);

const IconFilter = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h16" />
    <path d="M7 12h10" />
    <path d="M10 19h4" />
  </svg>
);

const IconDownload = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M4 19h16" />
  </svg>
);

const IconRotateCcw = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);

const IconWallet = ({ className = "w-7 h-7" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5V8H5.5A2.5 2.5 0 0 1 3 5.5" />
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M16 14h2" />
  </svg>
);

const IconAlertCircle = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
  </svg>
);

const IconPackageEmpty = ({ className = "w-10 h-10" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </svg>
);

const IconLoader = ({ className = "w-10 h-10" }: IconProps) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function RiwayatPenjualanPage() {
  const [cabang, setCabang] = useState("");
  const [riwayatPenjualan, setRiwayatPenjualan] = useState<TransaksiItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast notifications — konsisten dengan halaman lain
  const [error, setError] = useState("");
  const notifyError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  // Filter state
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterTanggalMulai, setFilterTanggalMulai] = useState("");
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState("");

  // Customer list for dropdown
  const [customers, setCustomers] = useState<string[]>([]);

  useEffect(() => {
    const storedCabang = localStorage.getItem("cabang") || "";
    setCabang(storedCabang);

    if (storedCabang) {
      // Load transaksi output
      const q = query(
        collection(db, "cabang", storedCabang, "transaksi"),
        where("type", "==", "output"),
        orderBy("timestamp", "desc")
      );

      const unsubscribeTransaksi = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TransaksiItem[];
        setRiwayatPenjualan(data);

        // Extract unique customers
        const uniqueCustomers = Array.from(new Set(data.map((t) => t.tujuanCustomer).filter(Boolean)));
        setCustomers(uniqueCustomers as string[]);

        setLoading(false);
      });

      return () => unsubscribeTransaksi();
    }
  }, []);

  // Filter data
  const filteredData = riwayatPenjualan.filter((item) => {
    // Filter by customer
    if (filterCustomer && item.tujuanCustomer !== filterCustomer) {
      return false;
    }

    // Filter by date range
    if (filterTanggalMulai || filterTanggalAkhir) {
      const itemDate = item.timestamp?.toDate?.() || new Date(item.timestamp);
      const itemDateStr = itemDate.toISOString().split("T")[0];

      if (filterTanggalMulai && itemDateStr < filterTanggalMulai) {
        return false;
      }
      if (filterTanggalAkhir && itemDateStr > filterTanggalAkhir) {
        return false;
      }
    }

    return true;
  });

  // Hitung total
  const totalPenjualan = filteredData.reduce((sum, item) => {
    const harga = item.hargaJualSatuan || 0;
    return sum + (item.jumlah * harga);
  }, 0);

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

  const exportToExcel = () => {
    if (filteredData.length === 0) {
      notifyError("Tidak ada data untuk diexport");
      return;
    }

    // Prepare data for Excel
    const excelData = filteredData.map((item) => {
      const date = item.timestamp?.toDate?.() || new Date(item.timestamp);
      const totalHarga = (item.hargaJualSatuan || 0) * item.jumlah;

      return {
        "Tanggal & Waktu": date.toLocaleString("id-ID"),
        "Nama Produk": item.namaProduk,
        "Jumlah": item.jumlah,
        "Satuan": item.satuan,
        "Harga Jual Satuan": item.hargaJualSatuan?.toLocaleString("id-ID") || 0,
        "Total Harga": totalHarga.toLocaleString("id-ID"),
        "Nama Customer": item.tujuanCustomer || "-",
        "User": item.user,
      };
    });

    // Add total row
    excelData.push({
      "Tanggal & Waktu": "",
      "Nama Produk": "",
      "Jumlah": 0,
      "Satuan": "",
      "Harga Jual Satuan": "TOTAL",
      "Total Harga": totalPenjualan.toLocaleString("id-ID"),
      "Nama Customer": "",
      "User": "",
    } as any);

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Penjualan");

    // Set column widths
    ws["!cols"] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
    ];

    // Generate filename
    let filename = "Riwayat_Penjualan";
    if (filterCustomer) {
      filename += `_${filterCustomer.replace(/\s+/g, "_")}`;
    }
    if (filterTanggalMulai && filterTanggalAkhir) {
      filename += `_${filterTanggalMulai}_sd_${filterTanggalAkhir}`;
    } else if (filterTanggalMulai) {
      filename += `_${filterTanggalMulai}`;
    } else if (filterTanggalAkhir) {
      filename += `_sd_${filterTanggalAkhir}`;
    }
    filename += `_${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-[#B23A34] text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in flex items-center gap-3">
          <IconAlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3060] to-[#0B1424] rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <IconWallet className="w-6 h-6" />
          Riwayat Penjualan
        </h2>
        <p className="mt-2 text-sm text-slate-300">Data transaksi output barang</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-[#DDE3EE]">
        <h3 className="text-lg font-bold text-[#0B1424] mb-4 flex items-center gap-2">
          <IconFilter className="w-4 h-4 text-[#1B3060]" />
          Filter Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#0B1424] mb-2">
              Filter Customer
            </label>
            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] bg-white"
            >
              <option value="">Semua Customer</option>
              {customers.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0B1424] mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filterTanggalMulai}
              onChange={(e) => setFilterTanggalMulai(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0B1424] mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={filterTanggalAkhir}
              onChange={(e) => setFilterTanggalAkhir(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] font-medium"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setFilterCustomer("");
              setFilterTanggalMulai("");
              setFilterTanggalAkhir("");
            }}
            className="px-4 py-2.5 bg-[#EEF1F7] hover:bg-[#E0E6F2] text-[#0B1424] rounded-xl font-semibold transition flex items-center gap-2"
          >
            <IconRotateCcw className="w-4 h-4" /> Reset Filter
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2.5 bg-gradient-to-r from-[#B8892B] to-[#8A6317] hover:shadow-lg text-white rounded-xl font-semibold transition flex items-center gap-2 shadow-md"
          >
            <IconDownload className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Total Penjualan */}
      <div className="bg-gradient-to-r from-[#1B3060] to-[#0B1424] rounded-2xl shadow-xl p-6 text-white">
        <div className="text-sm font-semibold text-slate-300 mb-1">Total Penjualan</div>
        <div className="text-4xl font-bold">
          Rp {totalPenjualan.toLocaleString("id-ID")}
        </div>
      </div>

      {/* Table Riwayat Penjualan */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-[#DDE3EE]">
        {loading ? (
          <div className="text-center py-12">
            <IconLoader className="w-10 h-10 mx-auto mb-3 text-[#1B3060]" />
            <div className="text-slate-500 font-medium">Loading data...</div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <IconPackageEmpty className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <div className="text-slate-500 font-medium">
              {filterCustomer || filterTanggalMulai || filterTanggalAkhir
                ? "Data penjualan tidak ditemukan"
                : "Belum ada transaksi penjualan"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-[#DDE3EE] shadow-sm">
            <table className="min-w-full divide-y divide-[#EEF1F7] bg-white">
              <thead>
                <tr className="bg-[#F7F8FB]">
                  <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tanggal &amp; Waktu
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                    Nama Produk
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                    Jumlah
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                    Harga Jual Satuan
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                    Total Harga
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                    Customer
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F8] bg-white">
                {filteredData.map((item) => {
                  const totalHarga = (item.hargaJualSatuan || 0) * item.jumlah;
                  return (
                    <tr
                      key={item.id}
                      className="bg-white hover:bg-[#F7F8FB] transition"
                    >
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {formatDate(item.timestamp)}
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#0B1424] text-sm">
                        {item.namaProduk}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#0B1424]">
                        {item.jumlah}{" "}
                        <span className="text-slate-500 font-semibold">{item.satuan}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        {typeof item.hargaJualSatuan === "number"
                          ? `Rp ${item.hargaJualSatuan.toLocaleString("id-ID")}`
                          : "-"}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#1F7A4D] text-sm">
                        Rp {totalHarga.toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm font-medium">
                        {item.tujuanCustomer || "-"}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {item.user}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}