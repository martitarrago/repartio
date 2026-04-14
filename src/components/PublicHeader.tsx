import Link from "next/link";
import Image from "next/image";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/logo.svg" alt="Repartio" width={110} height={32} style={{ width: 110, height: "auto" }} />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/register" className="text-sm font-medium px-4 py-1.5 rounded-lg bg-gray-900 text-white hover:opacity-90 transition-opacity">
            Empezar gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
