import { siglas } from '@/lib/siglas'
import type { School } from '@/lib/types'

/**
 * Lógica portada (y simplificada para filtrar en memoria, sin ir a la
 * base) de v0-escuelas-crud (lib/search-utils.ts + app/actions/search.ts,
 * repo silvioridolfi/v0-escuelas-crud) -- ese buscador ya había resuelto
 * el mismo problema: un número de escuela ("21") no debe matchear contra
 * un CUE que por casualidad contenga esos mismos dígitos en el medio.
 */

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const SCHOOL_TYPE_SYNONYMS: Record<string, string[]> = {
  primaria: ['primaria', 'ep'],
  ep: ['primaria', 'ep'],
  secundaria: ['secundaria', 'ees', 'media'],
  ees: ['secundaria', 'ees', 'media'],
  media: ['secundaria', 'ees', 'media'],
  tecnica: ['tecnica', 'técnica'],
  técnica: ['tecnica', 'técnica'],
  jardin: ['jardin', 'jardín', 'ji', 'infantes'],
  jardín: ['jardin', 'jardín', 'ji', 'infantes'],
  infantes: ['jardin', 'jardín', 'ji', 'infantes'],
  ji: ['jardin', 'jardín', 'ji', 'infantes'],
  maternal: ['maternal', 'maternales'],
  maternales: ['maternal', 'maternales'],
  cfp: ['cfp', 'centro de formacion', 'centro de formación'],
  centro: ['cfp', 'centro de formacion', 'centro de formación'],
  especial: ['especial', 'eee'],
  eee: ['especial', 'eee'],
  adultos: ['adultos', 'cea', 'cens'],
  cea: ['adultos', 'cea', 'cens'],
  cens: ['adultos', 'cea', 'cens'],
}

function schoolTypeSynonyms(type: string): string[] {
  const normalized = normalizeText(type)
  return SCHOOL_TYPE_SYNONYMS[normalized] ?? [normalized]
}

/**
 * Matchea un número como token exacto: ni antes ni después puede tener
 * otro dígito pegado. Así "21" matchea "N° 21" pero no matchea contra un
 * CUE como "62121500" (ahí el "21" está pegado a otros dígitos a ambos
 * lados) ni contra el "403" de "N° 403".
 */
function numberTokenRegex(number: string): RegExp {
  return new RegExp(`(^|[^0-9])${number}([^0-9]|$)`)
}

function matchesToken(haystack: string, token: string): boolean {
  return /^\d+$/.test(token) ? numberTokenRegex(token).test(haystack) : haystack.includes(token)
}

const TYPE_WORDS =
  'primaria?|secundaria?|inicial|jardin|jardín|maternal(?:es)?|tecnica?|técnica?|especial|adultos?|superior|cfp|centro|ep|ees|ji'

// Las siglas de siglas.ts (EEST, ISFDyT, CEC...) también valen como
// "tipo" en una búsqueda "tipo + número" -- se arma el patrón a partir
// de esa misma lista para no mantener una segunda copia a mano de las
// abreviaturas (ver nota de "una sola fuente" en siglas.ts).
const SIGLA_WORDS = [...new Set(siglas.map(([, sigla]) => sigla))]
  .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')

const TYPE_AND_NUMBER = new RegExp(`^(${TYPE_WORDS}|${SIGLA_WORDS})\\s+n?°?\\s*(\\d{1,4})$`, 'i')

/**
 * Busca escuelas por nombre, distrito, nombre completo o CUE.
 * - Un CUE completo (8 dígitos) busca ese identificador exacto.
 * - "tipo + número" (ej. "primaria 21", "tecnica 5", "eest 3", "ees 31")
 *   exige el tipo Y el número de escuela como token exacto en el nombre
 *   -- el tipo puede ser la palabra o la sigla (ver siglas.ts).
 * - Un número solo (1 a 4 dígitos) busca ese número de escuela como
 *   token exacto -- nunca como parte de un CUE o de otro número más largo.
 * - Cualquier otra cosa es texto libre: cada palabra tiene que aparecer
 *   en nombre, distrito o nombre completo (y si una palabra es numérica,
 *   se le exige el mismo criterio de token exacto).
 * Ignora acentos en todos los casos.
 */
export function searchSchools(schools: School[], query: string, limit = 20): School[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  if (/^\d{8}$/.test(trimmed)) {
    return schools.filter((s) => String(s.cue ?? '') === trimmed).slice(0, limit)
  }

  const typeAndNumber = trimmed.match(TYPE_AND_NUMBER)
  if (typeAndNumber) {
    const tipo = typeAndNumber[1]
    const regex = numberTokenRegex(typeAndNumber[2])

    // Si lo tipeado es una sigla conocida (EEST, ISFD...), se prueba
    // directo contra los regex de siglas.ts que la producen -- la misma
    // fuente que usa escuelaCorta() para abreviar, así búsqueda y
    // abreviación nunca se desincronizan.
    const siglaRegexes = siglas
      .filter(([, sigla]) => sigla.toLowerCase() === tipo.toLowerCase())
      .map(([re]) => re)
    if (siglaRegexes.length > 0) {
      return schools
        .filter((s) => siglaRegexes.some((re) => re.test(s.nombre)) && regex.test(normalizeText(s.nombre)))
        .slice(0, limit)
    }

    const needles = schoolTypeSynonyms(tipo)
    return schools
      .filter((s) => {
        const nombre = normalizeText(s.nombre)
        return needles.some((n) => nombre.includes(n)) && regex.test(nombre)
      })
      .slice(0, limit)
  }

  if (/^\d{1,4}$/.test(trimmed)) {
    const regex = numberTokenRegex(trimmed)
    return schools.filter((s) => regex.test(normalizeText(s.nombre))).slice(0, limit)
  }

  const tokens = normalizeText(trimmed).split(' ').filter(Boolean)
  return schools
    .filter((s) => {
      const haystack = normalizeText([s.nombre, s.distrito, s.nombre_completo].filter(Boolean).join(' '))
      return tokens.every((t) => matchesToken(haystack, t))
    })
    .slice(0, limit)
}
