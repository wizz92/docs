export function sortDomains(domains, masterIndex) {
  if (!masterIndex?.domains || !Array.isArray(domains)) return domains || [];

  const orderMap = new Map(masterIndex.domains.map((d, index) => [d.id, index]));

  return [...domains].sort((a, b) => {
    const aPos = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bPos = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER;
    return aPos - bPos;
  });
}

