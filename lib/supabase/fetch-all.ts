/**
 * Supabase/PostgREST corta cualquier .select() a un máximo de 1000 filas
 * por defecto, SIN avisar con ningún error -- simplemente devuelve las
 * primeras 1000 (según el orden interno) y listo. Para tablas que ya
 * superan ese número (como work_order_events, que crece con cada paso
 * completado), esto corta silenciosamente los datos más recientes,
 * dando resultados incompletos sin que nada lo señale.
 *
 * Este helper pagina con .range() hasta agotar las filas reales,
 * sin importar cuántas sean.
 */
export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await buildQuery(from, from + pageSize - 1)
    if (error) throw error
    const rows = data ?? []
    all.push(...rows)
    if (rows.length < pageSize) break
    from += pageSize
  }
  return all
}
