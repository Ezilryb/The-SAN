// =============================================================================
// FILE: assets/js/tools/person-search.js
// DESC: Outil Recherche de Personnes & Profils — moteur OSINT multi-sources
//       Username search (300+ plateformes), Person search, Email discovery
// =============================================================================

'use strict';

// =============================================================================
// BASE DE DONNÉES DES PLATEFORMES (300+ entrées)
// =============================================================================

const PLATFORMS_DB = {

  // ─── RÉSEAUX SOCIAUX MAJEURS ───────────────────────────────────────────────
  social: {
    label: 'Réseaux Sociaux',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>`,
    platforms: [
      { id: 'twitter',     name: 'X (Twitter)',    url: 'https://x.com/{q}',                  tags: ['micro-blog'] },
      { id: 'instagram',   name: 'Instagram',      url: 'https://instagram.com/{q}',           tags: ['photos'] },
      { id: 'facebook',    name: 'Facebook',        url: 'https://facebook.com/{q}',            tags: ['social'] },
      { id: 'linkedin',    name: 'LinkedIn',        url: 'https://linkedin.com/in/{q}',         tags: ['pro'] },
      { id: 'tiktok',      name: 'TikTok',          url: 'https://tiktok.com/@{q}',             tags: ['vidéo'] },
      { id: 'snapchat',    name: 'Snapchat',        url: 'https://snapchat.com/add/{q}',        tags: ['éphémère'] },
      { id: 'pinterest',   name: 'Pinterest',       url: 'https://pinterest.com/{q}',           tags: ['visuel'] },
      { id: 'reddit',      name: 'Reddit',          url: 'https://reddit.com/user/{q}',         tags: ['forum'] },
      { id: 'tumblr',      name: 'Tumblr',          url: 'https://{q}.tumblr.com',              tags: ['blog'] },
      { id: 'mastodon',    name: 'Mastodon',        url: 'https://mastodon.social/@{q}',        tags: ['fediverse'] },
      { id: 'threads',     name: 'Threads',         url: 'https://threads.net/@{q}',            tags: ['micro-blog'] },
      { id: 'bluesky',     name: 'Bluesky',         url: 'https://bsky.app/profile/{q}.bsky.social', tags: ['décentralisé'] },
      { id: 'mewe',        name: 'MeWe',            url: 'https://mewe.com/i/{q}',              tags: ['social'] },
      { id: 'gab',         name: 'Gab',             url: 'https://gab.com/{q}',                 tags: ['social'] },
      { id: 'parler',      name: 'Parler',          url: 'https://parler.com/{q}',              tags: ['social'] },
      { id: 'gettr',       name: 'GETTR',           url: 'https://gettr.com/user/{q}',          tags: ['social'] },
      { id: 'truthsocial', name: 'Truth Social',    url: 'https://truthsocial.com/@{q}',        tags: ['social'] },
      { id: 'diaspora',    name: 'Diaspora*',       url: 'https://diaspora.social/people/{q}',  tags: ['fediverse'] },
      { id: 'minds',       name: 'Minds',           url: 'https://www.minds.com/{q}',           tags: ['social'] },
      { id: 'ello',        name: 'Ello',            url: 'https://ello.co/{q}',                 tags: ['créatif'] },
    ]
  },

  // ─── VIDÉO & STREAMING ────────────────────────────────────────────────────
  video: {
    label: 'Vidéo & Streaming',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
    platforms: [
      { id: 'youtube',      name: 'YouTube',         url: 'https://youtube.com/@{q}',            tags: ['vidéo'] },
      { id: 'twitch',       name: 'Twitch',          url: 'https://twitch.tv/{q}',               tags: ['live', 'gaming'] },
      { id: 'vimeo',        name: 'Vimeo',           url: 'https://vimeo.com/{q}',               tags: ['vidéo'] },
      { id: 'dailymotion',  name: 'Dailymotion',     url: 'https://dailymotion.com/{q}',         tags: ['vidéo'] },
      { id: 'odysee',       name: 'Odysee',          url: 'https://odysee.com/@{q}',             tags: ['décentralisé'] },
      { id: 'rumble',       name: 'Rumble',          url: 'https://rumble.com/c/{q}',            tags: ['vidéo'] },
      { id: 'bitchute',     name: 'BitChute',        url: 'https://bitchute.com/channel/{q}',    tags: ['vidéo'] },
      { id: 'peertube',     name: 'PeerTube',        url: 'https://tube.tchncs.de/a/{q}',        tags: ['fediverse'] },
      { id: 'kick',         name: 'Kick',            url: 'https://kick.com/{q}',                tags: ['live'] },
      { id: 'streamlabs',   name: 'Streamlabs',      url: 'https://streamlabs.com/{q}',          tags: ['live'] },
      { id: 'trovo',        name: 'Trovo',           url: 'https://trovo.live/{q}',              tags: ['live', 'gaming'] },
      { id: 'dlive',        name: 'DLive',           url: 'https://dlive.tv/{q}',                tags: ['live'] },
    ]
  },

  // ─── PHOTOS & CRÉATIFS ────────────────────────────────────────────────────
  creative: {
    label: 'Photos & Créatifs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    platforms: [
      { id: 'flickr',       name: 'Flickr',          url: 'https://flickr.com/people/{q}',       tags: ['photos'] },
      { id: '500px',        name: '500px',           url: 'https://500px.com/p/{q}',             tags: ['photos', 'pro'] },
      { id: 'behance',      name: 'Behance',         url: 'https://behance.net/{q}',             tags: ['design', 'portfolio'] },
      { id: 'dribbble',     name: 'Dribbble',        url: 'https://dribbble.com/{q}',            tags: ['design'] },
      { id: 'deviantart',   name: 'DeviantArt',      url: 'https://deviantart.com/{q}',          tags: ['art'] },
      { id: 'artstation',   name: 'ArtStation',      url: 'https://artstation.com/{q}',          tags: ['art', 'jeux'] },
      { id: 'pixiv',        name: 'Pixiv',           url: 'https://pixiv.net/en/users/{q}',      tags: ['art', 'manga'] },
      { id: 'vsco',         name: 'VSCO',            url: 'https://vsco.co/{q}',                 tags: ['photos'] },
      { id: 'unsplash',     name: 'Unsplash',        url: 'https://unsplash.com/@{q}',           tags: ['photos', 'stock'] },
      { id: 'redbubble',    name: 'Redbubble',       url: 'https://redbubble.com/people/{q}',    tags: ['art', 'vente'] },
      { id: 'society6',     name: 'Society6',        url: 'https://society6.com/{q}',            tags: ['art', 'vente'] },
      { id: 'smugmug',      name: 'SmugMug',         url: 'https://{q}.smugmug.com',             tags: ['photos'] },
      { id: 'imgur',        name: 'Imgur',           url: 'https://imgur.com/user/{q}',          tags: ['images'] },
      { id: 'canva',        name: 'Canva',           url: 'https://canva.com/{q}',               tags: ['design'] },
      { id: 'figma',        name: 'Figma',           url: 'https://figma.com/@{q}',              tags: ['design', 'UI'] },
    ]
  },

  // ─── GAMING ───────────────────────────────────────────────────────────────
  gaming: {
    label: 'Gaming',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`,
    platforms: [
      { id: 'steam',        name: 'Steam',           url: 'https://steamcommunity.com/id/{q}',   tags: ['PC'] },
      { id: 'epicgames',    name: 'Epic Games',      url: 'https://store.epicgames.com/u/{q}',   tags: ['PC'] },
      { id: 'roblox',       name: 'Roblox',          url: 'https://roblox.com/user.aspx?username={q}', tags: ['plateforme'] },
      { id: 'minecraft',    name: 'NameMC',          url: 'https://namemc.com/profile/{q}',      tags: ['Minecraft'] },
      { id: 'origin',       name: 'EA / Origin',     url: 'https://myaccount.ea.com/cp-ui/aboutme/index#{q}', tags: ['EA'] },
      { id: 'ubisoft',      name: 'Ubisoft',         url: 'https://ubisoftconnect.com/en-US/users/{q}', tags: ['Ubisoft'] },
      { id: 'gog',          name: 'GOG',             url: 'https://gog.com/u/{q}',               tags: ['PC'] },
      { id: 'itch',         name: 'itch.io',         url: 'https://{q}.itch.io',                 tags: ['indie'] },
      { id: 'gamejolt',     name: 'Game Jolt',       url: 'https://gamejolt.com/@{q}',           tags: ['indie'] },
      { id: 'chess',        name: 'Chess.com',       url: 'https://chess.com/member/{q}',        tags: ['échecs'] },
      { id: 'lichess',      name: 'Lichess',         url: 'https://lichess.org/@{q}',            tags: ['échecs'] },
      { id: 'battlenet',    name: 'Battle.net',      url: 'https://battle.net',                  tags: ['Blizzard'], note: 'Rechercher {q} sur Battle.net' },
      { id: 'geoguessr',    name: 'GeoGuessr',       url: 'https://geoguessr.com/user/{q}',      tags: ['géo'] },
      { id: 'speedrun',     name: 'Speedrun.com',    url: 'https://speedrun.com/users/{q}',      tags: ['speedrun'] },
      { id: 'gamespot',     name: 'GameSpot',        url: 'https://gamespot.com/profile/{q}',    tags: ['news'] },
      { id: 'ign',          name: 'IGN',             url: 'https://ign.com/boards/profile/{q}',  tags: ['news'] },
      { id: 'gamefaqs',     name: 'GameFAQs',        url: 'https://gamefaqs.gamespot.com/community/{q}', tags: ['forum'] },
      { id: 'nexusmods',    name: 'Nexus Mods',      url: 'https://nexusmods.com/users/{q}',     tags: ['mods'] },
      { id: 'curseforge',   name: 'CurseForge',      url: 'https://curseforge.com/members/{q}',  tags: ['mods'] },
      { id: 'faceit',       name: 'FACEIT',          url: 'https://faceit.com/en/players/{q}',   tags: ['esport', 'CS'] },
      { id: 'hltv',         name: 'HLTV',            url: 'https://hltv.org/search#query={q}&-type=player', tags: ['esport', 'CS'] },
      { id: 'tracker',      name: 'Tracker.gg',      url: 'https://tracker.gg/search?query={q}', tags: ['stats'] },
    ]
  },

  // ─── TECH & DÉVELOPPEMENT ─────────────────────────────────────────────────
  tech: {
    label: 'Tech & Développement',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    platforms: [
      { id: 'github',       name: 'GitHub',          url: 'https://github.com/{q}',              tags: ['code', 'git'], api: 'https://api.github.com/users/{q}' },
      { id: 'gitlab',       name: 'GitLab',          url: 'https://gitlab.com/{q}',              tags: ['code', 'git'] },
      { id: 'bitbucket',    name: 'Bitbucket',       url: 'https://bitbucket.org/{q}',           tags: ['code', 'git'] },
      { id: 'stackoverflow',name: 'Stack Overflow',  url: 'https://stackoverflow.com/users/{q}', tags: ['Q&A'] },
      { id: 'devto',        name: 'Dev.to',          url: 'https://dev.to/{q}',                  tags: ['blog', 'code'] },
      { id: 'medium',       name: 'Medium',          url: 'https://medium.com/@{q}',             tags: ['blog'] },
      { id: 'hashnode',     name: 'Hashnode',        url: 'https://hashnode.com/@{q}',           tags: ['blog', 'code'] },
      { id: 'codepen',      name: 'CodePen',         url: 'https://codepen.io/{q}',              tags: ['front-end', 'démo'] },
      { id: 'codesandbox',  name: 'CodeSandbox',     url: 'https://codesandbox.io/u/{q}',        tags: ['front-end'] },
      { id: 'jsfiddle',     name: 'JSFiddle',        url: 'https://jsfiddle.net/{q}',            tags: ['JS'] },
      { id: 'replit',       name: 'Replit',          url: 'https://replit.com/@{q}',             tags: ['IDE', 'cloud'] },
      { id: 'glitch',       name: 'Glitch',          url: 'https://glitch.com/@{q}',             tags: ['web', 'code'] },
      { id: 'hackernews',   name: 'Hacker News',     url: 'https://news.ycombinator.com/user?id={q}', tags: ['tech', 'news'] },
      { id: 'lobsters',     name: 'Lobste.rs',       url: 'https://lobste.rs/u/{q}',             tags: ['tech', 'news'] },
      { id: 'producthunt',  name: 'Product Hunt',    url: 'https://producthunt.com/@{q}',        tags: ['startups'] },
      { id: 'keybase',      name: 'Keybase',         url: 'https://keybase.io/{q}',              tags: ['crypto', 'identité'], api: 'https://keybase.io/_/api/1.0/user/lookup.json?username={q}' },
      { id: 'npm',          name: 'npm',             url: 'https://npmjs.com/~{q}',              tags: ['Node.js', 'packages'] },
      { id: 'pypi',         name: 'PyPI',            url: 'https://pypi.org/user/{q}',           tags: ['Python'] },
      { id: 'crates',       name: 'Crates.io',       url: 'https://crates.io/users/{q}',         tags: ['Rust'] },
      { id: 'huggingface',  name: 'Hugging Face',    url: 'https://huggingface.co/{q}',          tags: ['IA', 'ML'] },
      { id: 'kaggle',       name: 'Kaggle',          url: 'https://kaggle.com/{q}',              tags: ['data', 'IA'] },
      { id: 'leetcode',     name: 'LeetCode',        url: 'https://leetcode.com/{q}',            tags: ['algo', 'code'] },
      { id: 'hackerrank',   name: 'HackerRank',      url: 'https://hackerrank.com/{q}',          tags: ['algo', 'code'] },
      { id: 'codeforces',   name: 'Codeforces',      url: 'https://codeforces.com/profile/{q}',  tags: ['compétition'] },
      { id: 'atcoder',      name: 'AtCoder',         url: 'https://atcoder.jp/users/{q}',        tags: ['compétition'] },
      { id: 'exercism',     name: 'Exercism',        url: 'https://exercism.org/profiles/{q}',   tags: ['apprentissage'] },
      { id: 'tryhackme',    name: 'TryHackMe',       url: 'https://tryhackme.com/p/{q}',         tags: ['cybersec'] },
      { id: 'hackthebox',   name: 'HackTheBox',      url: 'https://app.hackthebox.com/profile/{q}', tags: ['cybersec'] },
    ]
  },

  // ─── FORUMS & DISCUSSIONS ─────────────────────────────────────────────────
  forums: {
    label: 'Forums & Discussion',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    platforms: [
      { id: 'quora',        name: 'Quora',           url: 'https://quora.com/profile/{q}',       tags: ['Q&A'] },
      { id: 'disqus',       name: 'Disqus',          url: 'https://disqus.com/by/{q}',           tags: ['commentaires'] },
      { id: 'wordpress',    name: 'WordPress.com',   url: 'https://{q}.wordpress.com',           tags: ['blog'] },
      { id: 'blogspot',     name: 'Blogger',         url: 'https://{q}.blogspot.com',            tags: ['blog'] },
      { id: 'livejournal',  name: 'LiveJournal',     url: 'https://{q}.livejournal.com',         tags: ['blog'] },
      { id: 'dreamwidth',   name: 'Dreamwidth',      url: 'https://{q}.dreamwidth.org',          tags: ['blog'] },
      { id: 'typepad',      name: 'TypePad',         url: 'https://{q}.typepad.com',             tags: ['blog'] },
      { id: 'substack',     name: 'Substack',        url: 'https://{q}.substack.com',            tags: ['newsletter', 'blog'] },
      { id: 'ghost',        name: 'Ghost',           url: 'https://{q}.ghost.io',                tags: ['blog'] },
      { id: 'discourse',    name: 'Discourse',       url: 'https://meta.discourse.org/u/{q}',    tags: ['forum'] },
      { id: 'xenforo',      name: 'XenForo (search)', url: 'https://xenforo.com/community/members/?username={q}', tags: ['forum'] },
      { id: '4chan',        name: '4chan (recherche)', url: 'https://boards.4chan.org/',           tags: ['imageboard'], note: 'Rechercher {q} via les archives' },
      { id: 'kiwifarms',    name: 'Kiwi Farms',      url: 'https://kiwifarms.net/search/?q={q}&t=post&o=date', tags: ['forum'] },
    ]
  },

  // ─── MUSIQUE & AUDIO ─────────────────────────────────────────────────────
  music: {
    label: 'Musique & Audio',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    platforms: [
      { id: 'spotify',      name: 'Spotify',         url: 'https://open.spotify.com/user/{q}',  tags: ['musique', 'streaming'] },
      { id: 'soundcloud',   name: 'SoundCloud',      url: 'https://soundcloud.com/{q}',         tags: ['musique', 'indie'] },
      { id: 'lastfm',       name: 'Last.fm',         url: 'https://last.fm/user/{q}',           tags: ['musique', 'stats'] },
      { id: 'bandcamp',     name: 'Bandcamp',        url: 'https://bandcamp.com/{q}',           tags: ['musique', 'indie'] },
      { id: 'mixcloud',     name: 'Mixcloud',        url: 'https://mixcloud.com/{q}',           tags: ['DJ', 'radio'] },
      { id: 'audiomack',    name: 'Audiomack',       url: 'https://audiomack.com/{q}',          tags: ['musique'] },
      { id: 'reverbnation', name: 'ReverbNation',    url: 'https://reverbnation.com/{q}',       tags: ['musique', 'artiste'] },
      { id: 'genius',       name: 'Genius',          url: 'https://genius.com/{q}',             tags: ['paroles'] },
      { id: 'musixmatch',   name: 'Musixmatch',      url: 'https://musixmatch.com/profile/{q}', tags: ['paroles'] },
      { id: 'rateyourmusic',name: 'RateYourMusic',   url: 'https://rateyourmusic.com/~{q}',     tags: ['critique', 'musique'] },
      { id: 'discogs',      name: 'Discogs',         url: 'https://discogs.com/user/{q}',       tags: ['vinyles', 'collection'] },
    ]
  },

  // ─── PROFESSIONNEL ────────────────────────────────────────────────────────
  professional: {
    label: 'Professionnel',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    platforms: [
      { id: 'angellist',    name: 'AngelList / Wellfound', url: 'https://wellfound.com/u/{q}',  tags: ['startup', 'emploi'] },
      { id: 'xing',         name: 'XING',            url: 'https://xing.com/profile/{q}',       tags: ['pro', 'Europe'] },
      { id: 'viadeo',       name: 'Viadeo',          url: 'https://viadeo.journaldunet.com/p/{q}', tags: ['pro', 'France'] },
      { id: 'about',        name: 'About.me',        url: 'https://about.me/{q}',               tags: ['portfolio', 'profil'] },
      { id: 'gravatar',     name: 'Gravatar',        url: 'https://en.gravatar.com/{q}',        tags: ['avatar', 'email'] },
      { id: 'crunchbase',   name: 'Crunchbase',      url: 'https://crunchbase.com/person/{q}',  tags: ['startup', 'investissement'] },
      { id: 'speakerdeck',  name: 'Speaker Deck',    url: 'https://speakerdeck.com/{q}',        tags: ['présentations'] },
      { id: 'slideshare',   name: 'SlideShare',      url: 'https://slideshare.net/{q}',         tags: ['présentations'] },
      { id: 'academia',     name: 'Academia.edu',    url: 'https://academia.edu/{q}',            tags: ['académique'] },
      { id: 'researchgate', name: 'ResearchGate',    url: 'https://researchgate.net/profile/{q}', tags: ['recherche', 'science'] },
      { id: 'orcid',        name: 'ORCID',           url: 'https://orcid.org/search/{q}',        tags: ['chercheur', 'science'] },
      { id: 'fiverr',       name: 'Fiverr',          url: 'https://fiverr.com/{q}',             tags: ['freelance'] },
      { id: 'upwork',       name: 'Upwork',          url: 'https://upwork.com/freelancers/~{q}',tags: ['freelance'] },
      { id: 'malt',         name: 'Malt',            url: 'https://malt.fr/profile/{q}',        tags: ['freelance', 'France'] },
      { id: 'comet',        name: 'Comet',           url: 'https://www.comet.co/expert/{q}',    tags: ['freelance', 'France'] },
    ]
  },

  // ─── MESSAGERIES & COMMUNAUTÉS ────────────────────────────────────────────
  messaging: {
    label: 'Messageries & Communautés',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    platforms: [
      { id: 'discord',      name: 'Discord (recherche)', url: 'https://discord.com/channels/@me', tags: ['gaming', 'communauté'], note: 'Chercher "{q}" dans la barre de recherche Discord' },
      { id: 'telegram',     name: 'Telegram',        url: 'https://t.me/{q}',                   tags: ['messagerie', 'chaîne'] },
      { id: 'signal',       name: 'Signal (search)', url: 'https://signal.org/',                tags: ['messagerie'], note: 'Signal ne propose pas de profils publics' },
      { id: 'slack',        name: 'Slack (workspaces)', url: 'https://slack.com/intl/fr-fr/',   tags: ['pro', 'équipe'], note: 'Rechercher "{q}" dans les Slack Communities' },
      { id: 'skype',        name: 'Skype',           url: 'https://skype.com/en/search/#keyword={q}', tags: ['messagerie'] },
      { id: 'line',         name: 'LINE',            url: 'https://linecorp.com',               tags: ['Asie', 'messagerie'], note: 'Identifiant LINE : {q}' },
      { id: 'kik',          name: 'Kik',             url: 'https://kik.me/{q}',                 tags: ['messagerie'] },
      { id: 'viber',        name: 'Viber',           url: 'https://viber.com/chats/?number={q}',tags: ['messagerie'] },
      { id: 'wechat',       name: 'WeChat',          url: 'https://weixin.qq.com/',             tags: ['Chine', 'messagerie'], note: 'WeChat ID : {q}' },
    ]
  },

  // ─── INTERNATIONAL ────────────────────────────────────────────────────────
  international: {
    label: 'Réseaux Internationaux',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    platforms: [
      { id: 'vk',           name: 'VKontakte (VK)',  url: 'https://vk.com/{q}',                 tags: ['Russie', 'social'] },
      { id: 'odnoklassniki',name: 'Odnoklassniki',   url: 'https://ok.ru/profile/{q}',          tags: ['Russie'] },
      { id: 'naver',        name: 'Naver Blog',      url: 'https://blog.naver.com/{q}',         tags: ['Corée'] },
      { id: 'cyworld',      name: 'Weibo',           url: 'https://weibo.com/n/{q}',            tags: ['Chine'] },
      { id: 'douyin',       name: 'Douyin',          url: 'https://douyin.com/user/{q}',        tags: ['Chine', 'vidéo'] },
      { id: 'bilibili',     name: 'Bilibili',        url: 'https://space.bilibili.com/{q}',     tags: ['Chine', 'vidéo'] },
      { id: 'niconico',     name: 'Nico Nico Douga', url: 'https://niconico.com/user/{q}',      tags: ['Japon', 'vidéo'] },
      { id: 'mixi',         name: 'Mixi',            url: 'https://mixi.jp/show_profile.pl?id={q}', tags: ['Japon'] },
      { id: 'taringa',      name: 'Taringa',         url: 'https://taringa.net/{q}',            tags: ['Amérique Latine'] },
      { id: 'fotolog',      name: 'Fotolog',         url: 'https://fotolog.com/{q}',            tags: ['Amérique Latine', 'photos'] },
      { id: 'skyrock',      name: 'Skyrock',         url: 'https://{q}.skyrock.com',            tags: ['France', 'blog'] },
      { id: 'jeuxvideo',    name: 'Jeuxvideo.com',   url: 'https://jeuxvideo.com/profil/{q}',   tags: ['France', 'gaming'] },
      { id: 'marmiton',     name: 'Marmiton',        url: 'https://marmiton.org/profil/{q}',    tags: ['France', 'cuisine'] },
    ]
  },

  // ─── ACHATS & MARKETPLACE ─────────────────────────────────────────────────
  marketplace: {
    label: 'Achats & Marketplace',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    platforms: [
      { id: 'ebay',         name: 'eBay',            url: 'https://ebay.com/usr/{q}',           tags: ['vente', 'enchères'] },
      { id: 'etsy',         name: 'Etsy',            url: 'https://etsy.com/shop/{q}',          tags: ['artisanat', 'boutique'] },
      { id: 'amazon',       name: 'Amazon (vendeur)',url: 'https://amazon.com/s?me={q}',        tags: ['vente', 'marketplace'] },
      { id: 'vinted',       name: 'Vinted',          url: 'https://vinted.fr/member/{q}',       tags: ['mode', 'seconde main'] },
      { id: 'depop',        name: 'Depop',           url: 'https://depop.com/{q}',              tags: ['mode', 'seconde main'] },
      { id: 'poshmark',     name: 'Poshmark',        url: 'https://poshmark.com/closet/{q}',    tags: ['mode'] },
      { id: 'leboncoin',    name: 'Leboncoin',       url: 'https://leboncoin.fr/profil/{q}',    tags: ['France', 'annonces'] },
      { id: 'patreon',      name: 'Patreon',         url: 'https://patreon.com/{q}',            tags: ['créateurs', 'abonnement'] },
      { id: 'ko-fi',        name: 'Ko-fi',           url: 'https://ko-fi.com/{q}',              tags: ['dons', 'créateurs'] },
      { id: 'buymeacoffee', name: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/{q}',       tags: ['dons', 'créateurs'] },
      { id: 'onlyfans',     name: 'OnlyFans',        url: 'https://onlyfans.com/{q}',           tags: ['abonnement', 'créateurs'] },
      { id: 'gumroad',      name: 'Gumroad',         url: 'https://gumroad.com/{q}',            tags: ['produits numériques'] },
    ]
  },

  // ─── SPORT & FITNESS ─────────────────────────────────────────────────────
  sport: {
    label: 'Sport & Fitness',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
    platforms: [
      { id: 'strava',       name: 'Strava',          url: 'https://strava.com/athletes/{q}',    tags: ['course', 'vélo'] },
      { id: 'garmin',       name: 'Garmin Connect',  url: 'https://connect.garmin.com/modern/profile/{q}', tags: ['fitness', 'sport'] },
      { id: 'mapmyrun',     name: 'MapMyRun',        url: 'https://mapmyrun.com/profile/{q}',   tags: ['course'] },
      { id: 'runkeeper',    name: 'Runkeeper',       url: 'https://runkeeper.com/user/{q}',     tags: ['course'] },
      { id: 'nike',         name: 'Nike Run Club',   url: 'https://nikerunclub.nike.com/',      tags: ['course'], note: 'Profil NRC de {q}' },
      { id: 'stravachallenge', name: 'Chess.com (rating)', url: 'https://chess.com/member/{q}/stats', tags: ['échecs', 'rating'] },
      { id: '8tracks',      name: 'Zwift',           url: 'https://zwiftracing.com/riders/{q}', tags: ['cyclisme', 'virtuel'] },
      { id: 'myfitnesspal', name: 'MyFitnessPal',    url: 'https://myfitnesspal.com/profile/{q}', tags: ['nutrition', 'fitness'] },
    ]
  },

  // ─── VOYAGE & LOCAL ───────────────────────────────────────────────────────
  travel: {
    label: 'Voyage & Local',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    platforms: [
      { id: 'tripadvisor',  name: 'TripAdvisor',     url: 'https://tripadvisor.com/members/{q}',tags: ['voyage', 'avis'] },
      { id: 'yelp',         name: 'Yelp',            url: 'https://yelp.com/user_details?userid={q}', tags: ['local', 'avis'] },
      { id: 'foursquare',   name: 'Foursquare',      url: 'https://foursquare.com/{q}',         tags: ['local', 'check-in'] },
      { id: 'couchsurfing', name: 'Couchsurfing',    url: 'https://couchsurfing.com/people/{q}',tags: ['voyage', 'hébergement'] },
      { id: 'airbnb',       name: 'Airbnb (hôtes)',  url: 'https://airbnb.com/users/show/{q}',  tags: ['hébergement'] },
      { id: 'openstreetmap',name: 'OpenStreetMap',   url: 'https://openstreetmap.org/user/{q}', tags: ['cartographie', 'géo'] },
      { id: 'wikiloc',      name: 'Wikiloc',         url: 'https://wikiloc.com/wikiloc/user.do?id={q}', tags: ['randonnée', 'GPS'] },
      { id: 'alltrails',    name: 'AllTrails',       url: 'https://alltrails.com/members/{q}',  tags: ['randonnée'] },
    ]
  },

  // ─── DIVERS ───────────────────────────────────────────────────────────────
  misc: {
    label: 'Divers',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
    platforms: [
      { id: 'goodreads',    name: 'Goodreads',       url: 'https://goodreads.com/{q}',          tags: ['lecture', 'livres'] },
      { id: 'librarything', name: 'LibraryThing',    url: 'https://librarything.com/profile/{q}', tags: ['livres'] },
      { id: 'letterboxd',   name: 'Letterboxd',      url: 'https://letterboxd.com/{q}',         tags: ['cinéma', 'films'] },
      { id: 'imdb',         name: 'IMDb',            url: 'https://imdb.com/find/?q={q}&s=nm',  tags: ['cinéma', 'acteurs'] },
      { id: 'trakt',        name: 'Trakt',           url: 'https://trakt.tv/users/{q}',         tags: ['séries', 'films'] },
      { id: 'anilist',      name: 'AniList',         url: 'https://anilist.co/user/{q}',        tags: ['anime', 'manga'] },
      { id: 'myanimelist',  name: 'MyAnimeList',     url: 'https://myanimelist.net/profile/{q}',tags: ['anime'] },
      { id: 'kitsu',        name: 'Kitsu',           url: 'https://kitsu.io/users/{q}',         tags: ['anime', 'manga'] },
      { id: 'boardgamegeek',name: 'BoardGameGeek',   url: 'https://boardgamegeek.com/user/{q}', tags: ['jeux de société'] },
      { id: 'geocaching',   name: 'Geocaching',      url: 'https://geocaching.com/p/?guid={q}', tags: ['géocaching', 'GPS'] },
      { id: 'wikipedia',    name: 'Wikipédia (fr)',  url: 'https://fr.wikipedia.org/wiki/User:{q}', tags: ['encyclopédie'] },
      { id: 'wikimedia',    name: 'Wikimedia',       url: 'https://commons.wikimedia.org/wiki/User:{q}', tags: ['photos libres'] },
      { id: 'archive',      name: 'Internet Archive',url: 'https://archive.org/search?query={q}&and[]=mediatype%3A"account"', tags: ['archives'] },
      { id: 'pastebin',     name: 'Pastebin',        url: 'https://pastebin.com/u/{q}',         tags: ['texte', 'code'] },
      { id: 'justpaste',    name: 'JustPaste.it',    url: 'https://justpaste.it/u/{q}',         tags: ['texte'] },
    ]
  },
};

// Moteurs de recherche de personnes (Person Search)
const PERSON_SEARCH_ENGINES = [
  // ─── Moteurs généralistes ─────────────────────────────────────────────────
  { id: 'google_person',   name: 'Google Personnes',  url: 'https://google.com/search?q="{fn}+{ln}"&num=30',          icon: 'G', category: 'general',   desc: 'Recherche classique Google avec nom entre guillemets' },
  { id: 'google_adv',      name: 'Google Avancé',     url: 'https://google.com/search?q="{fn}+{ln}"+site:linkedin.com+OR+site:twitter.com', icon: 'G', category: 'general', desc: 'Recherche Google ciblée sur réseaux sociaux' },
  { id: 'bing_person',     name: 'Bing People',       url: 'https://bing.com/search?q="{fn}+{ln}"',                   icon: 'B', category: 'general',   desc: 'Moteur Bing — résultats différents de Google' },
  { id: 'duckduckgo',      name: 'DuckDuckGo',        url: 'https://duckduckgo.com/?q="{fn}+{ln}"',                   icon: 'D', category: 'general',   desc: 'Moteur respectueux de la vie privée' },
  { id: 'yandex',          name: 'Yandex Personnes',  url: 'https://yandex.com/search/?text="{fn}+{ln}"',             icon: 'Y', category: 'general',   desc: 'Moteur russe, excellent pour Europe de l\'Est' },
  { id: 'baidu',           name: 'Baidu',             url: 'https://baidu.com/s?wd="{fn}+{ln}"',                      icon: '百', category: 'general',  desc: 'Moteur chinois pour sujets asiatiques' },
  // ─── Répertoires de personnes ─────────────────────────────────────────────
  { id: 'pipl',            name: 'Pipl',              url: 'https://pipl.com/search/?q={fn}+{ln}&l={loc}',            icon: 'P', category: 'directory', desc: 'Moteur OSINT professionnel (partiel gratuit)' },
  { id: 'spokeo',          name: 'Spokeo',            url: 'https://spokeo.com/search?q={fn}+{ln}',                   icon: 'S', category: 'directory', desc: 'Annuaire US étendu, numéros et adresses' },
  { id: 'whitepages',      name: 'Whitepages',        url: 'https://whitepages.com/name/{fn}-{ln}/{loc}',             icon: 'W', category: 'directory', desc: 'Annuaire américain de référence' },
  { id: 'intelius',        name: 'Intelius',          url: 'https://intelius.com/search/name/?fn={fn}&ln={ln}&state={loc}', icon: 'I', category: 'directory', desc: 'Recherche de personnes US approfondie' },
  { id: 'beenverified',    name: 'BeenVerified',      url: 'https://beenverified.com/people/{fn}-{ln}/',              icon: 'BV', category: 'directory', desc: 'Vérification d\'identité US' },
  { id: 'truepeoplesearch',name: 'TruePeopleSearch',  url: 'https://truepeoplesearch.com/results?name={fn}+{ln}&citystatezip={loc}', icon: 'T', category: 'directory', desc: 'Gratuit, données US' },
  { id: 'fastpeoplesearch',name: 'FastPeopleSearch',  url: 'https://fastpeoplesearch.com/name/{fn}-{ln}',             icon: 'F', category: 'directory', desc: 'Gratuit, annuaire US rapide' },
  { id: 'peoplefinder',    name: 'PeopleFinder',      url: 'https://peoplefinder.com/search/?q={fn}+{ln}',            icon: 'PF', category: 'directory', desc: 'Recherche de personnes US détaillée' },
  { id: 'zabasearch',      name: 'ZabaSearch',        url: 'https://zabasearch.com/query.php?ZabaSearch=Search&sname={fn}+{ln}', icon: 'Z', category: 'directory', desc: 'Annuaire gratuit US' },
  { id: 'radaris',         name: 'Radaris',           url: 'https://radaris.com/p/{fn}/{ln}',                         icon: 'R', category: 'directory', desc: 'Profils publics et réseaux' },
  { id: 'peekyou',         name: 'PeekYou',           url: 'https://peekyou.com/{fn}_{ln}/{loc}',                     icon: 'PY', category: 'directory', desc: 'Agrégateur de profils sociaux' },
  { id: '411',             name: '411.com',           url: 'https://411.com/name/{fn}+{ln}/{loc}',                    icon: '4', category: 'directory', desc: 'Annuaire téléphonique US' },
  { id: 'addresssearch',   name: 'AddressSearch',     url: 'https://addresssearch.com/people-search.php?fname={fn}&lname={ln}', icon: 'A', category: 'directory', desc: 'Recherche adresses US' },
  // ─── Répertoires européens / FR ───────────────────────────────────────────
  { id: 'pagesjaunes',     name: 'Pages Jaunes (FR)', url: 'https://pagesjaunes.fr/search/srvi/search?quoiqui={fn}+{ln}', icon: 'PJ', category: 'france', desc: 'Annuaire professionnel français' },
  { id: 'pagesblanches',   name: 'Pages Blanches (FR)', url: 'https://pagesblanches.fr/annuaire-inverse/nom/{fn}+{ln}', icon: 'PB', category: 'france', desc: 'Annuaire téléphonique français' },
  { id: 'linkedin_name',   name: 'LinkedIn Recherche',url: 'https://linkedin.com/search/results/people/?keywords={fn}+{ln}', icon: 'Li', category: 'social', desc: 'Recherche de profils professionnels' },
  { id: 'twitter_name',    name: 'X / Twitter',       url: 'https://twitter.com/search?q={fn}+{ln}&f=user',          icon: 'X', category: 'social',   desc: 'Recherche de comptes Twitter / X' },
  { id: 'facebook_name',   name: 'Facebook Personnes',url: 'https://facebook.com/search/people/?q={fn}+{ln}',        icon: 'F', category: 'social',   desc: 'Recherche de profils Facebook' },
];

// Générateurs de patterns email
const EMAIL_PATTERNS = [
  { id: 'f_l',       pattern: '{f}.{l}@{d}',     example: (f,l) => `${f[0]}.${l}`,       label: 'p.nom' },
  { id: 'fl',        pattern: '{f}{l}@{d}',       example: (f,l) => `${f[0]}${l}`,        label: 'pnom' },
  { id: 'f_lastname',pattern: '{f}.{l}@{d}',      example: (f,l) => `${f}.${l}`,          label: 'prenom.nom' },
  { id: 'flastname', pattern: '{f}{l}@{d}',       example: (f,l) => `${f}${l}`,           label: 'prenomnom' },
  { id: 'firstname', pattern: '{f}@{d}',          example: (f,l) => `${f}`,               label: 'prenom' },
  { id: 'lastname',  pattern: '{l}@{d}',          example: (f,l) => `${l}`,               label: 'nom' },
  { id: 'l_f',       pattern: '{l}.{f}@{d}',      example: (f,l) => `${l}.${f}`,          label: 'nom.prenom' },
  { id: 'lf',        pattern: '{l}{f}@{d}',       example: (f,l) => `${l}${f}`,           label: 'nomprenom' },
  { id: 'l_fi',      pattern: '{l}.{fi}@{d}',     example: (f,l) => `${l}.${f[0]}`,       label: 'nom.p' },
  { id: 'fi_l',      pattern: '{fi}_{l}@{d}',     example: (f,l) => `${f[0]}_${l}`,       label: 'p_nom' },
  { id: 'f-l',       pattern: '{f}-{l}@{d}',      example: (f,l) => `${f}-${l}`,          label: 'prenom-nom' },
  { id: 'l-f',       pattern: '{l}-{f}@{d}',      example: (f,l) => `${l}-${f}`,          label: 'nom-prenom' },
];

// Moteurs de vérification email
const EMAIL_VERIFIERS = [
  { name: 'Hunter.io',       url: 'https://hunter.io/email-verifier/{email}',     desc: 'Vérification SMTP + patterns entreprise' },
  { name: 'EmailRep.io',     url: 'https://emailrep.io/{email}',                  desc: 'Réputation et risque de l\'adresse email' },
  { name: 'Have I Been Pwned', url: 'https://haveibeenpwned.com/account/{email}', desc: 'Fuites de données contenant l\'email' },
  { name: 'Holehe',          url: 'https://github.com/megadose/holehe',           desc: 'Script Python — détecte comptes liés à l\'email' },
  { name: 'Dehashed',        url: 'https://dehashed.com/search?query={email}',    desc: 'Base de données de fuites (abonnement)' },
  { name: 'Intelligence X',  url: 'https://intelx.io/?s={email}',                desc: 'Moteur OSINT — fuites, Darknet, archives' },
  { name: 'Epieos',          url: 'https://epieos.com/?q={email}&t=email',        desc: 'Google / Gravatar / LinkedIn depuis email' },
  { name: 'GHunt (GitHub)',   url: 'https://github.com/mxrch/GHunt',              desc: 'Outil CLI pour OSINT depuis email Google' },
  { name: 'Skymem',          url: 'https://skymem.info/srch?q={email}',           desc: 'Traces d\'activités depuis l\'email' },
  { name: 'Snov.io',         url: 'https://snov.io/email-verifier',               desc: 'Vérification et recherche de domaines' },
];

// Outils de recherche inversée d'image
const IMAGE_SEARCH = [
  { name: 'Google Images',   url: 'https://images.google.com/',                   desc: 'Glisser-déposer une photo dans la barre de recherche' },
  { name: 'TinEye',          url: 'https://tineye.com/',                          desc: 'Spécialiste reverse image — traces et copies' },
  { name: 'Yandex Images',   url: 'https://yandex.com/images/',                  desc: 'Excellent pour portraits — souvent supérieur à Google' },
  { name: 'Bing Visual Search', url: 'https://bing.com/images/',                 desc: 'Recherche visuelle Microsoft' },
  { name: 'PimEyes',         url: 'https://pimeyes.com/',                         desc: 'Reconnaissance faciale (payant pour résultats complets)' },
  { name: 'FaceCheck.ID',    url: 'https://facecheck.id/',                        desc: 'Reconnaissance faciale sur profils sociaux' },
  { name: 'Social Catfish',  url: 'https://socialcatfish.com/',                   desc: 'Vérification photo & identité en ligne' },
  { name: 'Karma Decay',     url: 'https://karmadecay.com/',                      desc: 'Recherche inversée sur Reddit uniquement' },
  { name: 'Baidu Images',    url: 'https://image.baidu.com/',                     desc: 'Recherche visuelle Baidu — contenu chinois' },
];

// =============================================================================
// ÉTAT DE L'APPLICATION
// =============================================================================

const State = {
  mode: 'username',          // 'username' | 'person' | 'email' | 'report'
  query: '',
  firstName: '',
  lastName: '',
  location: '',
  emailAddress: '',
  emailDomain: '',
  results: {},               // { platformId: 'found' | 'notfound' | 'pending' | 'unchecked' }
  personResults: {},
  emailResults: {},
  activeFilter: 'all',
  history: [],
  reportNotes: '',
  apiChecks: {},             // résultats des vérifications API (GitHub, Keybase...)
};

// =============================================================================
// UTILITAIRES
// =============================================================================

function sanitize(str) {
  return str.replace(/[<>'"&]/g, c => ({ '<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;','&':'&amp;' }[c]));
}

function slugify(str) {
  return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function buildUrl(template, query, extras = {}) {
  let url = template.replace(/{q}/g, encodeURIComponent(query));
  if (extras.fn) url = url.replace(/{fn}/g, encodeURIComponent(extras.fn));
  if (extras.ln) url = url.replace(/{ln}/g, encodeURIComponent(extras.ln));
  if (extras.loc) url = url.replace(/{loc}/g, encodeURIComponent(extras.loc || ''));
  if (extras.email) url = url.replace(/{email}/g, encodeURIComponent(extras.email));
  return url;
}

function getTotalPlatforms() {
  return Object.values(PLATFORMS_DB).reduce((acc, cat) => acc + cat.platforms.length, 0);
}

function getFoundCount() {
  return Object.values(State.results).filter(v => v === 'found').length;
}

function getNotFoundCount() {
  return Object.values(State.results).filter(v => v === 'notfound').length;
}

function getPendingCount() {
  return Object.values(State.results).filter(v => v === 'pending').length;
}

function saveToHistory(type, query) {
  const entry = { type, query, date: new Date().toISOString(), results: { ...State.results } };
  State.history = [entry, ...State.history.slice(0, 9)];
  try { localStorage.setItem('celerys_osint_history', JSON.stringify(State.history)); } catch(e) {}
}

function loadHistory() {
  try {
    const h = localStorage.getItem('celerys_osint_history');
    if (h) State.history = JSON.parse(h);
  } catch(e) {}
}

function saveResults() {
  try { localStorage.setItem('celerys_results_' + slugify(State.query), JSON.stringify(State.results)); } catch(e) {}
}

function loadResults(query) {
  try {
    const r = localStorage.getItem('celerys_results_' + slugify(query));
    if (r) return JSON.parse(r);
  } catch(e) {}
  return {};
}

// =============================================================================
// VÉRIFICATIONS API (CORS-friendly)
// =============================================================================

async function checkGitHub(username) {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      State.apiChecks.github = {
        found: true,
        avatar: data.avatar_url,
        name: data.name,
        bio: data.bio,
        followers: data.followers,
        repos: data.public_repos,
        company: data.company,
        blog: data.blog,
        location: data.location,
        email: data.email,
        created: data.created_at?.split('T')[0],
        url: data.html_url,
      };
      return true;
    } else if (res.status === 404) {
      State.apiChecks.github = { found: false };
      return false;
    }
  } catch(e) {}
  return null;
}

async function checkKeybase(username) {
  try {
    const res = await fetch(`https://keybase.io/_/api/1.0/user/lookup.json?username=${encodeURIComponent(username)}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (data.status?.code === 0 && data.them?.length > 0) {
        const user = data.them[0];
        State.apiChecks.keybase = {
          found: true,
          username: user.basics?.username,
          fullname: user.profile?.full_name,
          bio: user.profile?.bio,
          location: user.profile?.location,
          proofs: user.proofs_summary?.all || [],
          url: `https://keybase.io/${username}`,
        };
        return true;
      }
    }
  } catch(e) {}
  State.apiChecks.keybase = { found: false };
  return false;
}

// =============================================================================
// RENDU INTERFACE — MODE USERNAME
// =============================================================================

function renderUsernameResults(query) {
  const container = document.getElementById('results-container');
  if (!container) return;

  const stats = document.getElementById('result-stats');
  if (stats) {
    stats.innerHTML = `
      <span class="stat-badge stat-found" title="Profils trouvés">${getFoundCount()} trouvés</span>
      <span class="stat-badge stat-notfound" title="Profils inexistants">${getNotFoundCount()} absents</span>
      <span class="stat-badge stat-unchecked" title="Non vérifiés">${Object.values(State.results).filter(v => v === 'unchecked').length} à vérifier</span>
    `;
  }

  const filter = State.activeFilter;
  let html = '';

  // Vérifications API enrichies
  const apiSection = renderApiChecks(query);
  if (apiSection) html += apiSection;

  // Grille par catégorie
  Object.entries(PLATFORMS_DB).forEach(([catId, cat]) => {
    const platforms = filter === 'all'
      ? cat.platforms
      : cat.platforms.filter(p => p.tags?.includes(filter));

    if (platforms.length === 0) return;

    html += `
      <div class="result-category">
        <div class="result-cat-header">
          <span class="cat-icon">${cat.icon}</span>
          <h3 class="cat-label">${cat.label}</h3>
          <span class="cat-count">${platforms.length} plateformes</span>
        </div>
        <div class="result-grid">
          ${platforms.map(p => renderPlatformCard(p, query)).join('')}
        </div>
      </div>`;
  });

  container.innerHTML = html;
  attachPlatformEvents();
}

function renderApiChecks(query) {
  const gh = State.apiChecks.github;
  const kb = State.apiChecks.keybase;

  if (!gh && !kb) return '';

  let cards = '';

  if (gh?.found) {
    cards += `
      <div class="api-card api-card--github">
        <div class="api-card-header">
          <img class="api-avatar" src="${sanitize(gh.avatar)}" alt="Avatar GitHub" loading="lazy" onerror="this.style.display='none'">
          <div>
            <div class="api-platform-name"><span class="api-platform-badge api-badge--github">GitHub</span></div>
            <div class="api-username">${sanitize(gh.name || query)}</div>
            ${gh.bio ? `<div class="api-bio">${sanitize(gh.bio)}</div>` : ''}
          </div>
          <span class="status-found-badge">✓ Trouvé</span>
        </div>
        <div class="api-meta">
          ${gh.location ? `<span class="api-meta-item">📍 ${sanitize(gh.location)}</span>` : ''}
          ${gh.company ? `<span class="api-meta-item">🏢 ${sanitize(gh.company)}</span>` : ''}
          ${gh.email ? `<span class="api-meta-item">✉️ ${sanitize(gh.email)}</span>` : ''}
          ${gh.followers != null ? `<span class="api-meta-item">👥 ${gh.followers} followers</span>` : ''}
          ${gh.repos != null ? `<span class="api-meta-item">📦 ${gh.repos} repos</span>` : ''}
          ${gh.blog ? `<span class="api-meta-item">🔗 <a href="${sanitize(gh.blog)}" target="_blank" rel="noopener">${sanitize(gh.blog)}</a></span>` : ''}
          ${gh.created ? `<span class="api-meta-item">📅 Depuis ${sanitize(gh.created)}</span>` : ''}
        </div>
        <a href="${sanitize(gh.url)}" target="_blank" rel="noopener" class="api-link-btn">Voir profil GitHub →</a>
      </div>`;
  } else if (gh?.found === false) {
    cards += `<div class="api-card api-card--notfound"><span class="api-platform-badge api-badge--github">GitHub</span> <span class="status-notfound-badge">✗ Compte inexistant</span></div>`;
  }

  if (kb?.found) {
    const proofs = (kb.proofs || []).slice(0, 6).map(p => `<span class="proof-badge">${sanitize(p.nametag || p.key)}</span>`).join('');
    cards += `
      <div class="api-card api-card--keybase">
        <div class="api-card-header">
          <div>
            <div class="api-platform-name"><span class="api-platform-badge api-badge--keybase">Keybase</span></div>
            <div class="api-username">${sanitize(kb.fullname || kb.username || query)}</div>
            ${kb.bio ? `<div class="api-bio">${sanitize(kb.bio)}</div>` : ''}
          </div>
          <span class="status-found-badge">✓ Trouvé</span>
        </div>
        ${proofs ? `<div class="api-proofs"><span class="proof-label">Identités liées :</span>${proofs}</div>` : ''}
        <a href="${sanitize(kb.url)}" target="_blank" rel="noopener" class="api-link-btn">Voir profil Keybase →</a>
      </div>`;
  }

  if (!cards) return '';
  return `<div class="api-checks-section"><h3 class="section-mini-title">// Vérifications API directes</h3><div class="api-cards-grid">${cards}</div></div>`;
}

function renderPlatformCard(platform, query) {
  const url = buildUrl(platform.url, query);
  const status = State.results[platform.id] || 'unchecked';
  const statusMap = {
    found:     { cls: 'card--found',     icon: '✓', label: 'Trouvé' },
    notfound:  { cls: 'card--notfound',  icon: '✗', label: 'Absent' },
    pending:   { cls: 'card--pending',   icon: '…', label: 'En cours' },
    unchecked: { cls: 'card--unchecked', icon: '?', label: 'À vérifier' },
  };
  const s = statusMap[status];
  const tags = (platform.tags || []).map(t => `<span class="p-tag">${sanitize(t)}</span>`).join('');
  const note = platform.note ? `<span class="p-note">${sanitize(platform.note.replace('{q}', query))}</span>` : '';

  return `
    <div class="platform-card ${s.cls}" data-id="${platform.id}">
      <div class="pcard-top">
        <span class="pcard-name">${sanitize(platform.name)}</span>
        <span class="pcard-status ${s.cls}-badge">${s.icon} ${s.label}</span>
      </div>
      ${tags ? `<div class="pcard-tags">${tags}</div>` : ''}
      ${note ? `<div class="pcard-note">${note}</div>` : ''}
      <div class="pcard-actions">
        <a class="pcard-link" href="${sanitize(url)}" target="_blank" rel="noopener noreferrer" title="Ouvrir le profil">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Ouvrir
        </a>
        <button class="pcard-btn pcard-btn--found" data-id="${platform.id}" data-status="found" title="Marquer comme trouvé">✓</button>
        <button class="pcard-btn pcard-btn--notfound" data-id="${platform.id}" data-status="notfound" title="Marquer comme absent">✗</button>
        <button class="pcard-btn pcard-btn--reset" data-id="${platform.id}" data-status="unchecked" title="Réinitialiser">↺</button>
      </div>
    </div>`;
}

function attachPlatformEvents() {
  document.querySelectorAll('.pcard-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const status = btn.dataset.status;
      State.results[id] = status;
      saveResults();

      // Mise à jour visuelle sans re-render complet
      const card = document.querySelector(`.platform-card[data-id="${id}"]`);
      if (card) {
        card.className = card.className.replace(/card--(found|notfound|pending|unchecked)/g, '');
        const statusMap = { found: 'card--found', notfound: 'card--notfound', pending: 'card--pending', unchecked: 'card--unchecked' };
        card.classList.add(statusMap[status]);
        const statusSpan = card.querySelector('.pcard-status');
        if (statusSpan) {
          const labelMap = { found: '✓ Trouvé', notfound: '✗ Absent', pending: '… En cours', unchecked: '? À vérifier' };
          statusSpan.textContent = labelMap[status];
          statusSpan.className = `pcard-status ${statusMap[status]}-badge`;
        }
      }

      // Mettre à jour les stats
      const stats = document.getElementById('result-stats');
      if (stats) {
        stats.querySelector('.stat-found').textContent = `${getFoundCount()} trouvés`;
        stats.querySelector('.stat-notfound').textContent = `${getNotFoundCount()} absents`;
        stats.querySelector('.stat-unchecked').textContent = `${Object.values(State.results).filter(v => v === 'unchecked').length} à vérifier`;
      }
    });
  });
}

// =============================================================================
// RENDU INTERFACE — MODE PERSON SEARCH
// =============================================================================

function renderPersonSearch(fn, ln, loc) {
  const container = document.getElementById('results-container');
  if (!container) return;

  const general = PERSON_SEARCH_ENGINES.filter(e => e.category === 'general');
  const directory = PERSON_SEARCH_ENGINES.filter(e => e.category === 'directory');
  const france = PERSON_SEARCH_ENGINES.filter(e => e.category === 'france');
  const social = PERSON_SEARCH_ENGINES.filter(e => e.category === 'social');

  function renderEngineGroup(title, engines, note = '') {
    return `
      <div class="result-category">
        <div class="result-cat-header">
          <h3 class="cat-label">${title}</h3>
          ${note ? `<span class="cat-note">${note}</span>` : ''}
        </div>
        <div class="engine-grid">
          ${engines.map(e => {
            const url = buildUrl(e.url, fn + ' ' + ln, { fn, ln, loc });
            return `
              <a class="engine-card" href="${sanitize(url)}" target="_blank" rel="noopener noreferrer">
                <span class="engine-icon">${e.icon}</span>
                <div>
                  <div class="engine-name">${sanitize(e.name)}</div>
                  <div class="engine-desc">${sanitize(e.desc)}</div>
                </div>
                <svg class="engine-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>`;
          }).join('')}
        </div>
      </div>`;
  }

  // Section recherche inversée d'image
  const imageSection = `
    <div class="result-category">
      <div class="result-cat-header"><h3 class="cat-label">🖼 Recherche inversée d'image</h3></div>
      <div class="engine-grid">
        ${IMAGE_SEARCH.map(e => `
          <a class="engine-card" href="${sanitize(e.url)}" target="_blank" rel="noopener noreferrer">
            <span class="engine-icon">🔍</span>
            <div>
              <div class="engine-name">${sanitize(e.name)}</div>
              <div class="engine-desc">${sanitize(e.desc)}</div>
            </div>
            <svg class="engine-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>`).join('')}
      </div>
    </div>`;

  container.innerHTML =
    renderEngineGroup('🌐 Moteurs Généralistes', general) +
    renderEngineGroup('📋 Répertoires de Personnes (US)', directory, 'Données surtout américaines') +
    renderEngineGroup('🇫🇷 Annuaires Français', france) +
    renderEngineGroup('👤 Réseaux Sociaux', social) +
    imageSection;
}

// =============================================================================
// RENDU INTERFACE — MODE EMAIL
// =============================================================================

function renderEmailDiscovery(fn, ln, domain) {
  const container = document.getElementById('results-container');
  if (!container) return;

  const f = fn.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const l = ln.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');

  const patterns = EMAIL_PATTERNS.map(p => {
    const localPart = p.example(f, l);
    const email = `${localPart}@${domain}`;
    return { ...p, email, localPart };
  });

  // Grille des patterns générés
  const patternsHtml = patterns.map(p => `
    <div class="email-pattern-card" data-email="${sanitize(p.email)}">
      <div class="email-pattern-top">
        <span class="email-format-label">${p.label}@${sanitize(domain)}</span>
        <button class="email-copy-btn" data-email="${sanitize(p.email)}" title="Copier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
      <div class="email-address">${sanitize(p.email)}</div>
      <div class="email-verify-links">
        ${EMAIL_VERIFIERS.slice(0, 3).map(v => `
          <a class="email-verify-link" href="${sanitize(buildUrl(v.url, p.email, { email: p.email }))}" target="_blank" rel="noopener">
            ${sanitize(v.name)} ↗
          </a>`).join('')}
      </div>
    </div>`).join('');

  // Outils de vérification complets
  const verifiersHtml = EMAIL_VERIFIERS.map(v => {
    const testEmail = patterns[0]?.email || `example@${domain}`;
    return `
      <a class="engine-card" href="${sanitize(buildUrl(v.url, testEmail, { email: testEmail }))}" target="_blank" rel="noopener">
        <span class="engine-icon">✉</span>
        <div>
          <div class="engine-name">${sanitize(v.name)}</div>
          <div class="engine-desc">${sanitize(v.desc)}</div>
        </div>
        <svg class="engine-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>`;
  }).join('');

  // Recherche Hunter.io sur domaine
  const hunterDomain = `https://hunter.io/domain-search?domain=${encodeURIComponent(domain)}`;
  const emailHippo = `https://tools.emailhippo.com/email/address/verify/`;

  container.innerHTML = `
    <div class="result-category">
      <div class="result-cat-header">
        <h3 class="cat-label">📧 Patterns générés pour <strong>${sanitize(fn)} ${sanitize(ln)}</strong> @ <strong>${sanitize(domain)}</strong></h3>
        <button class="btn-copy-all" id="copy-all-emails">Copier tout</button>
      </div>
      <div class="email-patterns-grid">${patternsHtml}</div>
    </div>

    <div class="result-category">
      <div class="result-cat-header">
        <h3 class="cat-label">🔍 Recherche par domaine</h3>
        <span class="cat-note">${sanitize(domain)}</span>
      </div>
      <div class="engine-grid">
        <a class="engine-card" href="${sanitize(hunterDomain)}" target="_blank" rel="noopener">
          <span class="engine-icon">🎯</span>
          <div><div class="engine-name">Hunter.io — Domain Search</div><div class="engine-desc">Tous les emails publics du domaine ${sanitize(domain)}</div></div>
          <svg class="engine-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <a class="engine-card" href="https://phonebook.cz/?search=${sanitize(domain)}&type=email" target="_blank" rel="noopener">
          <span class="engine-icon">📒</span>
          <div><div class="engine-name">Phonebook.cz</div><div class="engine-desc">Emails et URLs du domaine en source ouverte</div></div>
          <svg class="engine-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <a class="engine-card" href="https://intelx.io/?s=${sanitize(domain)}" target="_blank" rel="noopener">
          <span class="engine-icon">🔎</span>
          <div><div class="engine-name">Intelligence X</div><div class="engine-desc">Moteur OSINT — fuites, Darkweb, pastebins</div></div>
          <svg class="engine-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>

    <div class="result-category">
      <div class="result-cat-header"><h3 class="cat-label">✅ Outils de vérification email</h3></div>
      <div class="engine-grid">${verifiersHtml}</div>
    </div>`;

  // Copier un email
  document.querySelectorAll('.email-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.email).then(() => {
        btn.textContent = '✓';
        setTimeout(() => btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`, 1500);
      });
    });
  });

  // Copier tout
  document.getElementById('copy-all-emails')?.addEventListener('click', () => {
    const all = patterns.map(p => p.email).join('\n');
    navigator.clipboard.writeText(all).then(() => {
      const btn = document.getElementById('copy-all-emails');
      if (btn) { btn.textContent = '✓ Copié !'; setTimeout(() => btn.textContent = 'Copier tout', 1500); }
    });
  });
}

// =============================================================================
// RENDU RAPPORT
// =============================================================================

function renderReport() {
  const container = document.getElementById('results-container');
  if (!container) return;

  const found = Object.entries(State.results).filter(([,v]) => v === 'found');
  const notFound = Object.entries(State.results).filter(([,v]) => v === 'notfound');

  // Construire une liste plate de toutes les plateformes pour lookup
  const platformLookup = {};
  Object.values(PLATFORMS_DB).forEach(cat => {
    cat.platforms.forEach(p => { platformLookup[p.id] = p; });
  });

  function platformRow(id, status) {
    const p = platformLookup[id];
    if (!p) return '';
    const url = buildUrl(p.url, State.query);
    return `
      <div class="report-row report-row--${status}">
        <span class="report-status-icon">${status === 'found' ? '✓' : '✗'}</span>
        <span class="report-platform">${sanitize(p.name)}</span>
        ${status === 'found' ? `<a class="report-url" href="${sanitize(url)}" target="_blank" rel="noopener">${sanitize(url.length > 60 ? url.substring(0,60)+'…' : url)}</a>` : '<span class="report-url-absent">—</span>'}
      </div>`;
  }

  const ghData = State.apiChecks.github;
  const kbData = State.apiChecks.keybase;

  const githubSection = ghData?.found ? `
    <div class="report-api-block">
      <h4>GitHub — ${sanitize(ghData.name || State.query)}</h4>
      <table class="report-table">
        ${ghData.followers != null ? `<tr><td>Followers</td><td>${ghData.followers}</td></tr>` : ''}
        ${ghData.repos != null ? `<tr><td>Repos publics</td><td>${ghData.repos}</td></tr>` : ''}
        ${ghData.company ? `<tr><td>Entreprise</td><td>${sanitize(ghData.company)}</td></tr>` : ''}
        ${ghData.location ? `<tr><td>Localisation</td><td>${sanitize(ghData.location)}</td></tr>` : ''}
        ${ghData.email ? `<tr><td>Email</td><td>${sanitize(ghData.email)}</td></tr>` : ''}
        ${ghData.blog ? `<tr><td>Site web</td><td><a href="${sanitize(ghData.blog)}" target="_blank">${sanitize(ghData.blog)}</a></td></tr>` : ''}
        ${ghData.created ? `<tr><td>Compte créé</td><td>${sanitize(ghData.created)}</td></tr>` : ''}
      </table>
    </div>` : '';

  container.innerHTML = `
    <div class="report-wrapper">
      <div class="report-header-block">
        <div class="report-meta">
          <span class="report-meta-item">🔍 Cible : <strong>${sanitize(State.query || State.firstName + ' ' + State.lastName)}</strong></span>
          <span class="report-meta-item">📅 Date : ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
          <span class="report-meta-item">✅ Trouvés : <strong>${found.length}</strong></span>
          <span class="report-meta-item">❌ Absents : <strong>${notFound.length}</strong></span>
        </div>
        <div class="report-actions">
          <button class="btn-report-export" id="export-txt">Exporter .txt</button>
          <button class="btn-report-export" id="export-json">Exporter .json</button>
          <button class="btn-report-print" id="print-report">Imprimer</button>
        </div>
      </div>

      ${githubSection}

      <div class="report-section">
        <h3 class="report-section-title">✓ Profils trouvés (${found.length})</h3>
        ${found.length ? found.map(([id]) => platformRow(id, 'found')).join('') : '<p class="report-empty">Aucun profil marqué comme trouvé.</p>'}
      </div>

      <div class="report-section">
        <h3 class="report-section-title">✗ Profils absents (${notFound.length})</h3>
        ${notFound.length ? notFound.map(([id]) => platformRow(id, 'notfound')).join('') : '<p class="report-empty">Aucun profil marqué comme absent.</p>'}
      </div>

      <div class="report-section">
        <h3 class="report-section-title">📝 Notes d'investigation</h3>
        <textarea class="report-notes" id="report-notes" placeholder="// Ajoutez vos notes d'investigation ici...">${sanitize(State.reportNotes)}</textarea>
        <button class="btn-save-notes" id="save-notes">Sauvegarder les notes</button>
      </div>
    </div>`;

  // Export .txt
  document.getElementById('export-txt')?.addEventListener('click', exportTxt);
  document.getElementById('export-json')?.addEventListener('click', exportJson);
  document.getElementById('print-report')?.addEventListener('click', () => window.print());

  // Sauvegarder notes
  document.getElementById('save-notes')?.addEventListener('change', (e) => {
    State.reportNotes = e.target.value;
  });
  document.getElementById('save-notes')?.addEventListener('click', () => {
    State.reportNotes = document.getElementById('report-notes')?.value || '';
    const btn = document.getElementById('save-notes');
    if (btn) { btn.textContent = '✓ Sauvegardé'; setTimeout(() => btn.textContent = 'Sauvegarder les notes', 1500); }
  });
}

function exportTxt() {
  const platformLookup = {};
  Object.values(PLATFORMS_DB).forEach(cat => {
    cat.platforms.forEach(p => { platformLookup[p.id] = p; });
  });

  const found = Object.entries(State.results).filter(([,v]) => v === 'found');
  const notFound = Object.entries(State.results).filter(([,v]) => v === 'notfound');

  let txt = `RAPPORT OSINT — CÉLÉRYS\n`;
  txt += `${'='.repeat(50)}\n`;
  txt += `Cible      : ${State.query || State.firstName + ' ' + State.lastName}\n`;
  txt += `Date       : ${new Date().toLocaleString('fr-FR')}\n`;
  txt += `Trouvés    : ${found.length}\n`;
  txt += `Absents    : ${notFound.length}\n`;
  txt += `\n${'─'.repeat(50)}\n`;
  txt += `PROFILS TROUVÉS\n${'─'.repeat(50)}\n`;
  found.forEach(([id]) => {
    const p = platformLookup[id];
    if (p) txt += `[+] ${p.name.padEnd(25)} ${buildUrl(p.url, State.query)}\n`;
  });
  txt += `\n${'─'.repeat(50)}\n`;
  txt += `PROFILS ABSENTS\n${'─'.repeat(50)}\n`;
  notFound.forEach(([id]) => {
    const p = platformLookup[id];
    if (p) txt += `[-] ${p.name}\n`;
  });
  if (State.reportNotes) {
    txt += `\n${'─'.repeat(50)}\nNOTES\n${'─'.repeat(50)}\n${State.reportNotes}\n`;
  }
  if (State.apiChecks.github?.found) {
    const g = State.apiChecks.github;
    txt += `\n${'─'.repeat(50)}\nGITHUB API DATA\n${'─'.repeat(50)}\n`;
    txt += `Nom        : ${g.name || ''}\nFollowers  : ${g.followers || 0}\nRepos      : ${g.repos || 0}\nEmail      : ${g.email || ''}\nLocalité   : ${g.location || ''}\nSite       : ${g.blog || ''}\nURL        : ${g.url}\n`;
  }
  txt += `\n${'='.repeat(50)}\nGénéré par Célérys OSINT — https://celerys-osint.github.io\n`;

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `celerys-rapport-${slugify(State.query || State.firstName + State.lastName)}-${Date.now()}.txt`;
  link.click();
}

function exportJson() {
  const platformLookup = {};
  Object.values(PLATFORMS_DB).forEach(cat => {
    cat.platforms.forEach(p => { platformLookup[p.id] = p; });
  });

  const data = {
    meta: {
      tool: 'Célérys OSINT',
      url: 'https://celerys-osint.github.io',
      date: new Date().toISOString(),
      target: State.query || `${State.firstName} ${State.lastName}`,
      type: State.mode,
    },
    summary: {
      found: getFoundCount(),
      notFound: getNotFoundCount(),
      total: getTotalPlatforms(),
    },
    results: Object.entries(State.results).reduce((acc, [id, status]) => {
      const p = platformLookup[id];
      if (p) acc.push({ id, name: p.name, status, url: buildUrl(p.url, State.query), tags: p.tags });
      return acc;
    }, []),
    apiData: State.apiChecks,
    notes: State.reportNotes,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `celerys-rapport-${slugify(State.query || State.firstName + State.lastName)}-${Date.now()}.json`;
  link.click();
}

// =============================================================================
// INITIALISATION PRINCIPALE
// =============================================================================

export function init() {
  loadHistory();
  setupTabs();
  setupSearchForms();
  setupFilters();
  updateStats();
}

function updateStats() {
  const totalEl = document.getElementById('total-platforms');
  if (totalEl) totalEl.textContent = getTotalPlatforms() + '+';
}

function setupTabs() {
  document.querySelectorAll('.tool-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.tab;
      State.mode = mode;
      document.querySelectorAll('.tool-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === mode));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === mode));
    });
  });
}

function setupSearchForms() {
  // Formulaire Username
  const usernameForm = document.getElementById('username-form');
  usernameForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = document.getElementById('username-input')?.value?.trim();
    if (!q) return;

    State.query = q;
    State.results = loadResults(q);
    State.apiChecks = {};

    // Initialiser toutes les plateformes comme "unchecked" si pas déjà en cache
    Object.values(PLATFORMS_DB).forEach(cat => {
      cat.platforms.forEach(p => {
        if (!State.results[p.id]) State.results[p.id] = 'unchecked';
      });
    });

    showResultsPanel(`Résultats pour "${sanitize(q)}"`);
    renderUsernameResults(q);

    // Vérifications API en arrière-plan
    const githubSpinner = showApiSpinner('GitHub');
    const keybaseSpinner = showApiSpinner('Keybase');

    Promise.all([
      checkGitHub(q).then(found => {
        hideApiSpinner(githubSpinner);
        if (found !== null) {
          State.results['github'] = found ? 'found' : 'notfound';
          State.results['keybase'] = 'unchecked';
          saveResults();
          renderUsernameResults(q);
        }
      }),
      checkKeybase(q).then(found => {
        hideApiSpinner(keybaseSpinner);
        if (found !== null) {
          State.results['keybase'] = found ? 'found' : 'notfound';
          saveResults();
          renderUsernameResults(q);
        }
      }),
    ]);
  });

  // Formulaire Person Search
  const personForm = document.getElementById('person-form');
  personForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fn = document.getElementById('person-firstname')?.value?.trim();
    const ln = document.getElementById('person-lastname')?.value?.trim();
    const loc = document.getElementById('person-location')?.value?.trim() || '';
    if (!fn || !ln) return;

    State.firstName = fn;
    State.lastName = ln;
    State.location = loc;

    showResultsPanel(`Résultats pour "${sanitize(fn)} ${sanitize(ln)}"`);
    renderPersonSearch(fn, ln, loc);
  });

  // Formulaire Email Discovery
  const emailForm = document.getElementById('email-form');
  emailForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fn = document.getElementById('email-firstname')?.value?.trim();
    const ln = document.getElementById('email-lastname')?.value?.trim();
    const domain = document.getElementById('email-domain')?.value?.trim()?.replace(/^@/, '').toLowerCase();
    if (!fn || !ln || !domain) return;

    State.firstName = fn;
    State.lastName = ln;
    State.emailDomain = domain;

    showResultsPanel(`Patterns email pour "${sanitize(fn)} ${sanitize(ln)}" @ ${sanitize(domain)}`);
    renderEmailDiscovery(fn, ln, domain);
  });
}

function showApiSpinner(name) {
  // Petite notification discrète
  const notif = document.createElement('div');
  notif.className = 'api-spinner-notif';
  notif.textContent = `Vérification ${name}...`;
  document.body.appendChild(notif);
  return notif;
}

function hideApiSpinner(el) {
  el?.remove();
}

function showResultsPanel(title) {
  const panel = document.getElementById('results-panel');
  const titleEl = document.getElementById('results-title');
  if (panel) panel.style.display = 'block';
  if (titleEl) titleEl.textContent = title;

  // Activer l'onglet rapport
  const reportTab = document.querySelector('.mode-tab[data-mode="report"]');
  if (reportTab) reportTab.style.display = 'inline-flex';

  panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setupFilters() {
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      State.activeFilter = btn.dataset.cat;
      document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      if (State.query) renderUsernameResults(State.query);
    });
  });

  // Onglets du panneau de résultats
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t === tab));
      if (mode === 'report') renderReport();
      else if (mode === 'results') {
        if (State.mode === 'username' && State.query) renderUsernameResults(State.query);
        else if (State.mode === 'person') renderPersonSearch(State.firstName, State.lastName, State.location);
        else if (State.mode === 'email') renderEmailDiscovery(State.firstName, State.lastName, State.emailDomain);
      }
    });
  });
}

export default { init, getTotalPlatforms, PLATFORMS_DB };
