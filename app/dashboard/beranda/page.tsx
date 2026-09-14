//dashboard/beranda/page.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  where,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import Receipt from "@/components/beranda/Receipt";
import OutputSection from "@/components/beranda/OutputSection";
import ExportModal from "@/components/beranda/ExportModal";

interface CartItem {
  namaProduk: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
}
interface ReceiptData {
  cabang: string;
  items: CartItem[];
  user: string;
  timestamp: Date;
  noStruk: string;
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
  tanggalMasuk?: string;
  hargaBeliSatuan?: number;
  hargaJualSatuan?: number;
}
interface StokItem {
  namaProduk: string;
  totalJumlah: number;
  satuan: string;
}

/* ============================================================
   ICON SET — pengganti emoji, konsisten navy/putih
   ============================================================ */
type IconProps = { className?: string };

const IconTrayIn = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v10M8 9l4 4 4-4" />
    <path d="M4 15h16v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Z" />
  </svg>
);

const IconTrayOut = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V5M8 9l4-4 4 4" />
    <path d="M4 15h16v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Z" />
  </svg>
);

const IconCheckCircle = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 5-5" />
  </svg>
);

const IconAlertCircle = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
  </svg>
);

const IconInfo = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
);

const IconSave = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
    <path d="M8 4v5h7V4" />
    <path d="M7 13h10v7H7z" />
  </svg>
);

const IconSpinner = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconLedger = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20V10M10 20V4M16 20v-7" />
    <path d="M3 20h18" />
  </svg>
);

const IconSearch = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const IconDownload = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M4 19h16" />
  </svg>
);

const IconPackage = ({ className = "w-10 h-10" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </svg>
);

const IconPencil = ({ className = "w-3.5 h-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h4L18.5 9.5a2.121 2.121 0 0 0-3-3L5 17v3Z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

const IconPrinter = ({ className = "w-3.5 h-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9V4h12v5" />
    <rect x="4" y="9" width="16" height="8" rx="1" />
    <path d="M6 17h12v5H6z" />
  </svg>
);

const IconChevronDown = ({ className = "w-3.5 h-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const IconChevronUp = ({ className = "w-3.5 h-3.5" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 15l6-6 6 6" />
  </svg>
);

const IconCornerDownRight = ({ className = "w-3 h-3" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v8a2 2 0 0 0 2 2h10M14 10l4 4-4 4" />
  </svg>
);

const IconX = ({ className = "w-6 h-6" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export default function BerandaPage() {
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const [cabang, setCabang] = useState("");
  const [username, setUsername] = useState("");

  // Form Input State
  const [namaProduk, setNamaProduk] = useState("");
  const [namaSupplier, setNamaSupplier] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [satuan, setSatuan] = useState("KG");
  const [tanggalMasuk, setTanggalMasuk] = useState("");
  const [hargaBeliSatuan, setHargaBeliSatuan] = useState("");
  const [hargaJualSatuan, setHargaJualSatuan] = useState("");
  const [productPrices, setProductPrices] = useState<Record<string, number>>(
    {}
  );

  // Form Output State - KERANJANG
  const [cart, setCart] = useState<CartItem[]>([]);
  const [namaProdukOutput, setNamaProdukOutput] = useState("");
  const [jumlahOutput, setJumlahOutput] = useState("");
  const [satuanOutput, setSatuanOutput] = useState("KG");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null!);
  const [stokData, setStokData] = useState<StokItem[]>([]);
  const [tujuanCustomer, setTujuanCustomer] = useState("");
  const [customers, setCustomers] = useState<{ id: string; nama: string }[]>(
    []
  );

  // State untuk cetak struk dari riwayat
  const [showRiwayatReceipt, setShowRiwayatReceipt] = useState(false);
  const [riwayatReceiptData, setRiwayatReceiptData] = useState<ReceiptData | null>(null);
  const [riwayatTujuanCustomer, setRiwayatTujuanCustomer] = useState("");
  const riwayatReceiptRef = useRef<HTMLDivElement>(null!);

  // Expanded group di riwayat
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // Autocomplete
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<string[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<string[]>([]);

  // Riwayat
  const [riwayat, setRiwayat] = useState<TransaksiItem[]>([]);
  const [searchRiwayat, setSearchRiwayat] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // Modal Edit Transaksi
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaksi, setEditingTransaksi] = useState<TransaksiItem | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // Satuan options
  const [satuanOptions, setSatuanOptions] = useState<string[]>(["KG", "PCS", "LITER", "PACK", "BOX", "KARUNG", "SACHET", "DRG", "POUCH"]);
  const [customSatuan, setCustomSatuan] = useState("");

  const handleAddSatuan = (type: 'input' | 'output') => {
    const val = customSatuan.trim().toUpperCase();
    if (!val) return;
    if (!satuanOptions.includes(val)) {
      setSatuanOptions([...satuanOptions, val]);
    }
    if (type === 'input') {
      setSatuan(val);
    } else {
      setSatuanOutput(val);
    }
    setCustomSatuan("");
  };

  useEffect(() => {
    const storedCabang = localStorage.getItem("cabang") || "";
    const storedUsername = localStorage.getItem("username") || "";
    setCabang(storedCabang);
    setUsername(storedUsername);

    if (storedCabang) {
      loadSuppliers(storedCabang);
      loadCustomers(storedCabang);
      loadProductPrices(storedCabang);

      const q = query(
        collection(db, "cabang", storedCabang, "transaksi"),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<TransaksiItem, "id">),
        })) as TransaksiItem[];
        setRiwayat(data);
      });

      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    const stokMap: { [key: string]: StokItem } = {};
    riwayat.forEach((item: TransaksiItem) => {
      const normalizedName = (item.namaProduk || "").toUpperCase().trim();
      if (!normalizedName) return;

      // Pastikan jumlah adalah angka
      const jumlah = parseFloat(item.jumlah as any) || 0;

      if (!stokMap[normalizedName]) {
        stokMap[normalizedName] = {
          namaProduk: normalizedName,
          totalJumlah: 0,
          satuan: item.satuan || "",
        };
      }
      if (item.type === "input") {
        stokMap[normalizedName].totalJumlah += jumlah;
        stokMap[normalizedName].satuan =
          item.satuan || stokMap[normalizedName].satuan;
      } else if (item.type === "output") {
        stokMap[normalizedName].totalJumlah -= jumlah;
      }
    });
    setStokData(Object.values(stokMap));
  }, [riwayat]);

  const getAvailableFor = (productName: string) => {
    if (!productName) return 0;
    const p = stokData.find((s) => s.namaProduk === productName.toUpperCase());
    if (!p) return 0;
    const inCart = cart
      .filter((c) => c.namaProduk === p.namaProduk)
      .reduce((acc, c) => acc + c.jumlah, 0);
    return p.totalJumlah - inCart;
  };

  const loadSuppliers = async (cabangName: string) => {
    try {
      const snap = await getDocs(
        collection(db, "cabang", cabangName, "suppliers")
      );
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSuppliers(data);
    } catch (e) {
      console.error("Error loading suppliers:", e);
    }
  };

  const loadCustomers = async (cabangName: string) => {
    try {
      const snap = await getDocs(
        collection(db, "cabang", cabangName, "customers")
      );
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      const list = data
        .map((d) => ({ id: d.id, nama: (d.nama || "").toUpperCase() }))
        .filter((d) => d.nama);
      setCustomers(list);
    } catch (e) {
      console.error("Error loading customers:", e);
    }
  };

  const loadProductPrices = async (cabangName: string) => {
    try {
      const snap = await getDocs(
        collection(db, "cabang", cabangName, "produk")
      );
      const map: Record<string, number> = {};
      snap.docs.forEach((doc) => {
        const data = doc.data() as any;
        const name = (data.namaProduk || doc.id || "").toUpperCase();
        if (!name) return;
        if (typeof data.hargaJualSatuan === "number") {
          map[name] = data.hargaJualSatuan;
        }
      });
      setProductPrices(map);
    } catch (e) {
      console.error("Error loading product prices:", e);
    }
  };

  const handleSupplierChange = (value: string) => {
    setNamaSupplier(value);
    if (value.length > 0) {
      const filtered = suppliers.filter((s) =>
        s.nama.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuppliers(filtered);
      setShowSupplierDropdown(true);
      // Jika ada supplier yang namanya cocok persis, siapkan rekomendasi produk
      const normalized = value.trim().toUpperCase();
      const exact = suppliers.find(
        (s) => (s.nama || "").toUpperCase() === normalized
      );
      if (exact) {
        try {
          const recs = computeRecommendedProducts(exact);
          setRecommendedProducts(recs);
        } catch {}
      } else {
        setRecommendedProducts([]);
      }
    } else {
      setShowSupplierDropdown(false);
      setRecommendedProducts([]);
    }
  };

  const selectSupplier = (supplier: any) => {
    setNamaSupplier(supplier.nama);
    setShowSupplierDropdown(false);
    // Hitung rekomendasi produk berdasarkan jenis barang supplier
    try {
      const recs = computeRecommendedProducts(supplier);
      setRecommendedProducts(recs);
      // Jika belum ada nama produk, isi dengan rekomendasi pertama
      if (!namaProduk && recs.length > 0) {
        setNamaProduk(recs[0]);
      }
    } catch {}
  };

  const productOptions = useMemo<string[]>(() => {
    const names = [
      ...stokData.map((s) => s.namaProduk.toUpperCase()),
      ...riwayat.map((r) => (r.namaProduk || "").toUpperCase()),
    ].filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [stokData, riwayat]);

  const getProductOptions = (): string[] => productOptions;

  const filteredRiwayat = useMemo(() => {
    const query = searchRiwayat.toLowerCase();
    return riwayat.filter((item) => {
      return (
        item.namaProduk.toLowerCase().includes(query) ||
        (item.namaSupplier && item.namaSupplier.toLowerCase().includes(query)) ||
        ((item as any).tujuanCustomer && String((item as any).tujuanCustomer).toLowerCase().includes(query)) ||
        ((item as any).noStruk && String((item as any).noStruk).toLowerCase().includes(query)) ||
        item.user.toLowerCase().includes(query)
      );
    });
  }, [riwayat, searchRiwayat]);

  const handleProdukChange = (value: string) => {
    const v = value.toUpperCase();
    setNamaProduk(v);
    if (v.length > 0) {
      const filtered = productOptions.filter((n) => n.includes(v));
      setFilteredProducts(filtered);
      setShowProductDropdown(filtered.length > 0);
    } else {
      setShowProductDropdown(false);
    }
  };

  const selectProduk = (name: string) => {
    setNamaProduk(name);
    setShowProductDropdown(false);
  };

  // Buat rekomendasi produk dari "jenisBarang" di data supplier
  const computeRecommendedProducts = (supplier: any): string[] => {
    const jenis = (supplier?.jenisBarang || "").toString().toUpperCase();
    const tokens: string[] = jenis
      .split(/[\,\n]/)
      .map((t: string) => t.trim())
      .filter((t: string) => Boolean(t));
    if (tokens.length === 0) return [];
    const matches = productOptions.filter((name) =>
      tokens.some((tok: string) => name.includes(tok))
    );
    return Array.from(new Set(matches)).sort((a, b) => a.localeCompare(b));
  };

  // FUNGSI BARU: Cek & Auto-Add Supplier
  const checkAndAddSupplier = async (supplierName: string) => {
    try {
      const normalized = (supplierName || "").trim().toUpperCase();
      // Cek apakah supplier sudah ada di database (case-insensitive via uppercase)
      const supplierQuery = query(
        collection(db, "cabang", cabang, "suppliers"),
        where("nama", "==", normalized)
      );
      const supplierSnapshot = await getDocs(supplierQuery);

      // Kalo belum ada, tambahkan supplier baru (nama disimpan uppercase)
      if (supplierSnapshot.empty) {
        await addDoc(collection(db, "cabang", cabang, "suppliers"), {
          nama: normalized,
          kontak: "-" as any, // Default kosong, bisa diisi nanti di Data Supplier
          alamat: "-" as any,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          addedBy: username,
        });

        // Reload suppliers biar muncul di autocomplete
        await loadSuppliers(cabang);

        setSuccess(`Supplier "${normalized}" berhasil ditambahkan!`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (e: any) {
      console.error("Error checking/adding supplier:", e);
      // Ga perlu throw error, transaksi tetep jalan
    }
  };

  const updateSupplierPrices = async (supplierName: string, beli: number) => {
    try {
      const normalized = (supplierName || "").trim().toUpperCase();
      // Coba cari berdasarkan nama uppercase terlebih dahulu
      let supplierQueryRef = query(
        collection(db, "cabang", cabang, "suppliers"),
        where("nama", "==", normalized)
      );
      let supplierSnapshot = await getDocs(supplierQueryRef);

      // Fallback: jika tidak ketemu, coba nama asli (untuk data lama yang belum dinormalisasi)
      if (supplierSnapshot.empty && supplierName) {
        supplierQueryRef = query(
          collection(db, "cabang", cabang, "suppliers"),
          where("nama", "==", supplierName)
        );
        supplierSnapshot = await getDocs(supplierQueryRef);
      }

      const updates = supplierSnapshot.docs.map((d) =>
        updateDoc(d.ref, {
          hargaBeliSatuan: beli,
          updatedAt: serverTimestamp(),
        })
      );
      await Promise.all(updates);
    } catch (e) {
      console.error("Error updating supplier prices:", e);
    }
  };

  const handleInput = async () => {
    if (
      !namaProduk ||
      !namaSupplier ||
      !jumlah ||
      !tanggalMasuk ||
      !hargaBeliSatuan
    ) {
      setError("Semua field harus diisi!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);

    try {
      // AUTO-ADD SUPPLIER KALO BELUM ADA
      await checkAndAddSupplier(namaSupplier);
      // UPDATE SUPPLIER DENGAN HARGA SATUAN TERBARU
      await updateSupplierPrices(namaSupplier, parseFloat(hargaBeliSatuan));

      // Simpan transaksi
      const trxData: any = {
        type: "input",
        namaProduk,
        namaSupplier,
        jumlah: parseFloat(jumlah),
        satuan,
        tanggalMasuk,
        hargaBeliSatuan: parseFloat(hargaBeliSatuan),
        timestamp: serverTimestamp(),
        user: username,
      };

      // Jika harga jual diisi, tambahkan ke transaksi dan update collection produk
      if (hargaJualSatuan) {
        trxData.hargaJualSatuan = parseFloat(hargaJualSatuan);
        // Update harga jual di collection produk
        const produkRef = doc(db, "cabang", cabang, "produk", namaProduk.toUpperCase());
        await setDoc(
          produkRef,
          {
            namaProduk: namaProduk.toUpperCase(),
            hargaJualSatuan: parseFloat(hargaJualSatuan),
            updatedAt: new Date(),
          },
          { merge: true }
        );
        // Update local state productPrices
        setProductPrices((prev) => ({
          ...prev,
          [namaProduk.toUpperCase()]: parseFloat(hargaJualSatuan),
        }));
      }

      await addDoc(collection(db, "cabang", cabang, "transaksi"), trxData);

      setSuccess("Input barang berhasil!");
      setTimeout(() => setSuccess(""), 3000);

      setNamaProduk("");
      setNamaSupplier("");
      setJumlah("");
      setTanggalMasuk("");
      setHargaBeliSatuan("");
      setHargaJualSatuan("");
      setSatuan("KG");
    } catch (e: any) {
      setError(`Error: ${e.message}`);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // TAMBAH KE KERANJANG
  const addToCart = () => {
    if (!namaProdukOutput || !jumlahOutput) {
      setError("Nama produk dan jumlah harus diisi!");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const selected = stokData.find(
      (s) => s.namaProduk === namaProdukOutput.toUpperCase()
    );
    if (!selected) {
      setError("Produk tidak ada di stok!");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const qty = parseFloat(jumlahOutput);
    if (!qty || qty <= 0) {
      setError("Jumlah harus lebih dari 0!");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const available = getAvailableFor(selected.namaProduk);
    if (qty > available) {
      setError(`Jumlah melebihi stok (${available} ${selected.satuan || ""})`);
      setTimeout(() => setError(""), 3000);
      return;
    }

    const hargaSatuan = productPrices[selected.namaProduk] || 0;
    if (!hargaSatuan) {
      setError("Harga jual belum ditetapkan di Cek Stok!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const newItem: CartItem = {
      namaProduk: selected.namaProduk,
      jumlah: qty,
      satuan: selected.satuan || satuanOutput,
      hargaSatuan,
    };

    setCart([...cart, newItem]);
    setSuccess(`${selected.namaProduk} ditambahkan ke keranjang`);
    setTimeout(() => setSuccess(""), 2000);

    setNamaProdukOutput("");
    setJumlahOutput("");
    setSatuanOutput("KG");
  };

  // HAPUS DARI KERANJANG
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // PROSES OUTPUT & GENERATE STRUK
  const processOutput = async () => {
    if (cart.length === 0) {
      setError("Keranjang kosong! Tambahkan barang dulu.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!tujuanCustomer) {
      setError("Tujuan pengiriman wajib dipilih!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const grouped: { [key: string]: { jumlah: number; satuan: string } } = {};
    cart.forEach((item) => {
      const key = item.namaProduk.toUpperCase();
      if (!grouped[key]) grouped[key] = { jumlah: 0, satuan: item.satuan };
      grouped[key].jumlah += item.jumlah;
    });
    for (const key of Object.keys(grouped)) {
      const p = stokData.find((s) => s.namaProduk === key);
      if (!p || grouped[key].jumlah > p.totalJumlah) {
        setError(`Stok tidak cukup untuk ${key}`);
        setTimeout(() => setError(""), 3000);
        return;
      }
    }

    setLoading(true);

    try {
      // Generate NO STRUK DULU, biar semua item dalam keranjang punya nomor struk YANG SAMA!
      const noStrukBaru = `OUT-${Date.now()}`;

      // Helper: ambil harga dari transaksi INPUT terakhir
      const getLatestPrices = (productName: string) => {
        const inputItems = riwayat.filter(
          (r) =>
            r.type === "input" && r.namaProduk === productName.toUpperCase()
        );
        if (inputItems.length === 0) return { hargaBeli: 0, hargaJual: 0 };

        // Urutkan dari yang terbaru
        const getMillis = (t: any): number => {
          if (!t) return 0;
          if (typeof t === "number") return t;
          if (typeof t === "object") {
            const maybeFn = (t as any).toMillis;
            if (typeof maybeFn === "function") {
              try {
                return maybeFn.call(t);
              } catch {
                return 0;
              }
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
        const sorted = inputItems.sort(
          (a, b) => getMillis(b.timestamp) - getMillis(a.timestamp)
        );

        return {
          hargaBeli: sorted[0].hargaBeliSatuan || 0,
          hargaJual: sorted[0].hargaJualSatuan || 0,
        };
      };

      // Simpan setiap item ke Firestore dengan harga DAN NO STRUK YANG SAMA!
      const promises = cart.map((item) => {
        const prices = getLatestPrices(item.namaProduk);
        return addDoc(collection(db, "cabang", cabang, "transaksi"), {
          type: "output",
          namaProduk: item.namaProduk,
          jumlah: item.jumlah,
          satuan: item.satuan,
          hargaBeliSatuan: prices.hargaBeli,
          hargaJualSatuan: item.hargaSatuan,
          tujuanCustomer,
          timestamp: serverTimestamp(),
          user: username,
          noStruk: noStrukBaru, // <-- NOMOR STRUK DISIMPAN KE FIRESTORE!
        });
      });

      await Promise.all(promises);

      // Generate receipt data
      const receipt = {
        cabang,
        items: cart,
        user: username,
        timestamp: new Date(),
        noStruk: noStrukBaru,
      };

      setReceiptData(receipt);
      setShowReceipt(true);
      setCart([]);

      setSuccess("Output barang berhasil! Struk siap dicetak.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(`Error: ${e.message}`);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // PRINT STRUK - VERSI SIMPLE
  const printReceipt = () => {
    window.print();
    // Tutup modal setelah print dialog print
    setTimeout(() => setShowReceipt(false), 500);
  };

  // PRINT STRUK DARI RIWAYAT - VERSI SIMPLE
  const printRiwayatReceipt = () => {
    window.print();
    // Tutup modal setelah print dialog print
    setTimeout(() => setShowRiwayatReceipt(false), 500);
  };

  // BUKA STRUK DARI RIWAYAT - GABUNG BERDASARKAN NO STRUK!
  const openRiwayatReceipt = (item: TransaksiItem) => {
    if (item.type !== "output") return;

    let itemsForReceipt: TransaksiItem[] = [];
    let finalNoStruk = "";
    let finalTujuanCustomer = (item as any).tujuanCustomer || "";
    let finalUser = item.user;
    let finalTimestamp = item.timestamp;

    if ((item as any).noStruk) {
      // Kalau ada noStruk, ambil SEMUA transaksi dengan noStruk yang SAMA!
      itemsForReceipt = riwayat.filter(t =>
        (t as any).noStruk === (item as any).noStruk && t.type === "output"
      );
      finalNoStruk = (item as any).noStruk;
      // Ambil data representative dari item pertama
      const representative = itemsForReceipt[0] || item;
      finalTujuanCustomer = (representative as any).tujuanCustomer || "";
      finalUser = representative.user;
      finalTimestamp = representative.timestamp;
    } else {
      // Transaksi lama (tanpa noStruk): cuma 1 item
      itemsForReceipt = [item];
      finalNoStruk = `OUT-${item.id}`;
    }

    // Convert ke CartItem buat Receipt
    const cartItems: CartItem[] = itemsForReceipt.map(t => ({
      namaProduk: t.namaProduk,
      jumlah: parseFloat(t.jumlah as any) || 0,
      satuan: t.satuan,
      hargaSatuan: parseFloat(t.hargaJualSatuan as any) || 0,
    }));

    const receipt: ReceiptData = {
      cabang: cabang,
      items: cartItems,
      user: finalUser,
      timestamp: finalTimestamp?.toDate?.() || new Date(finalTimestamp as any),
      noStruk: finalNoStruk,
    };

    setRiwayatReceiptData(receipt);
    setRiwayatTujuanCustomer(finalTujuanCustomer);
    setShowRiwayatReceipt(true);
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

  // Fungsi buka modal edit transaksi
  const openEditModal = (transaksi: TransaksiItem) => {
    setEditingTransaksi(transaksi);
    setEditFormData({
      namaProduk: transaksi.namaProduk,
      namaSupplier: transaksi.namaSupplier || "",
      jumlah: transaksi.jumlah,
      satuan: transaksi.satuan,
      tanggalMasuk: transaksi.tanggalMasuk || "",
      hargaBeliSatuan: transaksi.hargaBeliSatuan || "",
      hargaJualSatuan: transaksi.hargaJualSatuan || "",
      tujuanCustomer: (transaksi as any).tujuanCustomer || "",
    });
    setIsEditModalOpen(true);
  };

  // Fungsi simpan edit transaksi
  const saveEditTransaksi = async () => {
    if (!editingTransaksi) return;
    setLoading(true);
    try {
      const originalJumlah = parseFloat(editingTransaksi.jumlah as any) || 0;
      const newJumlah = parseFloat(editFormData.jumlah) || 0;

      // Pengecekan stok jika transaksi OUTPUT
      if (editingTransaksi.type === "output") {
        const delta = newJumlah - originalJumlah;
        const productName = editFormData.namaProduk.toUpperCase().trim();
        const currentStokItem = stokData.find(s => s.namaProduk === productName);
        const currentStok = currentStokItem ? currentStokItem.totalJumlah : 0;

        // Hitung stok setelah edit: currentStok (which includes originalJumlah being subtracted) minus delta
        const hypotheticalStok = currentStok - delta;

        if (hypotheticalStok < 0) {
          alert(`Stok tidak cukup untuk ${productName}! Stok saat ini: ${currentStok}, butuh: ${newJumlah}`);
          setLoading(false);
          return;
        }
      }

      // Hitung selisih jumlah untuk update stok
      const selisihJumlah = newJumlah - originalJumlah;

      // Update transaksi
      const trxRef = doc(db, "cabang", cabang, "transaksi", editingTransaksi.id);
      await updateDoc(trxRef, {
        namaProduk: editFormData.namaProduk,
        namaSupplier: editFormData.namaSupplier,
        jumlah: newJumlah,
        satuan: editFormData.satuan,
        tanggalMasuk: editFormData.tanggalMasuk,
        hargaBeliSatuan: parseFloat(editFormData.hargaBeliSatuan) || 0,
        hargaJualSatuan: parseFloat(editFormData.hargaJualSatuan) || 0,
        tujuanCustomer: editFormData.tujuanCustomer,
        updatedAt: serverTimestamp(),
      });

      // Jika harga jual diubah, update collection produk
      if (editFormData.hargaJualSatuan) {
        const produkRef = doc(db, "cabang", cabang, "produk", editFormData.namaProduk.toUpperCase());
        await setDoc(
          produkRef,
          {
            namaProduk: editFormData.namaProduk.toUpperCase(),
            hargaJualSatuan: parseFloat(editFormData.hargaJualSatuan),
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }

      setSuccess("Transaksi berhasil diedit!");
      setTimeout(() => setSuccess(""), 3000);
      setIsEditModalOpen(false);
      setEditingTransaksi(null);
    } catch (e: any) {
      setError(`Error: ${e.message}`);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
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

      {/* Modal Struk */}
      {showReceipt && receiptData && (
        <Receipt
          receiptData={receiptData}
          receiptRef={receiptRef}
          tujuanCustomer={tujuanCustomer}
          onPrint={printReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Modal Struk dari Riwayat */}
      {showRiwayatReceipt && riwayatReceiptData && (
        <Receipt
          receiptData={riwayatReceiptData}
          receiptRef={riwayatReceiptRef}
          tujuanCustomer={riwayatTujuanCustomer}
          onPrint={printRiwayatReceipt}
          onClose={() => setShowRiwayatReceipt(false)}
        />
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-[#DDE3EE]">
        <div className="flex gap-4 border-b-2 border-[#EEF1F7] mb-6">
          <button
            onClick={() => setActiveTab("input")}
            className={`pb-4 px-6 font-semibold transition-all text-base flex items-center gap-2 ${
              activeTab === "input"
                ? "border-b-4 border-[#1B3060] text-[#1B3060] -mb-0.5"
                : "text-slate-400 hover:text-[#1B3060]"
            }`}
          >
            <IconTrayIn className="w-5 h-5" />
            Input Barang
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`pb-4 px-6 font-semibold transition-all text-base flex items-center gap-2 ${
              activeTab === "output"
                ? "border-b-4 border-[#B8892B] text-[#8A6317] -mb-0.5"
                : "text-slate-400 hover:text-[#8A6317]"
            }`}
          >
            <IconTrayOut className="w-5 h-5" />
            Output Barang
          </button>
        </div>

        {/* Form Input */}
        {activeTab === "input" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Nama Produk <span className="text-[#B23A34]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Telur Ayam"
                  value={namaProduk}
                  onChange={(e) => handleProdukChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] uppercase"
                />
                {recommendedProducts.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      Rekomendasi dari supplier
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recommendedProducts.slice(0, 10).map((name) => (
                        <button
                          key={name}
                          onClick={() => selectProduk(name)}
                          className="px-3 py-1.5 bg-[#EEF1F7] hover:bg-[#E0E6F2] text-[#1B3060] border border-[#DDE3EE] rounded-lg text-xs font-bold transition"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="mt-2 bg-white border-2 border-[#DDE3EE] rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredProducts.map((name) => (
                      <button
                        key={name}
                        onClick={() => selectProduk(name)}
                        className="w-full px-4 py-3 text-left hover:bg-[#EEF1F7] transition text-[#0B1424] font-medium border-b border-[#EEF1F7] last:border-0"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Nama Supplier <span className="text-[#B23A34]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ketik nama supplier..."
                  value={namaSupplier}
                  onChange={(e) =>
                    handleSupplierChange(e.target.value.toUpperCase())
                  }
                  onFocus={() => namaSupplier && setShowSupplierDropdown(true)}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] uppercase"
                />
                {showSupplierDropdown && filteredSuppliers.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-[#DDE3EE] rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredSuppliers.map((supplier) => (
                      <button
                        key={supplier.id}
                        onClick={() => selectSupplier(supplier)}
                        className="w-full px-4 py-3 text-left hover:bg-[#EEF1F7] transition text-[#0B1424] font-medium border-b border-[#EEF1F7] last:border-0"
                      >
                        <div className="font-semibold text-[#0B1424]">
                          {supplier.nama}
                        </div>
                        <div className="text-sm text-slate-500">
                          {supplier.kontak}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <IconInfo className="w-3.5 h-3.5 text-[#1B3060] shrink-0" />
                  Supplier baru akan otomatis ditambahkan ke database
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Jumlah <span className="text-[#B23A34]">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 100"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Satuan <span className="text-[#B23A34]">*</span>
                </label>
                <select
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] bg-white"
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
                    className="flex-1 px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSatuan('input')}
                    className="px-4 py-3 bg-[#1B3060] hover:bg-[#0B1424] text-white rounded-xl font-bold transition"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Harga Beli Satuan <span className="text-[#B23A34]">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 15000"
                  value={hargaBeliSatuan}
                  onChange={(e) => setHargaBeliSatuan(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Harga Jual Satuan <span className="text-slate-400">(Opsional)</span>
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 20000"
                  value={hargaJualSatuan}
                  onChange={(e) => setHargaJualSatuan(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">
                  Tanggal Masuk <span className="text-[#B23A34]">*</span>
                </label>
                <input
                  type="date"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] font-medium"
                />
              </div>
            </div>

            <button
              onClick={handleInput}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#1B3060] to-[#0B1424] hover:from-[#0B1424] hover:to-[#060D1A] disabled:from-slate-300 disabled:to-slate-400 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <IconSpinner className="w-5 h-5" /> Menyimpan...
                </>
              ) : (
                <>
                  <IconSave className="w-5 h-5" /> Simpan Input
                </>
              )}
            </button>
          </div>
        )}

        {/* Form Output - KERANJANG SYSTEM */}
        {activeTab === "output" && (
          <OutputSection
            stokData={stokData}
            customers={customers}
            namaProdukOutput={namaProdukOutput}
            setNamaProdukOutput={(val) => {
              setNamaProdukOutput(val);
              const p = stokData.find((s) => s.namaProduk === val);
              setSatuanOutput(p?.satuan || satuanOutput);
            }}
            jumlahOutput={jumlahOutput}
            setJumlahOutput={setJumlahOutput}
            satuanOutput={satuanOutput}
            setSatuanOutput={setSatuanOutput}
            satuanOptions={satuanOptions}
            customSatuan={customSatuan}
            setCustomSatuan={setCustomSatuan}
            handleAddSatuan={handleAddSatuan}
            tujuanCustomer={tujuanCustomer}
            setTujuanCustomer={setTujuanCustomer}
            getAvailableFor={getAvailableFor}
            addToCart={addToCart}
            cart={cart}
            removeFromCart={removeFromCart}
            processOutput={processOutput}
            loading={loading}
          />
        )}
      </div>

      {/* Riwayat Transaksi */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-[#DDE3EE]">
        <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
          <h3 className="text-xl font-bold text-[#0B1424] flex items-center gap-2">
            <IconLedger className="w-5 h-5 text-[#1B3060]" />
            Riwayat Transaksi
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <IconSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama produk, supplier, no struk, customer, atau user..."
                value={searchRiwayat}
                onChange={(e) => setSearchRiwayat(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
              />
            </div>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#B8892B] to-[#8A6317] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition flex items-center gap-2 whitespace-nowrap"
            >
              <IconDownload className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-3xl border border-[#DDE3EE] shadow-sm">
          <table className="min-w-full divide-y divide-[#EEF1F7] bg-white">
            <thead>
              <tr className="bg-[#F7F8FB]">
                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Waktu
                </th>
                <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                  Type
                </th>
                <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                  No. Struk
                </th>
                <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                  Produk
                </th>
                <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                  Supplier/Customer
                </th>
                <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                  Jumlah
                </th>
                <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                  Harga Beli Satuan
                </th>
                <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                  Harga Jual Satuan
                </th>
                <th className="text-left py-4 px-4 font-bold text-[#0B1424]">
                  User
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F8] bg-white">
              {(() => {
                const filtered = filteredRiwayat;

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400">
                        <IconPackage className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <div className="font-medium text-slate-500">
                          {searchRiwayat ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}
                        </div>
                      </td>
                    </tr>
                  );
                }

                // ========== GROUPING LOGIC: Output dengan noStruk digabung jadi 1 baris ==========
                type GroupedRow = {
                  isGroup: true; // <-- LITERAL TRUE, biar TS narrows otomatis!
                  groupId: string;
                  noStruk?: string;
                  timestamp: any;
                  user: string;
                  tujuanCustomer?: string;
                  items: TransaksiItem[];
                  totalHarga: number;
                  totalJumlah: number;
                  totalItemsCount: number;
                  representative: TransaksiItem;
                };

                type SingleRow = {
                  isGroup: false;
                  item: TransaksiItem;
                };

                type Row = GroupedRow | SingleRow;

                const processedNoStruk = new Set<string>();
                const rows: Row[] = [];

                filtered.forEach((item) => {
                  const noStruk = (item as any).noStruk;

                  // Kalau OUTPUT dan punya noStruk: bikin group
                  if (item.type === "output" && noStruk) {
                    if (processedNoStruk.has(noStruk)) return; // Skip karena sudah diproses groupnya

                    // Ambil SEMUA item dengan noStruk yang SAMA (dari DATA FILTERED)
                    const groupItems = filtered.filter(
                      (t) => (t as any).noStruk === noStruk && t.type === "output"
                    );
                    if (groupItems.length === 0) return;

                    const rep = groupItems[0];
                    const totalHarga = groupItems.reduce(
                      (sum, it) =>
                        sum +
                        (parseFloat(it.jumlah as any) || 0) *
                          (parseFloat(it.hargaJualSatuan as any) || 0),
                      0
                    );
                    const totalJumlah = groupItems.reduce(
                      (sum, it) => sum + (parseFloat(it.jumlah as any) || 0),
                      0
                    );

                    processedNoStruk.add(noStruk);

                    rows.push({
                      isGroup: true,
                      groupId: `group-${noStruk}`,
                      noStruk,
                      timestamp: rep.timestamp,
                      user: rep.user,
                      tujuanCustomer: (rep as any).tujuanCustomer,
                      items: groupItems,
                      totalHarga,
                      totalJumlah,
                      totalItemsCount: groupItems.length,
                      representative: rep,
                    });
                  } else {
                    // Transaksi INPUT / OUTPUT tanpa noStruk: single row
                    rows.push({
                      isGroup: false,
                      item,
                    });
                  }
                });

                return rows.map((row) => {
                  // ================== ROW: Single Item (INPUT / OUTPUT tanpa noStruk) ==================
                  if (!row.isGroup) {
                    const item = row.item;
                    return (
                      <tr
                        key={item.id}
                        className="bg-white hover:bg-[#F7F8FB] transition"
                      >
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {formatDate(item.timestamp)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                              item.type === "input"
                                ? "bg-[#EEF1F7] text-[#1B3060]"
                                : "bg-[#F7EEDD] text-[#8A6317]"
                            }`}
                          >
                            {item.type === "input" ? "INPUT" : "OUTPUT"}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs font-bold text-slate-600 whitespace-nowrap">
                          {(item as any).noStruk || <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-4 px-4 font-semibold text-[#0B1424] text-sm">
                          {item.namaProduk}
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-sm font-medium">
                          {item.type === "input"
                            ? (item.namaSupplier || "-")
                            : ((item as any).tujuanCustomer || "-")}
                        </td>
                        <td className="py-4 px-4 font-bold text-[#0B1424]">
                          {item.jumlah}{" "}
                          <span className="text-slate-500 font-semibold">
                            {item.satuan || ""}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-sm">
                          {typeof item.hargaBeliSatuan === "number"
                            ? item.hargaBeliSatuan.toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-sm">
                          {typeof item.hargaJualSatuan === "number"
                            ? item.hargaJualSatuan.toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {item.user}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="px-3 py-1.5 border border-[#1B3060] text-[#1B3060] hover:bg-[#EEF1F7] rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                            >
                              <IconPencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            {item.type === "output" && (
                              <button
                                onClick={() => openRiwayatReceipt(item)}
                                className="px-3 py-1.5 bg-[#1B3060] hover:bg-[#0B1424] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                              >
                                <IconPrinter className="w-3.5 h-3.5" /> Cetak
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // ================== ROW: GROUP OUTPUT (per noStruk) ==================
                  const isExpanded = expandedGroupIds.has(row.groupId);

                  return (
                    <React.Fragment key={row.groupId}>
                      {/* Summary Row: 1 baris untuk invoice / 1 no struk - CLEAN DESIGN */}
                      <tr className={`transition ${isExpanded ? "bg-[#F7F8FB]" : "bg-white hover:bg-[#F7F8FB]"}`}>
                        <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                          {formatDate(row.timestamp)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-[#F7EEDD] text-[#8A6317] border border-[#EBD9B4]">
                            OUT ({row.totalItemsCount})
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-[#1B3060] whitespace-nowrap">
                          {row.noStruk}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#0B1424] text-sm mb-1 line-clamp-1">
                            {row.items[0].namaProduk}
                            {row.items.length > 1 && (
                              <span className="text-xs text-slate-500 font-medium ml-1">
                                +{row.items.length - 1} lainnya
                              </span>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="space-y-0.5 mt-2">
                              {row.items.map((it, i) => (
                                <div key={i} className="text-xs text-slate-500">
                                  • {it.namaProduk}{" "}
                                  <span className="text-slate-400">
                                    ({it.jumlah} {it.satuan})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          {row.tujuanCustomer || "-"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#0B1424] text-sm whitespace-nowrap">
                          {row.totalJumlah} unit
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          -
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#0B1424] text-sm whitespace-nowrap">
                          Rp {row.totalHarga.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {row.user}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => toggleGroupExpand(row.groupId)}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                                isExpanded
                                  ? "bg-[#0B1424] hover:bg-black text-white"
                                  : "bg-[#EEF1F7] hover:bg-[#E0E6F2] text-[#1B3060]"
                              }`}
                            >
                              {isExpanded ? <IconChevronUp className="w-3.5 h-3.5" /> : <IconChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => openRiwayatReceipt(row.representative)}
                              className="px-2.5 py-1.5 bg-[#1B3060] hover:bg-[#0B1424] text-white rounded-md text-xs font-semibold transition flex items-center gap-1.5"
                            >
                              <IconPrinter className="w-3.5 h-3.5" /> Cetak
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Detail Items - CLEAN SUB ROWS */}
                      {isExpanded && row.items.map((it, idx) => (
                        <tr
                          key={`${row.groupId}-item-${idx}`}
                          className="bg-[#F7F8FB] hover:bg-[#EEF1F7] transition"
                        >
                          <td className="py-2 px-4 pl-10 text-[11px] text-slate-400 whitespace-nowrap" colSpan={2}>
                            <span className="inline-flex items-center gap-1.5">
                              <IconCornerDownRight className="w-3 h-3" /> Item #{idx + 1}
                            </span>
                          </td>
                          <td className="py-2 px-4 font-mono text-[10px] text-slate-300">
                            {it.id.slice(0, 8)}…
                          </td>
                          <td className="py-2 px-4 font-medium text-slate-700 text-xs">
                            {it.namaProduk}
                          </td>
                          <td className="py-2 px-4 text-slate-400 text-xs">
                            -
                          </td>
                          <td className="py-2 px-4 font-semibold text-slate-700 text-xs whitespace-nowrap">
                            {it.jumlah} {it.satuan || ""}
                          </td>
                          <td className="py-2 px-4 text-slate-500 text-xs whitespace-nowrap">
                            {typeof it.hargaBeliSatuan === "number"
                              ? it.hargaBeliSatuan.toLocaleString("id-ID")
                              : "-"}
                          </td>
                          <td className="py-2 px-4 text-slate-600 font-semibold text-xs whitespace-nowrap">
                            {typeof it.hargaJualSatuan === "number"
                              ? it.hargaJualSatuan.toLocaleString("id-ID")
                              : "-"}
                          </td>
                          <td className="py-2 px-4 text-[10px] text-slate-400">
                            {it.user}
                          </td>
                          <td className="py-2 px-4">
                            <button
                              onClick={() => openEditModal(it)}
                              className="px-2 py-1 border border-[#1B3060] text-[#1B3060] hover:bg-[#EEF1F7] rounded text-[10px] font-semibold transition flex items-center gap-1"
                            >
                              <IconPencil className="w-3 h-3" /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
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

      {/* Modal Edit Transaksi */}
      {isEditModalOpen && editingTransaksi && (
        <div className="fixed inset-0 backdrop-blur-md bg-[#0B1424]/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#0B1424] flex items-center gap-3">
                <IconPencil className="w-5 h-5 text-[#1B3060]" />
                Edit Transaksi
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-[#0B1424] transition">
                <IconX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0B1424] mb-2">Nama Produk</label>
                <input
                  type="text"
                  value={editFormData.namaProduk}
                  onChange={(e) => setEditFormData({...editFormData, namaProduk: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                />
              </div>

              {editingTransaksi.type === "input" && (
                <div>
                  <label className="block text-sm font-semibold text-[#0B1424] mb-2">Nama Supplier</label>
                  <input
                    type="text"
                    value={editFormData.namaSupplier}
                    onChange={(e) => setEditFormData({...editFormData, namaSupplier: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  />
                </div>
              )}

              {editingTransaksi.type === "output" && (
                <div>
                  <label className="block text-sm font-semibold text-[#0B1424] mb-2">Tujuan Customer</label>
                  <input
                    type="text"
                    value={editFormData.tujuanCustomer}
                    onChange={(e) => setEditFormData({...editFormData, tujuanCustomer: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0B1424] mb-2">Jumlah</label>
                  <input
                    type="number"
                    value={editFormData.jumlah}
                    onChange={(e) => setEditFormData({...editFormData, jumlah: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0B1424] mb-2">Satuan</label>
                  <select
                    value={editFormData.satuan}
                    onChange={(e) => setEditFormData({...editFormData, satuan: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424] bg-white"
                  >
                    {satuanOptions.map((s) => (
                      <option key={s} value={s} className="text-[#0B1424]">{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0B1424] mb-2">Harga Beli Satuan</label>
                  <input
                    type="number"
                    value={editFormData.hargaBeliSatuan}
                    onChange={(e) => setEditFormData({...editFormData, hargaBeliSatuan: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0B1424] mb-2">Harga Jual Satuan</label>
                  <input
                    type="number"
                    value={editFormData.hargaJualSatuan}
                    onChange={(e) => setEditFormData({...editFormData, hargaJualSatuan: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  />
                </div>
              </div>

              {editingTransaksi.type === "input" && (
                <div>
                  <label className="block text-sm font-semibold text-[#0B1424] mb-2">Tanggal Masuk</label>
                  <input
                    type="date"
                    value={editFormData.tanggalMasuk}
                    onChange={(e) => setEditFormData({...editFormData, tanggalMasuk: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-[#DDE3EE] rounded-xl focus:ring-4 focus:ring-[#1B3060]/10 focus:border-[#1B3060] outline-none transition text-[#0B1424]"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 bg-[#EEF1F7] hover:bg-[#E0E6F2] text-[#0B1424] rounded-xl font-bold transition">
                Batal
              </button>
              <button onClick={saveEditTransaksi} disabled={loading} className="flex-1 px-4 py-3 bg-[#1B3060] hover:bg-[#0B1424] disabled:bg-slate-300 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">
                {loading ? (
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

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        riwayat={riwayat}
      />
    </div>
  );
}