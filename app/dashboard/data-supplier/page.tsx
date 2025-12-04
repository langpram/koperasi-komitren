"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import * as XLSX from "xlsx";

interface Supplier {
  id: string;
  nama: string;
  kontak: string;
  alamat: string;
  jenisBarang: string;
  maksimumPengiriman: string;
  createdAt: any;
}

interface ExcelRow {
  Nama?: string;
  Kontak?: string | number;
  Alamat?: string;
  "Jenis Barang"?: string;
  "Maksimum Pengiriman"?: string;
}

export default function DataSupplierPage() {
  const [cabang, setCabang] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nama: "",
    kontak: "",
    alamat: "",
    jenisBarang: "",
    maksimumPengiriman: "",
  });

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Move loadSuppliers BEFORE useEffect
  const loadSuppliers = (cabangName: string) => {
    setLoading(true);
    const q = query(collection(db, "cabang", cabangName, "suppliers"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Supplier[];

      // Sort by created date (newest first)
      const getMillis = (t: any): number => {
        if (!t) return 0;
        if (typeof t === "number") return t;
        if (typeof t === "object") {
          const maybeFn = (t as any).toMillis;
          if (typeof maybeFn === "function") {
            try { return maybeFn.call(t); } catch { return 0; }
          }
          const seconds = (t as any).seconds;
          if (typeof seconds === "number") return seconds * 1000;
          if (t instanceof Date) return t.getTime();
        }
        if (typeof t === "string") {
          const parsed = Date.parse(t);
          return Number.isFinite(parsed) ? parsed : 0;
        }
        return 0;
      };
      data.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));

      setSuppliers(data);
      setFilteredSuppliers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  useEffect(() => {
    const storedCabang = localStorage.getItem("cabang") || "";
    setCabang(storedCabang);

    if (storedCabang) {
      loadSuppliers(storedCabang);
    }
  }, []);

  useEffect(() => {
    // Filter suppliers based on search (dengan null safety)
    const filtered = suppliers.filter((s) => {
      const searchLower = searchQuery.toLowerCase();
      
      // Pastikan semua field ada dan konversi ke string
      const nama = (s.nama || "").toLowerCase();
      const kontak = (s.kontak || "").toString();
      const jenisBarang = (s.jenisBarang || "").toLowerCase();
      const alamat = (s.alamat || "").toLowerCase();
      
      return (
        nama.includes(searchLower) ||
        kontak.includes(searchQuery) ||
        jenisBarang.includes(searchLower) ||
        alamat.includes(searchLower)
      );
    });
    
    setFilteredSuppliers(filtered);
  }, [searchQuery, suppliers]);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ nama: "", kontak: "", alamat: "", jenisBarang: "", maksimumPengiriman: "" });
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setModalMode("edit");
    setSelectedSupplier(supplier);
    setFormData({
      nama: supplier.nama,
      kontak: supplier.kontak,
      alamat: supplier.alamat,
      jenisBarang: supplier.jenisBarang,
      maksimumPengiriman: supplier.maksimumPengiriman,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSupplier(null);
    setFormData({ nama: "", kontak: "", alamat: "", jenisBarang: "", maksimumPengiriman: "" });
  };

  const handleSubmit = async () => {
    if (!formData.nama || !formData.kontak) {
      alert("Nama dan Kontak wajib diisi!");
      return;
    }

    try {
      // Convert semua ke UPPERCASE untuk menghindari duplikasi
      const dataToSave = {
        nama: formData.nama.toUpperCase(),
        kontak: formData.kontak,
        alamat: formData.alamat.toUpperCase(),
        jenisBarang: formData.jenisBarang.toUpperCase(),
        maksimumPengiriman: formData.maksimumPengiriman.toUpperCase(),
      };

      if (modalMode === "add") {
        // Add new supplier
        await addDoc(collection(db, "cabang", cabang, "suppliers"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        alert("✅ Supplier berhasil ditambahkan!");
      } else {
        // Update existing supplier
        if (selectedSupplier) {
          await updateDoc(doc(db, "cabang", cabang, "suppliers", selectedSupplier.id), {
            ...dataToSave,
            updatedAt: serverTimestamp(),
          });
          alert("✅ Supplier berhasil diupdate!");
        }
      }
      closeModal();
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("❌ Gagal menyimpan data supplier!");
    }
  };

  const confirmDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;

    try {
      await deleteDoc(doc(db, "cabang", cabang, "suppliers", supplierToDelete.id));
      alert("✅ Supplier berhasil dihapus!");
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("❌ Gagal menghapus supplier!");
    }
  };

  // Download Template Excel
  const downloadTemplate = () => {
    const template = [
      {
        Nama: "PT. CONTOH SUPPLIER",
        Kontak: "081234567890",
        Alamat: "JL. CONTOH NO. 123, JAKARTA",
        "Jenis Barang": "SAYURAN, BUMBU DAPUR",
        "Maksimum Pengiriman": "SENIN & KAMIS",
      },
      {
        Nama: "CV. SUPPLIER DUA",
        Kontak: "082345678901",
        Alamat: "JL. EXAMPLE NO. 456, BANDUNG",
        "Jenis Barang": "DAGING, AYAM",
        "Maksimum Pengiriman": "SELASA & JUMAT",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Supplier");

    // Set column widths
    ws["!cols"] = [
      { wch: 25 }, // Nama
      { wch: 18 }, // Kontak
      { wch: 40 }, // Alamat
      { wch: 30 }, // Jenis Barang
      { wch: 25 }, // Maksimum Pengiriman
    ];

    XLSX.writeFile(wb, "Template_Supplier.xlsx");
  };

  // Import Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

        if (jsonData.length === 0) {
          alert("❌ File Excel kosong!");
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData) {
          try {
            // Validasi kolom yang required
            if (!row.Nama || !row.Kontak) {
              errorCount++;
              continue;
            }

            await addDoc(collection(db, "cabang", cabang, "suppliers"), {
              nama: String(row.Nama || "").toUpperCase(),
              kontak: String(row.Kontak || ""),
              alamat: String(row.Alamat || "").toUpperCase(),
              jenisBarang: String(row["Jenis Barang"] || "").toUpperCase(),
              maksimumPengiriman: String(row["Maksimum Pengiriman"] || "").toUpperCase(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            successCount++;
          } catch (error) {
            console.error("Error importing row:", error);
            errorCount++;
          }
        }

        alert(
          `✅ Import selesai!\n\nBerhasil: ${successCount}\nGagal: ${errorCount}`
        );
      } catch (error) {
        console.error("Error reading Excel:", error);
        alert("❌ Gagal membaca file Excel!");
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = ""; // Reset input
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredSuppliers.length === 0) {
      alert("❌ Tidak ada data untuk diekspor!");
      return;
    }

    const exportData = filteredSuppliers.map((s, index) => ({
      No: index + 1,
      Nama: s.nama,
      Kontak: s.kontak,
      Alamat: s.alamat,
      "Jenis Barang": s.jenisBarang,
      "Maksimum Pengiriman": s.maksimumPengiriman,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Supplier");

    // Set column widths
    ws["!cols"] = [
      { wch: 5 },  // No
      { wch: 25 }, // Nama
      { wch: 18 }, // Kontak
      { wch: 40 }, // Alamat
      { wch: 30 }, // Jenis Barang
      { wch: 25 }, // Maksimum Pengiriman
    ];

    const fileName = `Data_Supplier_${cabang}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <span className="text-3xl">👥</span>
          Data Supplier
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Cari supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 rounded-xl text-black font-medium outline-none focus:ring-4 focus:ring-purple-300 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={openAddModal}
              className="flex-1 px-4 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition shadow-md"
            >
              ➕ Tambah
            </button>
            <button
              onClick={downloadTemplate}
              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition shadow-md"
            >
              📥 Template
            </button>
            <label className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition shadow-md text-center cursor-pointer">
              📤 Import
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>
            <button
              onClick={exportToExcel}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition shadow-md"
            >
              📊 Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-purple-500">
          <div className="text-sm font-semibold text-black mb-1">Total Supplier</div>
          <div className="text-3xl font-bold text-black">{suppliers.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-blue-500">
          <div className="text-sm font-semibold text-black mb-1">Hasil Pencarian</div>
          <div className="text-3xl font-bold text-black">{filteredSuppliers.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-green-500">
          <div className="text-sm font-semibold text-black mb-1">Status</div>
          <div className="text-lg font-bold text-green-600">✅ Real-time Sync</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">⏳</div>
            <div className="text-black font-medium">Loading data supplier...</div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📭</div>
            <div className="text-black font-medium">
              {searchQuery ? "Supplier tidak ditemukan" : "Belum ada data supplier"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-4 px-4 font-bold text-black">No</th>
                  <th className="text-left py-4 px-4 font-bold text-black">Nama Supplier</th>
                  <th className="text-left py-4 px-4 font-bold text-black">Kontak</th>
                  <th className="text-left py-4 px-4 font-bold text-black">Alamat</th>
                  <th className="text-left py-4 px-4 font-bold text-black">Jenis Barang</th>
                  <th className="text-left py-4 px-4 font-bold text-black">Max. Pengiriman</th>
                  <th className="text-left py-4 px-4 font-bold text-black">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier, index) => (
                  <tr
                    key={supplier.id}
                    className="border-b border-gray-100 hover:bg-purple-50 transition"
                  >
                    <td className="py-4 px-4 font-semibold text-black">{index + 1}</td>
                    <td className="py-4 px-4 font-bold text-black">{supplier.nama}</td>
                    <td className="py-4 px-4 text-black">
                      <a
                        href={`tel:${supplier.kontak}`}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        📞 {supplier.kontak}
                      </a>
                    </td>
                    <td className="py-4 px-4 text-black text-sm">{supplier.alamat}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                        {supplier.jenisBarang}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                        {supplier.maksimumPengiriman || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition text-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(supplier)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition text-sm"
                        >
                          🗑️ Hapus
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
              <span className="text-3xl">{modalMode === "add" ? "➕" : "✏️"}</span>
              {modalMode === "add" ? "Tambah Supplier Baru" : "Edit Supplier"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Nama Supplier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-purple-500 outline-none transition text-black uppercase"
                  placeholder="MASUKKAN NAMA SUPPLIER..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Kontak <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.kontak}
                  onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-purple-500 outline-none transition text-black"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">Alamat</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-purple-500 outline-none transition text-black uppercase"
                  placeholder="MASUKKAN ALAMAT LENGKAP..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Jenis Barang
                </label>
                <input
                  type="text"
                  value={formData.jenisBarang}
                  onChange={(e) => setFormData({ ...formData, jenisBarang: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-purple-500 outline-none transition text-black uppercase"
                  placeholder="CONTOH: SAYURAN, BUMBU DAPUR, DAGING"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Maksimum Pengiriman
                </label>
                <input
                  type="text"
                  value={formData.maksimumPengiriman}
                  onChange={(e) => setFormData({ ...formData, maksimumPengiriman: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-purple-500 outline-none transition text-black uppercase"
                  placeholder="CONTOH: SENIN & KAMIS"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-bold transition"
                >
                  💾 Simpan
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-black py-3 rounded-xl font-bold transition"
                >
                  ❌ Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && supplierToDelete && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-black mb-2">Konfirmasi Hapus</h3>
              <p className="text-black mb-6">
                Yakin ingin menghapus supplier <strong>{supplierToDelete.nama}</strong>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition"
                >
                  🗑️ Hapus
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-black py-3 rounded-xl font-bold transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}