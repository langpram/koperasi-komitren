"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BerandaPage from "@/app/dashboard/beranda/page";
import CekStokPage from "@/app/dashboard/cek-stok/page";
import DataSupplierPage from "@/app/dashboard/data-supplier/page";
import DataCustomerPage from "@/app/dashboard/data-customer/page"; // ✅ TAMBAH INI

export default function DashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("beranda");
  const [cabang, setCabang] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const storedCabang = localStorage.getItem("cabang") || "";
    const storedUsername = localStorage.getItem("username") || "";
    const storedRole = localStorage.getItem("role") || "";

    setCabang(storedCabang);
    setUsername(storedUsername);
    setRole(storedRole);

    if (!storedUsername) {
      router.push("/login");
    }
  }, [router]);

  const formatCabang = (cabangName: string) => {
    const mapping: Record<string, string> = {
      dapur_kp_asem1: "Dapur Kp. Asem 1",
      dapurAsem1: "Dapur Kp. Asem 1",
      dapurAsem2: "Dapur Kp. Asem 2",
      bantarkawung: "Dapur Bantarkawung",
      madiun: "Dapur Madiun",
      bandung: "Dapur Bandung",
    };
    return mapping[cabangName] || cabangName;
  };

  const menuLabels: Record<string, string> = {
    beranda: "Beranda",
    "cek-stok": "Cek Stok",
    "data-supplier": "Data Supplier",
    "data-customer": "Data Customer", // ✅ TAMBAH INI
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        cabang={cabang}
        username={username}
        role={role}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {menuLabels[activeMenu]}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Cabang: {formatCabang(cabang)}
            </p>
          </div>

          {/* Content berdasarkan menu aktif */}
          {activeMenu === "beranda" && <BerandaPage />}
          {activeMenu === "cek-stok" && <CekStokPage />}
          {activeMenu === "data-supplier" && <DataSupplierPage />}
          {activeMenu === "data-customer" && <DataCustomerPage />} {/* ✅ TAMBAH INI */}
        </div>
      </div>
    </div>
  );
}