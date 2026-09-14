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

/* ============================================================
   ICON SET — konsisten dengan halaman Beranda (navy/putih, line icon)
   ============================================================ */
type IconProps = { className?: string };

const IconUsers = ({ className = "w-6 h-6" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.25" />
    <path d="M2.75 19c0-3 2.8-5 6.25-5s6.25 2 6.25 5" />
    <path d="M15.5 5.2a3.25 3.25 0 0 1 0 6.1" />
    <path d="M18 14.3c2.6.4 4.25 2 4.25 4.7" />
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

const IconWhatsapp = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.02 2C6.5 2 2.02 6.48 2.02 12c0 1.86.5 3.6 1.4 5.1L2 22l5.05-1.36A9.94 9.94 0 0 0 12.02 22C17.55 22 22 17.52 22 12S17.55 2 12.02 2Zm0 2c4.42 0 8 3.58 8 8s-3.58 8-8 8a7.9 7.9 0 0 1-4.03-1.1l-.29-.17-3 .81.8-2.93-.19-.3A7.93 7.93 0 0 1 4.02 12c0-4.42 3.58-8 8-8Zm-2.2 3.3c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.4 0 1.4 1.02 2.77 1.16 2.96.14.19 1.98 3.02 4.8 4.11 2.36.92 2.84.74 3.36.7.52-.05 1.68-.69 1.92-1.35.24-.66.24-1.23.17-1.35-.07-.12-.26-.19-.55-.34-.29-.15-1.68-.83-1.94-.92-.26-.1-.45-.15-.64.15-.19.29-.74.92-.91 1.11-.17.19-.34.22-.62.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.7-1.61-1.99-.17-.29-.02-.44.13-.59.13-.13.29-.34.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.62-1.55-.87-2.12-.22-.53-.45-.47-.62-.48h-.51Z" />
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

export default function DataCustomerPage() {
  const [cabang, setCabang] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Toast notifications — konsisten dengan Beranda
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
      notifyError("Nama dan No Telepon wajib diisi!");
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
          notifyError("Customer dengan nama tersebut sudah ada. Silakan gunakan menu Edit.");
          setIsSaving(false);
          return;
        }
        await addDoc(collection(db, "cabang", cabang, "customers"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        notifySuccess("Customer berhasil ditambahkan!");
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
            notifyError("Nama customer sudah digunakan oleh entri lain.");
            setIsSaving(false);
            return;
          }
          await updateDoc(doc(db, "cabang", cabang, "customers", selectedCustomer.id), {
            ...dataToSave,
            updatedAt: serverTimestamp(),
          });
          notifySuccess("Customer berhasil diupdate!");
        }
      }
      setIsSaving(false);
      closeModal();
    } catch (error) {
      console.error("Error saving customer:", error);
      setIsSaving(false);
      notifyError("Gagal menyimpan data customer!");
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
      notifySuccess("Customer berhasil dihapus!");
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      notifyError("Gagal menghapus customer!");
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
          notifyError("File Excel kosong!");
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
    if (filteredCustomers.length === 0) {
      notifyError("Tidak ada data untuk diekspor!");
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
          <IconUsers className="w-6 h-6" />
          Data Customer
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Bar */}
          <div className="relative">
            <IconSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari customer..."
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
          <div className="text-sm font-semibold text-slate-500 mb-1">Total Customer</div>
          <div className="text-3xl font-bold text-[#0B1424]">{customers.length}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-[#DDE3EE] border-l-4 border-l-[#B8892B]">
          <div className="text-sm font-semibold text-slate-500 mb-1">Hasil Pencarian</div>
          <div className="text-3xl font-bold text-[#0B1424]">{filteredCustomers.length}</div>
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
            <div className="text-slate-500 font-medium">Loading data customer...</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <IconPackageEmpty className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <div className="text-slate-500 font-medium">
              {searchQuery ? "Customer tidak ditemukan" : "Belum ada data customer"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-[#DDE3EE] shadow-sm">
            <table className="min-w-full divide-y divide-[#EEF1F7] bg-white">
              <thead>
                <tr className="bg-[#F7F8FB]">
                  <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">No</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">Nama Customer</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">Alamat</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">No Telepon</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">Produk Dibutuhkan</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0B1424]">Catatan</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F8] bg-white">
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className="bg-white hover:bg-[#F7F8FB] transition"
                  >
                    <td className="py-4 px-4 font-semibold text-slate-600">{index + 1}</td>
                    <td className="py-4 px-4 font-semibold text-[#0B1424] text-sm">{customer.nama}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm">{customer.alamat}</td>
                    <td className="py-4 px-4 text-slate-600">
                      {(() => {
                        // Membersihkan nomor: menghilangkan spasi, strip, dan ubah awalan 0 jadi 62
                        let cleanedNo = customer.noTelepon.replace(/[\s\-]/g, "");
                        if (cleanedNo.startsWith("0")) {
                          cleanedNo = "62" + cleanedNo.slice(1);
                        } else if (!cleanedNo.startsWith("62")) {
                          // Jika tidak mulai dengan 0 atau 62, biarkan saja
                          cleanedNo = customer.noTelepon.replace(/[\s\-]/g, "");
                        }
                        return (
                          <a
                            href={`https://wa.me/${cleanedNo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1F7A4D] hover:bg-[#175c3a] text-white rounded-lg text-xs font-semibold transition shadow-sm"
                          >
                            <IconWhatsapp className="w-3.5 h-3.5" /> {customer.noTelepon}
                          </a>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-[#EEF1F7] text-[#1B3060] border border-[#DDE3EE] rounded-lg text-xs font-bold">
                        {customer.produkDibutuhkan}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm italic">
                      {customer.catatan || "-"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="px-3 py-1.5 border border-[#1B3060] text-[#1B3060] hover:bg-[#EEF1F7] rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <IconPencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(customer)}
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
                {modalMode === "add" ? "Tambah Customer Baru" : "Edit Customer"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-[#0B1424] transition">
                <IconX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Nama Customer <span className="text-[#B23A34]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] uppercase"
                  placeholder="Masukkan nama customer..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">Alamat</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  placeholder="Masukkan alamat lengkap..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  No Telepon <span className="text-[#B23A34]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.noTelepon}
                  onChange={(e) => setFormData({ ...formData, noTelepon: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Produk Dibutuhkan
                </label>
                <input
                  type="text"
                  value={formData.produkDibutuhkan}
                  onChange={(e) => setFormData({ ...formData, produkDibutuhkan: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  placeholder="Contoh: Telur, Sayuran, Daging"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">Catatan</label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  placeholder="Catatan tambahan (opsional)..."
                  rows={2}
                />
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <IconInfo className="w-3.5 h-3.5 text-[#1B3060] shrink-0" />
                Nama customer otomatis disimpan dalam huruf kapital
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
      {showDeleteModal && customerToDelete && (
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
                Yakin ingin menghapus customer{" "}
                <strong className="text-[#0B1424]">{customerToDelete.nama}</strong>?
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