"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

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
    {
      id: "beranda",
      label: "Beranda",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0L22.28 12M4.5 9.75V21a.75.75 0 00.75.75H9a.75.75 0 00.75-.75v-4.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21a.75.75 0 00.75.75h3.75a.75.75 0 00.75-.75V9.75" />
        </svg>
      ),
    },
    {
      id: "cek-stok",
      label: "Cek Stok",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.25 7.5l-8.25-4.5L3.75 7.5m16.5 0l-8.25 4.5m8.25-4.5v9l-8.25 4.5m0-9L3.75 7.5m8.25 4.5v9m-8.25-9v9l8.25 4.5" />
        </svg>
      ),
    },
    {
      id: "data-supplier",
      label: "Data Supplier",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 21V7.5a.75.75 0 01.75-.75h6a.75.75 0 01.75.75V21m-7.5 0h15m-7.5 0V11.25a.75.75 0 01.75-.75h3.75a.75.75 0 01.75.75V21M7.5 9.75h.008v.008H7.5V9.75zm0 3h.008v.008H7.5v-.008zm0 3h.008v.008H7.5v-.008z" />
        </svg>
      ),
    },
    {
      id: "data-customer",
      label: "Data Customer",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
    {
      id: "riwayat-penjualan",
      label: "Riwayat Penjualan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 18.75a60.07 60.07 0 0116.5 0m-16.5 0V16.5a2.25 2.25 0 012.25-2.25h12a2.25 2.25 0 012.25 2.25v2.25m-16.5 0h16.5M6.75 8.25h10.5M4.5 6.75v-.75A2.25 2.25 0 016.75 3.75h10.5A2.25 2.25 0 0119.5 6v.75m-15 0h15m-15 0v6.75m15-6.75v6.75" />
        </svg>
      ),
    },
  ];

  const activeIndex = useMemo(
    () => menuItems.findIndex((item) => item.id === activeMenu),
    [activeMenu]
  );

  const indicatorStyle = useMemo(
    () => ({
      transform: `translateY(${activeIndex * 46}px)`,
      height: 40,
      opacity: 1,
    }),
    [activeIndex]
  );

  const handleLogout = () => {
    document.cookie = "isLoggedIn=; path=/; max-age=0";
    document.cookie = "cabang=; path=/; max-age=0";
    document.cookie = "username=; path=/; max-age=0";
    document.cookie = "role=; path=/; max-age=0";
    localStorage.clear();

    router.push("/login");
  };

  const formatCabang = (cabangName: string) => {
    const mapping: Record<string, string> = {
      dapur_kp_asem1: "Dapur Kp. Asem 1",
      dapurAsem1: "Dapur Kp. Asem 1",
      dapurAsem2: "Dapur Kp. Asem 2",
      bantarkawung: "Dapur Bantarkawung",
      madiun: "Madiun",
      bandung: "Bandung",
    };
    return mapping[cabangName] || cabangName;
  };

  return (
    <div className="w-64 bg-[#0B1E3D] flex flex-col h-screen">
      {/* Header Sidebar */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <img
              src="https://res.cloudinary.com/doepilwju/image/upload/v1765505991/hjs_otvbvc.png"
              alt="Logo"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Koperasi System</h1>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">
              {formatCabang(cabang)}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="relative flex-1 p-4 space-y-1">
        <div
          className="absolute left-4 right-4 rounded-lg bg-white shadow-sm pointer-events-none transition-all duration-200 ease-out"
          style={{
            top: 16,
            transform: indicatorStyle.transform,
            height: indicatorStyle.height,
            opacity: indicatorStyle.opacity,
          }}
        />

        {menuItems.map((item) => {
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`relative z-10 w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors duration-200 ease-out ${
                isActive
                  ? "text-[#0B1E3D] font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span className="transition-transform duration-300 ease-out">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-semibold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{username}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out hover:shadow-md active:scale-[0.98]"
        >
          Logout
        </button>
      </div>
    </div>
  );
}