import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const users = [
  ['Ludmila Tiziana Kovach', 'ludmilakvch@gmail.com', '48288827', 'Grupo 1', false],
  ['Brian José Terraza Cucolo', 'briantec8@gmail.com', '48288668', 'Grupo 1', false],
  ['Hada Lorena Padrozo Martinez', 'hadalorem@gmail.com', '95884447', 'Grupo 1', false],
  ['Santiago Leonel Caceres', 'sc267225@gmail.com', '48578653', 'Grupo 1', false],
  ['Thiago Santino Aguilera', 'thiiagoaguiilera.3.8@gmail.com', '48650010', 'Grupo 1', false],
  ['Tomás Alejandro Simonetti', 'tomassimonetti216@gmail.com', '48841814', 'Grupo 1', false],
  ['Alexis Javier Pinilla', 'alexispinilla75724@gmail.com', '48649282', 'Grupo 2', false],
  ['Axel Ezequiel Lorensetti', 'lorenzettiaxel408@gmail.com', '48365015', 'Grupo 2', false],
  ['Benjamín Leal', 'Pechiiileal@gmail.com', '48501904', 'Grupo 2', false],
  ['Felipe Calascibetta', 'felicalascibetta14@gmail.com', '48573872', 'Grupo 2', false],
  ['Francisco Ezequiel Mottin', 'franmottin10@gmail.com', '48380242', 'Grupo 2', false],
  ['Alma Sophia Cappelletti', 'sophiacappelletti.teipp@gmail.com', '47739772', 'Grupo 2', false],
  ['Silvio Ridolfi', 'silvioridolfi@abc.gob.ar', '34128629', null, true],
]

for (const [fullName, email, password, grupo, isAdmin] of users) {
  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const current = existing.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
  let userId = current?.id

  if (current) {
    const { error } = await supabase.auth.admin.updateUserById(current.id, {
      password,
      email_confirm: true,
      user_metadata: { apellido_nombre: fullName, grupo, is_admin: isAdmin },
    })
    if (error) throw new Error(`${email}: ${error.message}`)
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { apellido_nombre: fullName, grupo, is_admin: isAdmin },
    })
    if (error) throw new Error(`${email}: ${error.message}`)
    userId = data.user.id
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    apellido_nombre: fullName,
    grupo,
    is_admin: isAdmin,
    password_change_required: true,
  })
  if (profileError) throw new Error(`${email} profile: ${profileError.message}`)
  console.log(`[v0] Cuenta configurada: ${email}`)
}

console.log('[v0] Carga inicial completa: 13 cuentas')
