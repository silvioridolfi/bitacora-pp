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
      <Image
        src="/images/vineta-practicas-profesionalizantes-dte.png"
        alt=""
        aria-hidden
        width={951}
        height={500}
        className="pointer-events-none absolute -bottom-4 -left-4 hidden w-32 opacity-70 sm:block md:w-44"
      />

      <div className="relative flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="flex w-full max-w-lg flex-col items-center">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div
              className="flex w-full flex-col items-center gap-2 rounded-2xl border border-border/40 px-8 py-6 shadow-lg"
              style={{ background: 'var(--gradient-brand-header)' }}
            >
              <h1 className="font-heading text-xl font-bold leading-tight text-white sm:text-2xl">
                Prácticas Educativas en Ambientes de Trabajo
              </h1>
              <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                Dirección de Tecnología Educativa
              </span>
            </div>
          </div>
          <div className="w-full max-w-sm shadow-2xl shadow-black/20">{children}</div>
        </div>
      </div>

      <footer
        className="relative flex w-full items-center justify-center px-6 py-5"
        style={{ background: 'var(--gradient-auth-footer)' }}
      >
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_DTE_2026_v2-xxhHPy2btG6IR0PVoYAzc0QUngmBcO.png"
          alt="Dirección de Tecnología Educativa — Dirección General de Cultura y Educación — Gobierno de la Provincia de Buenos Aires"
          width={1030}
          height={142}
          className="h-auto max-h-16 w-auto max-w-[92vw] object-contain sm:max-h-[5.5rem]"
          priority
        />
      </footer>
    </div>
  )
}
