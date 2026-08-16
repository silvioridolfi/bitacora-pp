import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams
  // `error` comes from the URL, so it is attacker-controlled. Render it only
  // when it looks like a Supabase error code, never as free text someone can
  // choose — otherwise this card will happily display their phishing copy.
  const code = params?.error
  const isErrorCode = typeof code === 'string' && /^[a-z0-9_]{1,64}$/.test(code)

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-2xl">
                Ocurrió un error
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isErrorCode ? (
                <p className="text-sm text-muted-foreground">
                  Código de error: {code}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ocurrió un error no especificado.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
