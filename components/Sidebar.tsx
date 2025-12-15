"use client";

import { useRouter } from "next/navigation";

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  cabang: string;
  username: string;
  role: string;
}

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  cabang,
  username,
  role,
}: SidebarProps) {
  const router = useRouter();

  const menuItems = [
    { id: "beranda", label: "Beranda", icon: "🏠" },
    { id: "cek-stok", label: "Cek Stok", icon: "📦" },
    { id: "data-supplier", label: "Data Supplier", icon: "🏢" },
    { id: "data-customer", label: "Data Customer", icon: "👤" },
  ];

  const handleLogout = () => {
    // Hapus semua data
    document.cookie = "isLoggedIn=; path=/; max-age=0";
    document.cookie = "cabang=; path=/; max-age=0";
    document.cookie = "username=; path=/; max-age=0";
    document.cookie = "role=; path=/; max-age=0";
    localStorage.clear();

    router.push("/login");
  };

  // Format nama cabang biar lebih rapi
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

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-screen">
      {/* Header Sidebar */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
            <img
              src="https://res.cloudinary.com/doepilwju/image/upload/v1765505991/hjs_otvbvc.png"
              alt="Logo Koperasi"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Koperasi System</h1>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              {formatCabang(cabang)}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
              activeMenu === item.id
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{username}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
