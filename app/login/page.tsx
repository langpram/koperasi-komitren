"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const cabangList = [
  "dapurAsem1",
  "dapurAsem2",
  "bantarkawung",
  "madiun",
  "bandung",
] as const;

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Username dan password harus diisi!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!isFirebaseConfigured) {
        throw new Error(
          "Konfigurasi Firebase belum tersedia. Tambahkan variabel NEXT_PUBLIC_FIREBASE_* di file .env.local."
        );
      }

      const q = query(
        collection(db, "users"),
        where("username", "==", username),
        where("password", "==", password)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Username atau password salah!");
        setLoading(false);
        setTimeout(() => setError(""), 3000);
        return;
      }

      const userData = snap.docs[0].data();

      const loginTs = Date.now();
      document.cookie = `isLoggedIn=true; path=/`;
      document.cookie = `cabang=${userData.cabang}; path=/`;
      document.cookie = `username=${userData.username}; path=/`;
      document.cookie = `role=${userData.role}; path=/`;
      document.cookie = `loginTs=${loginTs}; path=/`;

      localStorage.setItem("cabang", userData.cabang);
      localStorage.setItem("username", userData.username);
      localStorage.setItem("role", userData.role);

      setSuccess("Login berhasil! Mengalihkan...");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (e: any) {
      setError(`Error: ${e.message}`);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-100">
      {/* Background blur berwarna */}
      <div className="pointer-events-none absolute -top-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-orange-200/60 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-[32rem] h-[32rem] rounded-full bg-[#0B1E3D]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 w-[26rem] h-[26rem] rounded-full bg-slate-300/50 blur-3xl" />

      {/* Toast Error */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Toast Success */}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Card utama: split screen, lebar */}
      <div className="relative w-full max-w-4xl aspect-[16/10] bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-[7fr_13fr]">
        {/* KIRI - Panel Foto */}
        <div className="relative hidden md:block bg-[#0B1E3D] overflow-hidden">
          <img
            src="https://res.cloudinary.com/dnh5owdpa/image/upload/v1789093112/login_koperasi_zou9lp.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* KANAN - Form Login */}
        <div className="flex flex-col justify-center px-8 py-8 sm:px-12">
          <div className="w-full max-w-xs mx-auto">
            {/* Logo */}
            <div className="mb-6">
              <img
                src="https://res.cloudinary.com/doepilwju/image/upload/v1765505991/hjs_otvbvc.png"
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
            </div>

            <h1 className="text-2xl font-semibold text-[#0B1E3D] mb-1">Login</h1>
            <p className="text-slate-500 text-sm mb-6">
              Silakan Login untuk melanjutkan ke dashboard.
            </p>

            {/* Form */}
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E3D]/20 focus:border-[#0B1E3D] outline-none bg-white text-slate-800 transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full px-4 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E3D]/20 focus:border-[#0B1E3D] outline-none bg-white text-slate-800 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#0B1E3D] hover:bg-[#0d2650] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition shadow-md mt-1"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </div>
          </div>
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