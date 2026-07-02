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

export default function RiwayatPenjualanPage() {
  const [cabang, setCabang] = useState("");
  const [riwayatPenjualan, setRiwayatPenjualan] = useState<TransaksiItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      alert("Tidak ada data untuk diexport");
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
        "Customer": item.tujuanCustomer || "-",
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
      "Customer": "",
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
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-3xl">💰</span>
          Riwayat Penjualan
        </h2>
        <p className="mt-2 opacity-90">Data transaksi output barang</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🔍</span>
          Filter Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Filter Customer
            </label>
            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition text-gray-900 bg-white"
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
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filterTanggalMulai}
              onChange={(e) => setFilterTanggalMulai(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={filterTanggalAkhir}
              onChange={(e) => setFilterTanggalAkhir(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition text-gray-900"
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
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition"
          >
            Reset Filter
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition flex items-center gap-2 shadow-lg"
          >
            📥 Export Excel
          </button>
        </div>
      </div>

      {/* Total Penjualan */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="text-sm font-semibold opacity-90 mb-1">Total Penjualan</div>
        <div className="text-4xl font-bold">
          Rp {totalPenjualan.toLocaleString("id-ID")}
        </div>
      </div>

      {/* Table Riwayat Penjualan */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">⏳</div>
              <div className="text-gray-500 font-medium">Loading data...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📦</div>
              <div className="text-gray-500 font-medium">
                {filterCustomer || filterTanggalMulai || filterTanggalAkhir
                  ? "Data penjualan tidak ditemukan"
                  : "Belum ada transaksi penjualan"}
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-bold text-gray-900">
                    Tanggal & Waktu
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">
                    Nama Produk
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">
                    Jumlah
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">
                    Harga Jual Satuan
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">
                    Total Harga
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">
                    Customer
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">
                    User
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const totalHarga = (item.hargaJualSatuan || 0) * item.jumlah;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-purple-50 transition"
                    >
                      <td className="py-4 px-4 text-sm font-medium text-gray-700">
                        {formatDate(item.timestamp)}
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-900">
                        {item.namaProduk}
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900">
                        {item.jumlah} {item.satuan}
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium">
                        {typeof item.hargaJualSatuan === "number"
                          ? `Rp ${item.hargaJualSatuan.toLocaleString("id-ID")}`
                          : "-"}
                      </td>
                      <td className="py-4 px-4 font-bold text-green-600">
                        Rp {totalHarga.toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium">
                        {item.tujuanCustomer || "-"}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 font-medium">
                        {item.user}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}