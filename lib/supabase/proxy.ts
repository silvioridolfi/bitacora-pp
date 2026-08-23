import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Interruptor temporal para pruebas: deshabilita todas las redirecciones
  // de autenticación. Volver a poner en "false" (o eliminar la variable)
  // para reactivar el sistema de login.
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return NextResponse.next({ request })
  }

  // Los headers x-user-id / x-user-email / x-profile-json solo deben
  // poder ser seteados por este middleware, nunca por el cliente -- si
  // alguien los manda directo en el request, se descartan acá antes de
  // cualquier otra cosa.
  request.headers.delete('x-user-id')
  request.headers.delete('x-user-email')
  request.headers.delete('x-profile-json')

  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'bitacora_pp' },
      // Secure cookies in production; not in dev, so localhost still works.
      cookieOptions: { secure: process.env.NODE_ENV === 'production' },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // El registro público está deshabilitado para todos los visitantes,
  // independientemente de que exista o no una sesión activa.
  if (pathname === '/auth/sign-up' || pathname.startsWith('/auth/sign-up/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('message', 'El registro público no está disponible.')
    return NextResponse.redirect(url)
  }

  const isAuthRoute = pathname.startsWith('/auth')
  const isPublicRoute = pathname === '/' || isAuthRoute

  if (!user && !isPublicRoute) {
    // No hay sesión y se intenta acceder a una página protegida de la app.
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname.startsWith('/auth/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && !pathname.startsWith('/auth/change-password-required')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.password_change_required) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/change-password-required'
      return NextResponse.redirect(url)
    }

    // Evita que cada página server-side tenga que volver a llamar a
    // auth.getUser() + consultar profiles: el middleware ya hizo esa
    // validación, así que se la pasamos lista via headers del REQUEST
    // (no de la respuesta -- si no, el Server Component nunca los ve).
    request.headers.set('x-user-id', user.id)
    request.headers.set('x-user-email', user.email ?? '')
    if (profile) {
      request.headers.set('x-profile-json', encodeURIComponent(JSON.stringify(profile)))
    }
    const responseWithHeaders = NextResponse.next({ request })
    supabaseResponse.cookies.getAll().forEach((c) => responseWithHeaders.cookies.set(c))
    supabaseResponse = responseWithHeaders
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
