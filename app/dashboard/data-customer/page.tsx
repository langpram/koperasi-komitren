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
  getDocs,
  where,
} from "firebase/firestore";
import * as XLSX from "xlsx";

interface Customer {
  id: string;
  nama: string;
  alamat: string;
  noTelepon: string;
  produkDibutuhkan: string;
  catatan: string;
  createdAt: any;
}

interface ExcelRow {
  Nama?: string;
  Alamat?: string;
  "No Telepon"?: string | number;
  "Produk Dibutuhkan"?: string;
  Catatan?: string;
}

export default function DataCustomerPage() {
  const [cabang, setCabang] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    noTelepon: "",
    produkDibutuhkan: "",
    catatan: "",
  });
  // Prevent double submit
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const loadCustomers = (cabangName: string) => {
    setLoading(true);
    const q = query(collection(db, "cabang", cabangName, "customers"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];

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

      setCustomers(data);
      setFilteredCustomers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  useEffect(() => {
    const storedCabang = localStorage.getItem("cabang") || "";
    setCabang(storedCabang);

    if (storedCabang) {
      loadCustomers(storedCabang);
    }
  }, []);

  useEffect(() => {
    // Filter customers based on search
    const filtered = customers.filter(
      (c) =>
        c.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.noTelepon.includes(searchQuery) ||
        c.produkDibutuhkan.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ nama: "", alamat: "", noTelepon: "", produkDibutuhkan: "", catatan: "" });
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setModalMode("edit");
    setSelectedCustomer(customer);
    setFormData({
      nama: customer.nama,
      alamat: customer.alamat,
      noTelepon: customer.noTelepon,
      produkDibutuhkan: customer.produkDibutuhkan,
      catatan: customer.catatan || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
    setFormData({ nama: "", alamat: "", noTelepon: "", produkDibutuhkan: "", catatan: "" });
  };

  const handleSubmit = async () => {
    if (!formData.nama || !formData.noTelepon) {
      alert("Nama dan No Telepon wajib diisi!");
      return;
    }

    try {
      setIsSaving(true);
      const normalizedNama = (formData.nama || "").trim().toUpperCase();
      const originalNama = (formData.nama || "").trim();
      const dataToSave = {
        nama: normalizedNama,
        alamat: (formData.alamat || "").trim().toUpperCase(),
        noTelepon: (formData.noTelepon || "").toString().trim(),
        produkDibutuhkan: (formData.produkDibutuhkan || "").trim().toUpperCase(),
        catatan: (formData.catatan || "").trim(),
      };

      if (modalMode === "add") {
        // Cek duplikasi berdasarkan nama uppercase dan fallback nama asli (untuk data lama)
        const dupQueryUpper = query(
          collection(db, "cabang", cabang, "customers"),
          where("nama", "==", normalizedNama)
        );
        const dupSnapUpper = await getDocs(dupQueryUpper);
        let isDup = !dupSnapUpper.empty;
        if (!isDup) {
          const dupQueryRaw = query(
            collection(db, "cabang", cabang, "customers"),
            where("nama", "==", originalNama)
          );
          const dupSnapRaw = await getDocs(dupQueryRaw);
          isDup = !dupSnapRaw.empty;
        }
        if (isDup) {
          alert("❗ Customer dengan nama tersebut sudah ada. Silakan gunakan menu Edit.");
          setIsSaving(false);
          return;
        }
        await addDoc(collection(db, "cabang", cabang, "customers"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        alert("✅ Customer berhasil ditambahkan!");
      } else {
        // Update existing customer dengan cek duplikasi jika mengubah nama
        if (selectedCustomer) {
          const dupQueryUpper = query(
            collection(db, "cabang", cabang, "customers"),
            where("nama", "==", normalizedNama)
          );
          const dupSnapUpper = await getDocs(dupQueryUpper);
          let hasOther = dupSnapUpper.docs.some((d) => d.id !== selectedCustomer.id);
          if (!hasOther) {
            const dupQueryRaw = query(
              collection(db, "cabang", cabang, "customers"),
              where("nama", "==", originalNama)
            );
            const dupSnapRaw = await getDocs(dupQueryRaw);
            hasOther = dupSnapRaw.docs.some((d) => d.id !== selectedCustomer.id);
          }
          if (hasOther) {
            alert("❗ Nama customer sudah digunakan oleh entri lain.");
            setIsSaving(false);
            return;
          }
          await updateDoc(doc(db, "cabang", cabang, "customers", selectedCustomer.id), {
            ...dataToSave,
            updatedAt: serverTimestamp(),
          });
          alert("✅ Customer berhasil diupdate!");
        }
      }
      setIsSaving(false);
      closeModal();
    } catch (error) {
      console.error("Error saving customer:", error);
      setIsSaving(false);
      alert("❌ Gagal menyimpan data customer!");
    }
  };

  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    try {
      await deleteDoc(doc(db, "cabang", cabang, "customers", customerToDelete.id));
      alert("✅ Customer berhasil dihapus!");
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("❌ Gagal menghapus customer!");
    }
  };

  // Download Template Excel
  const downloadTemplate = () => {
    const template = [
      {
        Nama: "PT. Contoh Customer",
        Alamat: "Jl. Customer No. 123, Jakarta",
        "No Telepon": "081234567890",
        "Produk Dibutuhkan": "Telur, Sayuran, Daging",
        Catatan: "Pengiriman setiap Senin & Kamis",
      },
      {
        Nama: "Toko Berkah",
        Alamat: "Jl. Example No. 456, Bandung",
        "No Telepon": "082345678901",
        "Produk Dibutuhkan": "Bumbu Dapur, Minyak",
        Catatan: "COD",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Customer");

    // Set column widths
    ws["!cols"] = [
      { wch: 25 }, // Nama
      { wch: 40 }, // Alamat
      { wch: 18 }, // No Telepon
      { wch: 30 }, // Produk Dibutuhkan
      { wch: 35 }, // Catatan
    ];

    XLSX.writeFile(wb, "Template_Customer.xlsx");
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
            if (!row.Nama || !row["No Telepon"]) {
              errorCount++;
              continue;
            }

            await addDoc(collection(db, "cabang", cabang, "customers"), {
              nama: row.Nama || "",
              alamat: row.Alamat || "",
              noTelepon: String(row["No Telepon"] || ""),
              produkDibutuhkan: row["Produk Dibutuhkan"] || "",
              catatan: row.Catatan || "",
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
    if (filteredCustomers.length === 0) {
      alert("❌ Tidak ada data untuk diekspor!");
      return;
    }

    const exportData = filteredCustomers.map((c, index) => ({
      No: index + 1,
      Nama: c.nama,
      Alamat: c.alamat,
      "No Telepon": c.noTelepon,
      "Produk Dibutuhkan": c.produkDibutuhkan,
      Catatan: c.catatan || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Customer");

    // Set column widths
    ws["!cols"] = [
      { wch: 5 },  // No
      { wch: 25 }, // Nama
      { wch: 40 }, // Alamat
      { wch: 18 }, // No Telepon
      { wch: 30 }, // Produk Dibutuhkan
      { wch: 35 }, // Catatan
    ];

    const fileName = `Data_Customer_${cabang}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <span className="text-3xl">👤</span>
          Data Customer
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Cari customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 rounded-xl text-black font-medium outline-none focus:ring-4 focus:ring-teal-300 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={openAddModal}
              className="flex-1 px-4 py-3 bg-white text-teal-600 rounded-xl font-bold hover:bg-teal-50 transition shadow-md"
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
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-teal-500">
          <div className="text-sm font-semibold text-gray-600 mb-1">Total Customer</div>
          <div className="text-3xl font-bold text-gray-900">{customers.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-blue-500">
          <div className="text-sm font-semibold text-gray-600 mb-1">Hasil Pencarian</div>
          <div className="text-3xl font-bold text-gray-900">{filteredCustomers.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-green-500">
          <div className="text-sm font-semibold text-gray-600 mb-1">Status</div>
          <div className="text-lg font-bold text-green-600">✅ Real-time Sync</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">⏳</div>
            <div className="text-gray-500 font-medium">Loading data customer...</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📭</div>
            <div className="text-gray-500 font-medium">
              {searchQuery ? "Customer tidak ditemukan" : "Belum ada data customer"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-bold text-gray-900">No</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Nama Customer</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Alamat</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">No Telepon</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Produk Dibutuhkan</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Catatan</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-teal-50 transition"
                  >
                    <td className="py-4 px-4 font-semibold text-gray-700">{index + 1}</td>
                    <td className="py-4 px-4 font-bold text-gray-900">{customer.nama}</td>
                    <td className="py-4 px-4 text-gray-600 text-sm">{customer.alamat}</td>
                    <td className="py-4 px-4 text-gray-700">
                      <a
                        href={`tel:${customer.noTelepon}`}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        📞 {customer.noTelepon}
                      </a>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-xs font-bold">
                        {customer.produkDibutuhkan}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-sm italic">
                      {customer.catatan || "-"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition text-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(customer)}
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
          className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
              <span className="text-3xl">{modalMode === "add" ? "➕" : "✏️"}</span>
              {modalMode === "add" ? "Tambah Customer Baru" : "Edit Customer"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Nama Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-purple-500 outline-none transition text-black uppercase"
                  placeholder="Masukkan nama customer..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">Alamat</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-purple-500 outline-none transition text-black"
                  placeholder="Masukkan alamat lengkap..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  No Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.noTelepon}
                  onChange={(e) => setFormData({ ...formData, noTelepon: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-purple-500 outline-none transition text-black"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Produk Dibutuhkan
                </label>
                <input
                  type="text"
                  value={formData.produkDibutuhkan}
                  onChange={(e) => setFormData({ ...formData, produkDibutuhkan: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-purple-500 outline-none transition text-black"
                  placeholder="Contoh: Telur, Sayuran, Daging"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">Catatan</label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:border-purple-500 outline-none transition text-black"
                  placeholder="Catatan tambahan (opsional)..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition"
                >
                  {isSaving ? "⏳ Menyimpan..." : "💾 Simpan"}
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
      {showDeleteModal && customerToDelete && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6">
                Yakin ingin menghapus customer <strong>{customerToDelete.nama}</strong>?
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
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-bold transition"
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