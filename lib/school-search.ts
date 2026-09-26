import type { School } from '@/lib/types'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Busca escuelas por nombre, distrito o CUE. A diferencia de un
 * `.includes(query)` de la frase completa, exige que cada PALABRA de la
 * búsqueda aparezca en algún lado -- así "primaria 21" encuentra
 * "ESCUELA DE EDUCACIÓN PRIMARIA N° 21 ..." aunque el "N°" se meta en
 * el medio y corte la subcadena literal. También ignora acentos, para
 * que "penaloza" encuentre "PEÑALOZA".
 */
export function searchSchools(schools: School[], query: string, limit = 20): School[] {
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []
  return schools
    .filter((s) => {
      const haystack = normalize([s.nombre, s.distrito, s.nombre_completo, s.cue].filter(Boolean).join(' '))
      return tokens.every((t) => haystack.includes(t))
    })
    .slice(0, limit)
}
