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
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="rounded-2xl border border-border/40 bg-card px-6 py-4 shadow-lg">
              <Image
                src="/images/logo-practicas-profesionalizantes-dte.png"
                alt="Prácticas Profesionalizantes en la Dirección de Tecnología Educativa (DTE)"
                width={1920}
                height={176}
                className="h-auto w-full max-w-[320px]"
                priority
              />
            </div>
            <span className="font-heading text-sm font-semibold tracking-wide text-accent uppercase">
              DTE · Región 1
            </span>
            <p className="text-sm text-primary-foreground/70">EEST N°3</p>
          </div>
          {children}
        </div>
      </div>

      <footer className="relative flex w-full items-center justify-center px-6 py-8">
        <div
          className="flex w-full max-w-xl items-center justify-center rounded-2xl px-8 py-5 shadow-lg sm:max-w-2xl"
          style={{
            background: 'linear-gradient(90deg, #e81f76 0%, #417099 50%, #00aec3 100%)',
          }}
        >
          <Image
            src="/images/logo-dte-2026.png"
            alt="Dirección de Tecnología Educativa — Gobierno de la Provincia de Buenos Aires"
            width={864}
            height={152}
            className="h-auto w-full max-w-md"
            priority
          />
        </div>
      </footer>
    </div>
  )
}
