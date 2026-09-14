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

/* ============================================================
   ICON SET — konsisten dengan halaman Beranda / Data Customer
   ============================================================ */
type IconProps = { className?: string };

const IconTruck = ({ className = "w-6 h-6" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6h11v10H2z" />
    <path d="M13 10h4l3.5 3.5V16H13z" />
    <circle cx="6" cy="18" r="1.75" />
    <circle cx="16.5" cy="18" r="1.75" />
  </svg>
);

const IconPlus = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconFileDown = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8l-4-5Z" />
    <path d="M13 3v5h5" />
    <path d="M12 12v6M9.5 15.5 12 18l2.5-2.5" />
  </svg>
);

const IconUpload = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16V4M8 8l4-4 4 4" />
    <path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
  </svg>
);

const IconDownload = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M4 19h16" />
  </svg>
);

const IconSearch = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const IconPencil = ({ className = "w-3.5 h-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h4L18.5 9.5a2.121 2.121 0 0 0-3-3L5 17v3Z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

const IconTrash = ({ className = "w-3.5 h-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16" />
    <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const IconPhone = ({ className = "w-3.5 h-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 4h3.2l1.3 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.3v3.2a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3 5.6 1.5 1.5 0 0 1 4.5 4Z" />
  </svg>
);

const IconInfo = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
);

const IconAlertCircle = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
  </svg>
);

const IconAlertTriangle = ({ className = "w-9 h-9" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const IconCheckCircle = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 5-5" />
  </svg>
);

const IconSpinner = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconSave = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
    <path d="M8 4v5h7V4" />
    <path d="M7 13h10v7H7z" />
  </svg>
);

const IconX = ({ className = "w-6 h-6" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
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

export default function DataSupplierPage() {
  const [cabang, setCabang] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Toast notifications — konsisten dengan Beranda / Data Customer
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const notifySuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };
  const notifyError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

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
  // Prevent double submit
  const [isSaving, setIsSaving] = useState(false);

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
      notifyError("Nama dan Kontak wajib diisi!");
      return;
    }

    try {
      setIsSaving(true);
      const normalizedNama = (formData.nama || "").trim().toUpperCase();
      const originalNama = (formData.nama || "").trim();
      const dataToSave = {
        nama: normalizedNama,
        kontak: formData.kontak,
        alamat: (formData.alamat || "").trim().toUpperCase(),
        jenisBarang: (formData.jenisBarang || "").trim().toUpperCase(),
        maksimumPengiriman: (formData.maksimumPengiriman || "").trim().toUpperCase(),
      };

      if (modalMode === "add") {
        // Cek duplikasi berdasarkan nama uppercase dan fallback nama asli (untuk data lama)
        const dupQueryUpper = query(
          collection(db, "cabang", cabang, "suppliers"),
          where("nama", "==", normalizedNama)
        );
        const dupSnapUpper = await getDocs(dupQueryUpper);
        let isDup = !dupSnapUpper.empty;
        if (!isDup) {
          const dupQueryRaw = query(
            collection(db, "cabang", cabang, "suppliers"),
            where("nama", "==", originalNama)
          );
          const dupSnapRaw = await getDocs(dupQueryRaw);
          isDup = !dupSnapRaw.empty;
        }
        if (isDup) {
          notifyError("Supplier dengan nama tersebut sudah ada. Silakan gunakan menu Edit.");
          setIsSaving(false);
          return;
        }
        await addDoc(collection(db, "cabang", cabang, "suppliers"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        notifySuccess("Supplier berhasil ditambahkan!");
      } else {
        // Update existing supplier dengan cek duplikasi jika mengubah nama
        if (selectedSupplier) {
          const dupQueryUpper = query(
            collection(db, "cabang", cabang, "suppliers"),
            where("nama", "==", normalizedNama)
          );
          const dupSnapUpper = await getDocs(dupQueryUpper);
          let hasOther = dupSnapUpper.docs.some((d) => d.id !== selectedSupplier.id);
          if (!hasOther) {
            const dupQueryRaw = query(
              collection(db, "cabang", cabang, "suppliers"),
              where("nama", "==", originalNama)
            );
            const dupSnapRaw = await getDocs(dupQueryRaw);
            hasOther = dupSnapRaw.docs.some((d) => d.id !== selectedSupplier.id);
          }
          if (hasOther) {
            notifyError("Nama supplier sudah digunakan oleh entri lain.");
            setIsSaving(false);
            return;
          }
          await updateDoc(doc(db, "cabang", cabang, "suppliers", selectedSupplier.id), {
            ...dataToSave,
            updatedAt: serverTimestamp(),
          });
          notifySuccess("Supplier berhasil diupdate!");
        }
      }
      setIsSaving(false);
      closeModal();
    } catch (error) {
      console.error("Error saving supplier:", error);
      setIsSaving(false);
      notifyError("Gagal menyimpan data supplier!");
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
      notifySuccess("Supplier berhasil dihapus!");
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    } catch (error) {
      console.error("Error deleting supplier:", error);
      notifyError("Gagal menghapus supplier!");
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
        "Maksimum Pengiriman": "FULL/10 KG",
      },
      {
        Nama: "CV. SUPPLIER DUA",
        Kontak: "082345678901",
        Alamat: "JL. EXAMPLE NO. 456, BANDUNG",
        "Jenis Barang": "DAGING, AYAM",
        "Maksimum Pengiriman": "FULL/10 KG",
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
          notifyError("File Excel kosong!");
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

        notifySuccess(`Import selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`);
      } catch (error) {
        console.error("Error reading Excel:", error);
        notifyError("Gagal membaca file Excel!");
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = ""; // Reset input
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredSuppliers.length === 0) {
      notifyError("Tidak ada data untuk diekspor!");
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
      {/* Toast Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-[#B23A34] text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in flex items-center gap-3">
          <IconAlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-[#1F7A4D] text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in flex items-center gap-3">
          <IconCheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="bg-gradient-to-r from-[#1B3060] to-[#0B1424] rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
          <IconTruck className="w-6 h-6" />
          Data Supplier
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Bar */}
          <div className="relative">
            <IconSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-slate-300 font-medium outline-none focus:ring-4 focus:ring-white/30 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={openAddModal}
              className="flex-1 px-4 py-3 bg-white text-[#1B3060] rounded-xl font-bold hover:bg-[#EEF1F7] transition shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <IconPlus className="w-4 h-4" /> Tambah
            </button>
            <button
              onClick={downloadTemplate}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold hover:bg-white/20 transition shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <IconFileDown className="w-4 h-4" /> Template
            </button>
            <label className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold hover:bg-white/20 transition shadow-md text-center cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap">
              <IconUpload className="w-4 h-4" /> Import
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>
            <button
              onClick={exportToExcel}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#B8892B] to-[#8A6317] text-white rounded-xl font-bold hover:shadow-lg transition shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <IconDownload className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-[#DDE3EE] border-l-4 border-l-[#1B3060]">
          <div className="text-sm font-semibold text-slate-500 mb-1">Total Supplier</div>
          <div className="text-3xl font-bold text-[#0B1424]">{suppliers.length}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-[#DDE3EE] border-l-4 border-l-[#B8892B]">
          <div className="text-sm font-semibold text-slate-500 mb-1">Hasil Pencarian</div>
          <div className="text-3xl font-bold text-[#0B1424]">{filteredSuppliers.length}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-[#DDE3EE] border-l-4 border-l-[#1F7A4D]">
          <div className="text-sm font-semibold text-slate-500 mb-1">Status</div>
          <div className="text-lg font-bold text-[#1F7A4D] flex items-center gap-2">
            <IconCheckCircle className="w-5 h-5" /> Real-time Sync
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-[#DDE3EE]">
        {loading ? (
          <div className="text-center py-12">
            <IconLoader className="w-10 h-10 mx-auto mb-3 text-[#1B3060]" />
            <div className="text-slate-500 font-medium">Loading data supplier...</div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <IconPackageEmpty className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <div className="text-slate-500 font-medium">
              {searchQuery ? "Supplier tidak ditemukan" : "Belum ada data supplier"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-[#DDE3EE] shadow-sm">
            <table className="min-w-full divide-y divide-[#EEF1F7] bg-white">
              <thead>
                <tr className="bg-[#F7F8FB]">
                  <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">No</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">Nama Supplier</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">Kontak</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">Alamat</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">Jenis Barang</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">Max. Pengiriman</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F8] bg-white">
                {filteredSuppliers.map((supplier, index) => (
                  <tr
                    key={supplier.id}
                    className="bg-white hover:bg-[#F7F8FB] transition"
                  >
                    <td className="py-4 px-4 font-semibold text-slate-600">{index + 1}</td>
                    <td className="py-4 px-4 font-semibold text-[#0B1424] text-sm">{supplier.nama}</td>
                    <td className="py-4 px-4">
                      <a
                        href={`tel:${supplier.kontak}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF1F7] hover:bg-[#E0E6F2] text-[#1B3060] rounded-lg text-xs font-semibold transition"
                      >
                        <IconPhone className="w-3.5 h-3.5" /> {supplier.kontak}
                      </a>
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm">{supplier.alamat}</td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-[#EEF1F7] text-[#1B3060] border border-[#DDE3EE] rounded-lg text-xs font-bold">
                        {supplier.jenisBarang}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-[#F7EEDD] text-[#8A6317] border border-[#EBD9B4] rounded-lg text-xs font-bold">
                        {supplier.maksimumPengiriman || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="px-3 py-1.5 border border-[#1B3060] text-[#1B3060] hover:bg-[#EEF1F7] rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <IconPencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(supplier)}
                          className="px-3 py-1.5 bg-[#B23A34] hover:bg-[#8f2d28] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <IconTrash className="w-3.5 h-3.5" /> Hapus
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-[#0B1424]/30 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#0B1424] flex items-center gap-3">
                {modalMode === "add" ? (
                  <IconPlus className="w-5 h-5 text-[#1B3060]" />
                ) : (
                  <IconPencil className="w-5 h-5 text-[#1B3060]" />
                )}
                {modalMode === "add" ? "Tambah Supplier Baru" : "Edit Supplier"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-[#0B1424] transition">
                <IconX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Nama Supplier <span className="text-[#B23A34]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] uppercase"
                  placeholder="Masukkan nama supplier..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Kontak <span className="text-[#B23A34]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.kontak}
                  onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">Alamat</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] uppercase"
                  placeholder="Masukkan alamat lengkap..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Jenis Barang
                </label>
                <input
                  type="text"
                  value={formData.jenisBarang}
                  onChange={(e) => setFormData({ ...formData, jenisBarang: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] uppercase"
                  placeholder="Contoh: Sayuran, Bumbu Dapur, Daging"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Maksimum Pengiriman
                </label>
                <input
                  type="text"
                  value={formData.maksimumPengiriman}
                  onChange={(e) => setFormData({ ...formData, maksimumPengiriman: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] uppercase"
                  placeholder="Contoh: Full/10 KG"
                />
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <IconInfo className="w-3.5 h-3.5 text-[#1B3060] shrink-0" />
                Nama, alamat, dan jenis barang otomatis disimpan dalam huruf kapital
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 bg-[#EEF1F7] hover:bg-[#E0E6F2] text-[#0B1424] rounded-xl font-bold transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1B3060] to-[#0B1424] hover:from-[#0B1424] hover:to-[#060D1A] disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-bold transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <IconSpinner className="w-4 h-4" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <IconSave className="w-4 h-4" /> Simpan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && supplierToDelete && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-[#0B1424]/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F7E7E6] text-[#B23A34] flex items-center justify-center">
                <IconAlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[#0B1424] mb-2">Konfirmasi Hapus</h3>
              <p className="text-slate-500 mb-6">
                Yakin ingin menghapus supplier{" "}
                <strong className="text-[#0B1424]">{supplierToDelete.nama}</strong>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-[#EEF1F7] hover:bg-[#E0E6F2] text-[#0B1424] py-3 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-[#B23A34] hover:bg-[#8f2d28] text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  <IconTrash className="w-4 h-4" /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}