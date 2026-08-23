import type { ReactNode } from 'react'
import Image from 'next/image'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh w-full flex-col overflow-hidden bg-primary">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/bk-practicas-profesionalizantes-dte.png')",
        }}
      />
      <Image
        src="/images/vineta-2-practicas-profesionalizantes-dte.png"
        alt=""
        aria-hidden
        width={544}
        height={457}
        className="pointer-events-none absolute -top-6 -right-6 hidden w-28 opacity-90 sm:block md:w-36"
      />

      <div className="relative flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="flex w-full max-w-lg flex-col items-center">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="rounded-2xl border border-border/40 bg-card px-6 py-4 shadow-lg">
              <Image
                src="/images/logo-practicas-profesionalizantes-dte.png"
                alt="Prácticas Profesionalizantes en la Dirección de Tecnología Educativa (DTE)"
                width={1920}
                height={176}
                className="h-auto w-full max-w-[512px]"
                priority
              />
            </div>
          </div>
          <div className="w-full max-w-sm shadow-2xl shadow-black/20">{children}</div>
        </div>
      </div>

      <footer
        className="relative flex w-full items-center justify-center px-6 py-5"
        style={{
          background: 'linear-gradient(90deg, #e81f76 0%, #417099 50%, #00aec3 100%)',
        }}
      >
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_DTE_2026_v2-xxhHPy2btG6IR0PVoYAzc0QUngmBcO.png"
          alt="Dirección de Tecnología Educativa — Dirección General de Cultura y Educación — Gobierno de la Provincia de Buenos Aires"
          width={1024}
          height={160}
          className="h-[3.7rem] w-auto"
          priority
        />
      </footer>
    </div>
  )
}
