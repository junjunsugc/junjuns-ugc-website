
/* Junjuns UGC: content sourced from GitHub-editable JSON. */
(async function () {
  const escape = s => String(s ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );

  const media = s => {
    if (!s) return '';
    const v = String(s);
    if (/^https?:\/\//i.test(v)) return v;
    return v.replace(/^\//, '');
  };

  // Create a video player for MP4, Instagram, TikTok or YouTube.
  function createVideoPlayer(project, area) {
    area.replaceChildren();

    // Uploaded MP4 or direct video URL takes priority.
    if (project.video) {
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = media(project.video);
      area.append(video);
      return;
    }

    const url = String(project.video_url || '').trim();

    if (url) {
      let embedUrl = '';

      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();

        // Instagram Reels and posts
        if (
          host === 'instagram.com' ||
          host === 'www.instagram.com'
        ) {
          const match = parsed.pathname.match(
            /^\/(reel|p|tv)\/([A-Za-z0-9_-]+)/
          );

          if (match) {
            embedUrl =
              'https://www.instagram.com/' +
              match[1] + '/' + match[2] + '/embed/';
          }
        }

        // TikTok videos
        else if (
          host === 'tiktok.com' ||
          host === 'www.tiktok.com' ||
          host === 'm.tiktok.com'
        ) {
          const match = parsed.pathname.match(
            /\/video\/(\d+)/
          );

          if (match) {
            embedUrl =
              'https://www.tiktok.com/embed/v2/' +
              match[1];
          }
        }

        // YouTube and YouTube Shorts
        else if (
          host === 'youtube.com' ||
          host === 'www.youtube.com' ||
          host === 'm.youtube.com' ||
          host === 'youtu.be'
        ) {
          let id = '';

          if (host === 'youtu.be') {
            id = parsed.pathname.split('/')[1];
          } else {
            id = parsed.searchParams.get('v') || '';
            if (!id) {
              const match = parsed.pathname.match(
                /^\/(?:shorts|embed)\/([\w-]+)/
              );
              if (match) id = match[1];
            }
          }

          if (/^[\w-]{11}$/.test(id)) {
            embedUrl =
              'https://www.youtube-nocookie.com/embed/' +
              id;
          }
        }

        // Direct MP4 URL
        else if (/\.mp4$/i.test(parsed.pathname)) {
          const video = document.createElement('video');
          video.controls = true;
          video.playsInline = true;
          video.preload = 'metadata';
          video.src = url;
          area.append(video);
          return;
        }
      } catch (error) {
        console.warn('Invalid video URL', error);
      }

      if (embedUrl) {
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.title = project.title || 'UGC video';
        iframe.loading = 'lazy';
        iframe.allowFullscreen = true;
        iframe.allow =
          'autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.referrerPolicy =
          'strict-origin-when-cross-origin';

        iframe.style.cssText = [
          'display:block',
          'width:100%',
          'height:600px',
          'max-height:80vh',
          'border:0',
          'border-radius:12px',
          'background:#fff'
        ].join(';');

        area.append(iframe);
        return;
      }

      // Fallback for other links
      if (/^https?:\/\//i.test(url)) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Watch video ↗';
        area.append(link);
        return;
      }
    }

    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.textContent = 'Video coming soon 🎬';
    area.append(placeholder);
  }

  // Website settings
  try {
    const res = await fetch('content/site.json', {
      cache: 'no-cache'
    });

    if (res.ok) {
      const s = await res.json();

      const label = document.querySelector(
        '.window-copy .paper-label'
      );
      if (label && s.hero_label) {
        label.textContent = s.hero_label;
      }

      const intro = document.querySelector(
        '.window-copy .lede'
      );
      if (intro && s.hero_description) {
        intro.textContent = s.hero_description;
      }

      const portrait = document.querySelector('.portrait-art');
      if (portrait && s.portrait) {
        portrait.replaceChildren();

        const img = document.createElement('img');
        img.src = media(s.portrait);
        img.alt = 'Junjuns UGC creator';
        img.style.cssText =
          'width:100%;height:100%;object-fit:cover;display:block';

        portrait.append(img);
      }

      if (s.email) {
        document.querySelectorAll('[data-email]').forEach(
          el => el.dataset.email = s.email
        );

        document.querySelectorAll('[data-cms-email]').forEach(
          el => {
            el.href = 'mailto:' + s.email;
            el.textContent = s.email;
          }
        );
      }
    }
  } catch (e) {
    console.warn('Website settings not loaded', e);
  }

  // Portfolio projects
  try {
    const manifest = await fetch('content/projects.json', {
      cache: 'no-cache'
    });

    if (!manifest.ok) return;

    const ids = await manifest.json();

    const loaded = await Promise.all(
      ids.map(async id => {
        try {
          const r = await fetch(
            'content/projects/' +
            encodeURIComponent(id) + '.json',
            { cache: 'no-cache' }
          );

          return r.ok ? { id, ...await r.json() } : null;
        } catch (e) {
          return null;
        }
      })
    );

    const ps = loaded.filter(
      p => p && p.published !== false
    );

    const colors = {
      beauty: 'pink',
      fashion: 'lav',
      lifestyle: 'blue'
    };

    const page =
      location.pathname.split('/').pop() || 'index.html';

    const targets = page === 'index.html'
      ? document.querySelector('.grid:has([data-project])')
      : document.querySelector('.project-grid');

    if (targets) {
      const selection = page === 'index.html'
        ? ps.slice(0, 3)
        : ps.filter(p => p.category === ({
            'beauty.html': 'beauty',
            'fashion.html': 'fashion',
            'lifestyle.html': 'lifestyle'
          }[page]));

      targets.innerHTML = selection.map(p => `
        <article class="card reveal show"
          data-category="${escape(p.category)}">
          <div class="thumb ${colors[p.category] || 'pink'}">
            <span class="tag">
              ${escape(p.status || 'Portfolio sample')}
            </span>
            ${p.cover
              ? `<img loading="lazy"
                  alt="${escape(p.title)}"
                  src="${escape(media(p.cover))}"
                  style="width:100%;height:100%;object-fit:cover">`
              : '<span class="emoji">✿</span>'
            }
          </div>
          <div class="cardbody">
            <span class="eyebrow">
              ${escape(p.category)} · Creative UGC
            </span>
            <h3>${escape(p.title)}</h3>
            <p>${escape(p.description)}</p>
            <div class="cardbottom">
              <span class="note">
                ${escape(p.status || 'Portfolio sample')}
              </span>
              <button class="smallbtn"
                data-cms-project="${escape(p.id)}">
                View project ↗
              </button>
            </div>
          </div>
        </article>
      `).join('');

      targets.addEventListener('click', e => {
        const b = e.target.closest('[data-cms-project]');
        if (!b) return;

        const p = ps.find(
          x => x.id === b.dataset.cmsProject
        );

        const modal = document.querySelector('#videoModal');
        if (!p || !modal) return;

        modal.querySelector('#modalTitle').textContent =
          p.title;

        modal.querySelector('#modalDesc').textContent =
          p.description || '';

        const area = modal.querySelector('#modalMedia');

        createVideoPlayer(p, area);

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        modal.querySelector('#modalClose').focus();
      });
    }
  } catch (e) {
    console.warn('Portfolio projects not loaded', e);
  }
})();
