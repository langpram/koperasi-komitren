//dashboard/beranda/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, where, updateDoc } from "firebase/firestore";
import Receipt from "@/components/beranda/Receipt";
import OutputSection from "@/components/beranda/OutputSection";

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
  const [productPrices, setProductPrices] = useState<Record<string, number>>({});

  // Form Output State - KERANJANG
  const [cart, setCart] = useState<CartItem[]>([]);
  const [namaProdukOutput, setNamaProdukOutput] = useState("");
  const [jumlahOutput, setJumlahOutput] = useState("");
  const [satuanOutput, setSatuanOutput] = useState("KG");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [stokData, setStokData] = useState<StokItem[]>([]);
  const [tujuanCustomer, setTujuanCustomer] = useState("");
  const [customers, setCustomers] = useState<{ id: string; nama: string }[]>([]);

  // Autocomplete
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<string[]>([]);

  // Riwayat
  const [riwayat, setRiwayat] = useState<TransaksiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Satuan options
  const satuanList = ["KG", "PCS", "LITER", "PACK", "BOX", "KARUNG"];

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
      if (!stokMap[normalizedName]) {
        stokMap[normalizedName] = {
          namaProduk: normalizedName,
          totalJumlah: 0,
          satuan: item.satuan || "",
        };
      }
      if (item.type === "input") {
        stokMap[normalizedName].totalJumlah += item.jumlah;
        stokMap[normalizedName].satuan = item.satuan || stokMap[normalizedName].satuan;
      } else if (item.type === "output") {
        stokMap[normalizedName].totalJumlah -= item.jumlah;
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
      const snap = await getDocs(collection(db, "cabang", cabangName, "suppliers"));
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSuppliers(data);
    } catch (e) {
      console.error("Error loading suppliers:", e);
    }
  };

  const loadCustomers = async (cabangName: string) => {
    try {
      const snap = await getDocs(collection(db, "cabang", cabangName, "customers"));
      const data = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      const list = data.map((d) => ({ id: d.id, nama: (d.nama || "").toUpperCase() })).filter((d) => d.nama);
      setCustomers(list);
    } catch (e) {
      console.error("Error loading customers:", e);
    }
  };

  const loadProductPrices = async (cabangName: string) => {
    try {
      const snap = await getDocs(collection(db, "cabang", cabangName, "produk"));
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
    } else {
      setShowSupplierDropdown(false);
    }
  };

  const selectSupplier = (supplier: any) => {
    setNamaSupplier(supplier.nama);
    setShowSupplierDropdown(false);
  };

  const getProductOptions = (): string[] => {
    const names = [
      ...stokData.map((s) => s.namaProduk.toUpperCase()),
      ...riwayat.map((r) => (r.namaProduk || "").toUpperCase()),
    ].filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  };

  const handleProdukChange = (value: string) => {
    const v = value.toUpperCase();
    setNamaProduk(v);
    if (v.length > 0) {
      const options = getProductOptions();
      const filtered = options.filter((n) => n.includes(v));
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

  // FUNGSI BARU: Cek & Auto-Add Supplier
  const checkAndAddSupplier = async (supplierName: string) => {
    try {
      // Cek apakah supplier sudah ada di database
      const supplierQuery = query(
        collection(db, "cabang", cabang, "suppliers"),
        where("nama", "==", supplierName)
      );
      
      const supplierSnapshot = await getDocs(supplierQuery);

      // Kalo belum ada, tambahkan supplier baru
      if (supplierSnapshot.empty) {
        await addDoc(collection(db, "cabang", cabang, "suppliers"), {
          nama: supplierName,
          kontak: "-", // Default kosong, bisa diisi nanti di Data Supplier
          alamat: "-",
          timestamp: serverTimestamp(),
          addedBy: username,
        });

        // Reload suppliers biar muncul di autocomplete
        await loadSuppliers(cabang);

        setSuccess(`✅ Supplier "${supplierName}" berhasil ditambahkan!`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (e: any) {
      console.error("Error checking/adding supplier:", e);
      // Ga perlu throw error, transaksi tetep jalan
    }
  };

  const updateSupplierPrices = async (supplierName: string, beli: number) => {
    try {
      const supplierQuery = query(
        collection(db, "cabang", cabang, "suppliers"),
        where("nama", "==", supplierName)
      );
      const supplierSnapshot = await getDocs(supplierQuery);
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
    if (!namaProduk || !namaSupplier || !jumlah || !tanggalMasuk || !hargaBeliSatuan) {
      setError("Semua field harus diisi!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);

    try {
      // AUTO-ADD SUPPLIER KALO BELUM ADA
      await checkAndAddSupplier(namaSupplier);
      // UPDATE SUPPLIER DENGAN HARGA SATUAN TERBARU
      await updateSupplierPrices(
        namaSupplier,
        parseFloat(hargaBeliSatuan)
      );

      // Simpan transaksi
      await addDoc(collection(db, "cabang", cabang, "transaksi"), {
        type: "input",
        namaProduk,
        namaSupplier,
        jumlah: parseFloat(jumlah),
        satuan,
        tanggalMasuk,
        hargaBeliSatuan: parseFloat(hargaBeliSatuan),
        timestamp: serverTimestamp(),
        user: username,
      });

      setSuccess("✅ Input barang berhasil!");
      setTimeout(() => setSuccess(""), 3000);

      setNamaProduk("");
      setNamaSupplier("");
      setJumlah("");
      setTanggalMasuk("");
      setHargaBeliSatuan("");
      setSatuan("KG");
    } catch (e: any) {
      setError(`❌ Error: ${e.message}`);
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
    setSuccess(`✅ ${selected.namaProduk} ditambahkan ke keranjang`);
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
      // Helper: ambil harga dari transaksi INPUT terakhir
      const getLatestPrices = (productName: string) => {
        const inputItems = riwayat.filter(
          (r) => r.type === "input" && r.namaProduk === productName.toUpperCase()
        );
        if (inputItems.length === 0) return { hargaBeli: 0, hargaJual: 0 };
        
        // Urutkan dari yang terbaru
        const sorted = inputItems.sort((a, b) => {
          const timeA = (a.timestamp && typeof a.timestamp === 'object' && 'toMillis' in a.timestamp) 
            ? (a.timestamp as any).toMillis() 
            : 0;
          const timeB = (b.timestamp && typeof b.timestamp === 'object' && 'toMillis' in b.timestamp) 
            ? (b.timestamp as any).toMillis() 
            : 0;
          return timeB - timeA;
        });
        
        return {
          hargaBeli: sorted[0].hargaBeliSatuan || 0,
          hargaJual: sorted[0].hargaJualSatuan || 0,
        };
      };

      // Simpan setiap item ke Firestore dengan harga
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
        });
      });

      await Promise.all(promises);

      // Generate receipt data
      const receipt = {
        cabang,
        items: cart,
        user: username,
        timestamp: new Date(),
        noStruk: `OUT-${Date.now()}`,
      };

      setReceiptData(receipt);
      setShowReceipt(true);
      setCart([]);

      setSuccess("✅ Output barang berhasil! Struk siap dicetak.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(`❌ Error: ${e.message}`);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // PRINT STRUK
  const printReceipt = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const windowPrint = window.open("", "", "width=800,height=600");
    windowPrint?.document.write(`
      <html>
        <head>
          <title>Struk Output Barang</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; }
            .receipt { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .footer { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; text-align: center; }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint?.document.close();
    windowPrint?.focus();
    windowPrint?.print();
    windowPrint?.close();
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

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <span className="font-medium">{error}</span>
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in flex items-center gap-3">
          <span className="text-2xl">✅</span>
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex gap-4 border-b-2 border-gray-100 mb-6">
          <button
            onClick={() => setActiveTab("input")}
            className={`pb-4 px-6 font-semibold transition-all text-base ${
              activeTab === "input"
                ? "border-b-4 border-blue-500 text-blue-600 -mb-0.5"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="mr-2">📥</span>
            Input Barang
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`pb-4 px-6 font-semibold transition-all text-base ${
              activeTab === "output"
                ? "border-b-4 border-red-500 text-red-600 -mb-0.5"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="mr-2">📤</span>
            Output Barang
          </button>
        </div>

        {/* Form Input */}
        {activeTab === "input" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Telur Ayam"
                  value={namaProduk}
                  onChange={(e) => handleProdukChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition text-black uppercase"
                />
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredProducts.map((name) => (
                      <button
                        key={name}
                        onClick={() => selectProduk(name)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition text-gray-800 font-medium border-b border-gray-100 last:border-0"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Nama Supplier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ketik nama supplier..."
                  value={namaSupplier}
                  onChange={(e) => handleSupplierChange(e.target.value.toUpperCase())}
                  onFocus={() => namaSupplier && setShowSupplierDropdown(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition text-black uppercase"
                />
                {showSupplierDropdown && filteredSuppliers.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredSuppliers.map((supplier) => (
                      <button
                        key={supplier.id}
                        onClick={() => selectSupplier(supplier)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition text-gray-800 font-medium border-b border-gray-100 last:border-0"
                      >
                        <div className="font-semibold text-gray-900">{supplier.nama}</div>
                        <div className="text-sm text-gray-600">{supplier.kontak}</div>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  💡 Supplier baru akan otomatis ditambahkan ke database
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Jumlah <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 100"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Satuan <span className="text-red-500">*</span>
                </label>
                <select
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition text-gray-800 bg-white"
                >
                  {satuanList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Harga Beli Satuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 15000"
                  value={hargaBeliSatuan}
                  onChange={(e) => setHargaBeliSatuan(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition text-gray-800"
                />
              </div>

              

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Tanggal Masuk <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition text-gray-800 font-medium"
                />
              </div>
            </div>

            <button
              onClick={handleInput}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? "⏳ Menyimpan..." : "💾 Simpan Input"}
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
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <h3 className="text-xl font-bold mb-5 text-gray-900 flex items-center gap-2">
          <span>📊</span>
          Riwayat Transaksi
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-4 font-bold text-gray-900">Waktu</th>
                <th className="text-left py-4 px-4 font-bold text-gray-900">Type</th>
                <th className="text-left py-4 px-4 font-bold text-gray-900">Produk</th>
                <th className="text-left py-4 px-4 font-bold text-gray-900">Supplier</th>
                <th className="text-left py-4 px-4 font-bold text-gray-900">Jumlah</th>
                <th className="text-left py-4 px-4 font-bold text-gray-900">Harga Beli Satuan</th>
                <th className="text-left py-4 px-4 font-bold text-gray-900">Harga Jual Satuan</th>
                <th className="text-left py-4 px-4 font-bold text-gray-900">User</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <div className="text-5xl mb-3">📦</div>
                    <div className="font-medium">Belum ada transaksi</div>
                  </td>
                </tr>
              ) : (
                riwayat.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50 transition">
                    <td className="py-4 px-4 text-sm font-medium text-gray-700">
                      {formatDate(item.timestamp)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          item.type === "input"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.type === "input" ? "📥 INPUT" : "📤 OUTPUT"}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-900">{item.namaProduk}</td>
                    <td className="py-4 px-4 text-gray-700 font-medium">
                      {item.namaSupplier || "-"}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900">
                      {item.jumlah} <span className="text-gray-600 font-semibold">{item.satuan || ""}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-medium">
                      {typeof item.hargaBeliSatuan === "number" ? item.hargaBeliSatuan.toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-medium">
                      {typeof item.hargaJualSatuan === "number" ? item.hargaJualSatuan.toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 font-medium">
                      {item.user}
                    </td>
                  </tr>
                ))
              )}
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
    </div>
  );
}
