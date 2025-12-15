"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { X } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

interface TransaksiItem {
  id: string;
  type: string;
  namaProduk: string;
  namaSupplier?: string;
  jumlah: number;
  satuan: string;
  timestamp: Timestamp | Date | string | number;
  user: string;
  tanggalMasuk?: string;
  hargaBeliSatuan?: number;
  hargaJualSatuan?: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  riwayat: TransaksiItem[];
}

type ExportType = "hari" | "range" | "bulan" | "tahun";

export default function ExportModal({
  isOpen,
  onClose,
  riwayat,
}: ExportModalProps) {
  const [exportType, setExportType] = useState<ExportType>("hari");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [isLoading, setIsLoading] = useState(false);

  const formatDateToTimestamp = (dateString: string): Date => {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getFilteredData = (): TransaksiItem[] => {
    let filtered = [...riwayat];

    if (exportType === "hari") {
      const targetDate = formatDateToTimestamp(selectedDate);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filtered = filtered.filter((item) => {
        const itemDate = (item.timestamp && typeof item.timestamp === 'object' && 'toDate' in item.timestamp) 
          ? (item.timestamp as any).toDate() 
          : new Date(item.timestamp);
        return itemDate >= targetDate && itemDate < nextDay;
      });
    } else if (exportType === "range") {
      const start = formatDateToTimestamp(startDate);
      const end = formatDateToTimestamp(endDate);
      end.setDate(end.getDate() + 1);

      filtered = filtered.filter((item) => {
        const itemDate = (item.timestamp && typeof item.timestamp === 'object' && 'toDate' in item.timestamp) 
          ? (item.timestamp as any).toDate() 
          : new Date(item.timestamp);
        return itemDate >= start && itemDate < end;
      });
    } else if (exportType === "bulan") {
      const [year, month] = selectedMonth.split("-").map(Number);
      filtered = filtered.filter((item) => {
        const itemDate = (item.timestamp && typeof item.timestamp === 'object' && 'toDate' in item.timestamp) 
          ? (item.timestamp as any).toDate() 
          : new Date(item.timestamp);
        return (
          itemDate.getFullYear() === year && itemDate.getMonth() === month - 1
        );
      });
    } else if (exportType === "tahun") {
      const year = parseInt(selectedYear);
      filtered = filtered.filter((item) => {
        const itemDate = (item.timestamp && typeof item.timestamp === 'object' && 'toDate' in item.timestamp) 
          ? (item.timestamp as any).toDate() 
          : new Date(item.timestamp);
        return itemDate.getFullYear() === year;
      });
    }

    return filtered;
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);

      const filteredData = getFilteredData();

      if (filteredData.length === 0) {
        alert("Tidak ada data transaksi untuk periode yang dipilih");
        return;
      }

      // Format data untuk Excel
      const excelData = filteredData.map((item) => ({
        Waktu:
          item.timestamp && typeof item.timestamp === "object" && "toDate" in item.timestamp
            ? (item.timestamp as any).toDate().toLocaleString("id-ID")
            : new Date(item.timestamp).toLocaleString("id-ID"),
        Type: item.type === "input" ? "INPUT" : "OUTPUT",
        "Nama Produk": item.namaProduk || "-",
        Supplier: item.namaSupplier || "-",
        Jumlah: item.jumlah,
        Satuan: item.satuan || "-",
        "Harga Beli (Satuan)": item.hargaBeliSatuan || "-",
        "Harga Jual (Satuan)": item.hargaJualSatuan || "-",
        User: item.user || "-",
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Riwayat Transaksi");

      // Set column widths
      ws["!cols"] = [
        { wch: 20 },
        { wch: 10 },
        { wch: 20 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 18 },
        { wch: 18 },
        { wch: 12 },
      ];

      // Generate filename
      let filename = "Riwayat-Transaksi";
      if (exportType === "hari") {
        filename += `-${selectedDate}`;
      } else if (exportType === "range") {
        filename += `-${startDate}-s.d-${endDate}`;
      } else if (exportType === "bulan") {
        filename += `-${selectedMonth}`;
      } else if (exportType === "tahun") {
        filename += `-${selectedYear}`;
      }
      filename += ".xlsx";

      // Write file
      XLSX.writeFile(wb, filename);

      alert(
        `✅ Export berhasil! ${filteredData.length} baris data telah diekspor.`
      );
      onClose();
    } catch (error) {
      console.error("Error exporting:", error);
      alert("❌ Terjadi kesalahan saat export");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredCount = getFilteredData().length;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            📥 Export Riwayat Transaksi
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-500 hover:bg-white hover:bg-opacity-10 p-1 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Pilih Periode Export
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "hari" as ExportType,
                  label: "📅 Export Hari Spesifik",
                },
                {
                  value: "range" as ExportType,
                  label: "📆 Export Range Tanggal",
                },
                { value: "bulan" as ExportType, label: "📊 Export Per Bulan" },
                { value: "tahun" as ExportType, label: "📈 Export Per Tahun" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition"
                  style={{
                    borderColor:
                      exportType === option.value ? "#3b82f6" : undefined,
                    backgroundColor:
                      exportType === option.value ? "#eff6ff" : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="exportType"
                    value={option.value}
                    checked={exportType === option.value}
                    onChange={(e) =>
                      setExportType(e.target.value as ExportType)
                    }
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-medium text-gray-700">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional Date Inputs */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            {exportType === "hari" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Tanggal
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            )}

            {exportType === "range" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </>
            )}

            {exportType === "bulan" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Bulan & Tahun
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            )}

            {exportType === "tahun" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Tahun
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  min="2000"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            )}
          </div>

          {/* Preview Count */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-blue-700">
                Data yang akan diekspor:
              </span>
              <br />
              <span className="text-lg font-bold text-blue-600">
                {filteredCount} transaksi
              </span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleExport}
              disabled={isLoading || filteredCount === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? "Sedang Export..." : "📥 Export Excel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
