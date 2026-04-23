/**
 * js/modules/live-search.js
 * ─────────────────────────────────────────────────────────────────
 * Providers de recherche OSINT en temps réel.
 * Toutes les APIs sont publiques, CORS-enabled, sans clé requise.
 *
 * Providers disponibles :
 *   - ip       → ipwho.is         (géoloc IP + ASN)
 *   - domain   → dns.google       (DNS A/MX/TXT) + ipwho.is (IPs résolues)
 *   - github   → api.github.com   (profil + dépôts récents)
 *   - geocode  → nominatim OSM    (géocodage d'adresses / lieux)
 *   - certs    → crt.sh           (certificats SSL d'un domaine)
 * ─────────────────────────────────────────────────────────────────
 */

const TIMEOUT_MS = 9000;

/* ── Fetch avec timeout et gestion d'erreur normalisée ─────────── */
async function apiFetch(url, options = {}) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(tid);
    if (!r.ok) throw new Error(`HTTP ${r.status} — ${r.statusText}`);
    return await r.json();
  } catch (err) {
    clearTimeout(tid);
    if (err.name === 'AbortError') throw new Error('Timeout (9s) — API non disponible');
    throw err;
  }
}

/* ────────────────────────────────────────────────────────────────
   PROVIDERS
   ──────────────────────────────────────────────────────────────── */

const PROVIDERS = [

  /* ── 1. IP Lookup ──────────────────────────────────────────── */
  {
    id:    'ip',
    label: 'IP Lookup',
    icon:  '⬡',
    hint:  'Ex: 8.8.8.8',
    color: '#00e5ff',
    detect: q => /^(\d{1,3}\.){3}\d{1,3}$/.test(q.trim()),

    async run(query) {
      const ip   = query.trim();
      const data = await apiFetch(`https://ipwho.is/${ip}`);
      if (!data.success) throw new Error(data.message || `IP "${ip}" invalide ou privée`);

      return [{
        id:       `LIVE-IP-${ip.replace(/\./g, '_')}`,
        type:     'LOCATION',
        name:     `IP ${data.ip}`,
        subtitle: `${data.city || '—'}, ${data.country || '—'} · AS${data.connection?.asn ?? '?'}`,
        risk:     null,
        status:   'LIVE',
        lat:      data.latitude  ?? null,
        lng:      data.longitude ?? null,
        props: {
          'Adresse IP':     data.ip,
          'Type':           data.type ?? '—',
          'ISP':            data.connection?.isp  ?? '—',
          'ASN':            `AS${data.connection?.asn ?? '?'}`,
          'Organisation':   data.connection?.org  ?? '—',
          'Pays':           `${data.flag?.emoji ?? ''} ${data.country ?? '—'} (${data.country_code ?? '—'})`,
          'Région':         data.region  ?? '—',
          'Ville':          data.city    ?? '—',
          'Code postal':    data.postal  ?? '—',
          'Fuseau horaire': data.timezone?.id ?? '—',
          'Latitude':       data.latitude  ?? '—',
          'Longitude':      data.longitude ?? '—',
        },
        _provider: 'IP Lookup · ipwho.is',
        _live: true,
      }];
    },
  },

  /* ── 2. Domain / DNS Lookup ────────────────────────────────── */
  {
    id:    'domain',
    label: 'DNS / Domain',
    icon:  '◈',
    hint:  'Ex: github.com',
    color: '#a78bfa',
    detect: q =>
      /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(q.trim()) &&
      !/^(\d{1,3}\.){3}\d{1,3}$/.test(q.trim()),

    async run(query) {
      const domain = query.trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*/, '');

      /* DNS parallèle A / MX / TXT / NS */
      const [resA, resMX, resTXT, resNS] = await Promise.allSettled([
        apiFetch(`https://dns.google/resolve?name=${domain}&type=A`),
        apiFetch(`https://dns.google/resolve?name=${domain}&type=MX`),
        apiFetch(`https://dns.google/resolve?name=${domain}&type=TXT`),
        apiFetch(`https://dns.google/resolve?name=${domain}&type=NS`),
      ]);

      const aRecs  = resA.status   === 'fulfilled' ? (resA.value.Answer   ?? []) : [];
      const mxRecs = resMX.status  === 'fulfilled' ? (resMX.value.Answer  ?? []) : [];
      const txtRecs= resTXT.status === 'fulfilled' ? (resTXT.value.Answer ?? []) : [];
      const nsRecs = resNS.status  === 'fulfilled' ? (resNS.value.Answer  ?? []) : [];

      if (!aRecs.length && !mxRecs.length)
        throw new Error(`Domaine "${domain}" introuvable (NXDOMAIN)`);

      const results = [];

      /* Entité principale — domaine */
      results.push({
        id:       `LIVE-DOMAIN-${domain.replace(/\./g, '_')}`,
        type:     'ORG',
        name:     domain,
        subtitle: `Domaine · ${aRecs.length} A · ${mxRecs.length} MX · ${nsRecs.length} NS`,
        risk:     null,
        status:   'LIVE',
        lat:      null,
        lng:      null,
        props: {
          'Domaine':            domain,
          'Enreg. A (IPs)':    aRecs.map(r => r.data).join(', ')  || '—',
          'TTL (A)':           aRecs[0]?.TTL ? `${aRecs[0].TTL}s` : '—',
          'Enreg. MX':         mxRecs.map(r => r.data).join(' | ') || '—',
          'Enreg. NS':         nsRecs.map(r => r.data).join(', ') || '—',
          'Enreg. TXT':        txtRecs.map(r => r.data.replace(/"/g, '')).slice(0, 3).join(' | ') || '—',
          'SPF':               txtRecs.find(r => r.data.includes('v=spf1'))?.data.replace(/"/g, '').slice(0, 80) ?? '—',
          'DMARC indice':      txtRecs.find(r => r.data.includes('v=DMARC1')) ? '✓ DMARC détecté' : '✗ Absent',
        },
        _provider: 'DNS Lookup · dns.google',
        _live: true,
      });

      /* IPs résolues → géoloc */
      for (const rec of aRecs.slice(0, 2)) {
        try {
          const ipData = await apiFetch(`https://ipwho.is/${rec.data}`);
          if (ipData.success) {
            results.push({
              id:       `LIVE-IP-${rec.data.replace(/\./g, '_')}`,
              type:     'LOCATION',
              name:     `IP ${rec.data}`,
              subtitle: `${ipData.city ?? '—'}, ${ipData.country ?? '—'} · ${ipData.connection?.isp ?? '—'}`,
              risk:     null,
              status:   'LIVE',
              lat:      ipData.latitude  ?? null,
              lng:      ipData.longitude ?? null,
              props: {
                'Adresse IP':   rec.data,
                'ISP':          ipData.connection?.isp  ?? '—',
                'ASN':          `AS${ipData.connection?.asn ?? '?'}`,
                'Organisation': ipData.connection?.org  ?? '—',
                'Pays':         `${ipData.flag?.emoji ?? ''} ${ipData.country ?? '—'}`,
                'Ville':        ipData.city ?? '—',
              },
              _provider: 'IP Lookup · ipwho.is',
              _live: true,
            });
          }
        } catch { /* IP lookup non bloquante */ }
      }

      return results;
    },
  },

  /* ── 3. GitHub Profile ─────────────────────────────────────── */
  {
    id:    'github',
    label: 'GitHub Profile',
    icon:  '◎',
    hint:  'Ex: torvalds ou @torvalds',
    color: '#00c896',
    detect: q =>
      /^@?[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i.test(q.trim()) &&
      !q.includes('.') &&
      q.length >= 2,

    async run(query) {
      const username = query.trim().replace(/^@/, '');

      const [userData, reposData] = await Promise.allSettled([
        apiFetch(`https://api.github.com/users/${username}`),
        apiFetch(`https://api.github.com/users/${username}/repos?per_page=5&sort=updated&type=public`),
      ]);

      if (userData.status !== 'fulfilled') throw userData.reason;
      const user = userData.value;
      if (user.message === 'Not Found') throw new Error(`Utilisateur GitHub "@${username}" introuvable`);

      const repos  = reposData.status === 'fulfilled' ? (reposData.value ?? []) : [];
      const results = [];

      /* Entité utilisateur */
      results.push({
        id:       `LIVE-GH-${username.toLowerCase()}`,
        type:     'PERSON',
        name:     user.name || `@${user.login}`,
        subtitle: `GitHub @${user.login} · ${user.public_repos} dépôts · ${user.followers} followers`,
        risk:     null,
        status:   'LIVE',
        lat:      null,
        lng:      null,
        props: {
          'Login':             `@${user.login}`,
          'Nom complet':       user.name  ?? '—',
          'Bio':               user.bio   ? user.bio.slice(0, 100) : '—',
          'Localisation':      user.location ?? '—',
          'Email public':      user.email    ?? '—',
          'Site / Blog':       user.blog     ?? '—',
          'Dépôts publics':    user.public_repos,
          'Gists publics':     user.public_gists,
          'Followers':         user.followers,
          'Following':         user.following,
          'Entreprise':        user.company  ?? '—',
          'Compte créé':       user.created_at?.slice(0, 10) ?? '—',
          'Dernière activité': user.updated_at?.slice(0, 10) ?? '—',
          'Type de compte':    user.type === 'Organization' ? 'Organisation' : 'Utilisateur',
          'Profil':            user.html_url,
        },
        _provider: 'GitHub API · api.github.com',
        _avatar:   user.avatar_url,
        _url:      user.html_url,
        _live:     true,
      });

      /* Dépôts récents → entités EVENT */
      repos.slice(0, 3).forEach(repo => {
        results.push({
          id:       `LIVE-REPO-${repo.id}`,
          type:     'EVENT',
          name:     repo.name,
          subtitle: `Dépôt · ⭐ ${repo.stargazers_count} · ${repo.language ?? 'N/A'} · @${username}`,
          risk:     null,
          status:   'LIVE',
          lat:      null,
          lng:      null,
          props: {
            'Dépôt':            repo.full_name,
            'Description':      repo.description ? repo.description.slice(0, 100) : '—',
            'Langage':          repo.language ?? '—',
            'Stars':            repo.stargazers_count,
            'Forks':            repo.forks_count,
            'Issues ouvertes':  repo.open_issues_count,
            'Branche défaut':   repo.default_branch ?? '—',
            'Mise à jour':      repo.updated_at?.slice(0, 10) ?? '—',
            'Créé le':          repo.created_at?.slice(0, 10) ?? '—',
            'Visibilité':       repo.private ? 'Privé' : 'Public',
            'URL':              repo.html_url,
          },
          _provider: 'GitHub API · api.github.com',
          _url:      repo.html_url,
          _live:     true,
        });
      });

      return results;
    },
  },

  /* ── 4. Géocodage (Nominatim / OSM) ───────────────────────── */
  {
    id:    'geocode',
    label: 'Géocodage',
    icon:  '◉',
    hint:  'Ex: Tour Eiffel Paris',
    color: '#ffb300',
    detect: () => false, /* sélection manuelle uniquement */

    async run(query) {
      const data = await apiFetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'fr,en', 'User-Agent': 'NEXUS-Intelligence/1.0' } }
      );
      if (!data.length) throw new Error(`Aucun lieu trouvé pour "${query}"`);

      return data.slice(0, 4).map((place, i) => ({
        id:       `LIVE-GEO-${place.place_id}`,
        type:     'LOCATION',
        name:     place.display_name.split(',')[0].trim(),
        subtitle: place.display_name.slice(0, 90),
        risk:     null,
        status:   'LIVE',
        lat:      parseFloat(place.lat),
        lng:      parseFloat(place.lon),
        props: {
          'Nom':          place.display_name.split(',').slice(0, 2).join(',').trim(),
          'Type OSM':     place.type  ?? '—',
          'Classe OSM':   place.class ?? '—',
          'Latitude':     place.lat,
          'Longitude':    place.lon,
          'Pays':         place.address?.country ?? '—',
          'Code pays':    place.address?.country_code?.toUpperCase() ?? '—',
          'État / Région':place.address?.state ?? '—',
          'Ville':        place.address?.city ?? place.address?.town ?? place.address?.village ?? '—',
          'Code postal':  place.address?.postcode ?? '—',
          'Importance':   place.importance ? `${(place.importance * 100).toFixed(0)}%` : '—',
        },
        _provider: 'Géocodage · Nominatim / OSM',
        _live:     true,
      }));
    },
  },

  /* ── 5. Certificats SSL (crt.sh) ──────────────────────────── */
  {
    id:    'certs',
    label: 'Certificats SSL',
    icon:  '◇',
    hint:  'Ex: example.com',
    color: '#ff3b57',
    detect: () => false, /* sélection manuelle uniquement */

    async run(query) {
      const domain = query.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*/, '');

      /* crt.sh peut avoir des problèmes CORS selon les navigateurs */
      let data;
      try {
        data = await apiFetch(`https://crt.sh/?q=%.${domain}&output=json`);
      } catch (err) {
        throw new Error(`crt.sh inaccessible (CORS ou timeout) : ${err.message}`);
      }

      if (!data?.length) throw new Error(`Aucun certificat trouvé pour "${domain}"`);

      /* Déduplique par common_name */
      const seen = new Set();
      const certs = data
        .filter(c => { const k = c.common_name; if (seen.has(k)) return false; seen.add(k); return true; })
        .slice(0, 6);

      return certs.map(cert => ({
        id:       `LIVE-CERT-${cert.id}`,
        type:     'EVENT',
        name:     cert.common_name ?? domain,
        subtitle: `Certificat SSL · ${cert.issuer_name?.slice(0, 60) ?? '—'}`,
        risk:     null,
        status:   'LIVE',
        lat:      null,
        lng:      null,
        props: {
          'Common Name':  cert.common_name ?? '—',
          'Emetteur':     cert.issuer_name ?? '—',
          'Enregistré':   cert.entry_timestamp?.slice(0, 10) ?? '—',
          'Valide depuis':cert.not_before?.slice(0, 10)  ?? '—',
          'Valide jusqu': cert.not_after?.slice(0, 10)   ?? '—',
          'ID crt.sh':    cert.id?.toString() ?? '—',
        },
        _provider: 'Certificats SSL · crt.sh',
        _url:      `https://crt.sh/?id=${cert.id}`,
        _live:     true,
      }));
    },
  },

];

/* ────────────────────────────────────────────────────────────────
   EXPORT PRINCIPAL
   ──────────────────────────────────────────────────────────────── */

/**
 * Exécute une recherche OSINT avec auto-détection ou provider forcé.
 *
 * @param {string} query      Requête utilisateur
 * @param {string} forceType  'AUTO' | 'ip' | 'domain' | 'github' | 'geocode' | 'certs'
 * @returns {{ provider: string, results: object[] }}
 */
export async function runLiveSearch(query, forceType = 'AUTO') {
  const q = query.trim();
  if (!q) throw new Error('Requête vide');

  let provider;
  if (forceType === 'AUTO') {
    provider = PROVIDERS.find(p => p.detect(q));
    if (!provider) {
      /* Fallback : géocodage pour tout ce qui ressemble à une requête textuelle */
      provider = PROVIDERS.find(p => p.id === 'geocode');
    }
  } else {
    provider = PROVIDERS.find(p => p.id === forceType);
  }

  if (!provider) throw new Error(`Provider inconnu : "${forceType}"`);

  const results = await provider.run(q);
  return { provider: provider.label, providerColor: provider.color, results };
}

export { PROVIDERS };
