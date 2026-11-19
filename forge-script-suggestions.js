(() => {
  const faithTerms = /\b(qur'?an|islam|muslim|hadith|dua|salah|prayer|rak['’]?ahs?|surah|wudu|ramadan|prophet|masjid|allah)\b/i;
  const stopWords = new Set('a an and are as at be but by can for from how i in is it of on or the this to was what when where which who with'.split(' '));

  function clean(value) {
    return String(value || '')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/^\s*(?:Q|A|B|C|D|Correct)\s*:\s*/gim, '')
      .replace(/^\s*\d+\s*[:.)-]\s*/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function shorten(value, maxLength) {
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength).replace(/\s+\S*$/, '').trim();
  }

  function subjectOf(source, title) {
    const explicit = clean(title);
    if (explicit) {
      const subject = explicit
        .replace(/^quick\s+(?:quiz|challenge)\s*:\s*/i, '')
        .replace(/[!?.,:;]+$/, '')
        .trim();
      return shorten(subject, 38);
    }
    const text = clean(source);
    if (!text) return '';
    const sentence = (text.split(/[.!?؟\n]/).find(part => part.trim()) || text).trim();
    const words = sentence.split(/\s+/).filter(word => !stopWords.has(word.toLowerCase()));
    return shorten(words.slice(0, 7).join(' ').replace(/[,:;]+$/, ''), 38);
  }

  function build(source, title, kind) {
    const subject = subjectOf(source, title);
    const faith = faithTerms.test((source || '') + ' ' + (title || ''));
    if (kind === 'quiz') {
      return {
        intro: [
          subject && !faith ? `Quick challenge: how much do you know about ${subject}?` : 'Quick challenge: how many can you get right?',
          'Keep score—no pressure if the distractors win 😄',
          'Think you know this topic? Let’s find out.'
        ],
        outro: [
          'How many did you get right? Drop your score below.',
          'Which question caught you out? Tell us in the comments.',
          'What should the next quiz cover? Suggest a topic below.'
        ]
      };
    }

    return {
      intro: subject ? [
        `A quick look at ${subject}: here’s the useful part.`,
        `What do you already know about ${subject}?`,
        `One idea about ${subject} worth a closer look.`
      ] : [
        'Here’s one useful idea to take with you.',
        'A quick look—then you decide what you think.',
        'Stay for one practical takeaway.'
      ],
      outro: faith ? [
        'What reflection will you carry with you? Share respectfully below.',
        'Which point would you like explained more? Ask in the comments.',
        'Who might find this reminder useful? Share it with them.'
      ] : [
        subject ? `What is your take on ${subject}? Share it below.` : 'What stood out to you? Share your take below.',
        'Which part surprised you? Tell us in the comments.',
        'What should we try next? Leave an idea below.'
      ]
    };
  }

  function render(container, options, targetId) {
    const host = typeof container === 'string' ? document.getElementById(container) : container;
    if (!host) return;
    host.replaceChildren();
    for (const text of options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'forge-suggestion';
      button.textContent = text;
      button.addEventListener('click', () => {
        const target = document.getElementById(targetId);
        if (!target) return;
        target.value = text;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
        host.querySelectorAll('.forge-suggestion').forEach(item => item.classList.toggle('on', item === button));
      });
      host.appendChild(button);
    }
  }

  if (!document.getElementById('forgeSuggestionStyles')) {
    const style = document.createElement('style');
    style.id = 'forgeSuggestionStyles';
    style.textContent = '.forge-suggestions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.forge-suggestion{border:1px solid var(--line,#394150);border-radius:999px;background:var(--panel2,#1a2333);color:var(--text,#eef2f8);padding:7px 11px;font:inherit;font-size:13px;cursor:pointer}.forge-suggestion:hover,.forge-suggestion.on{border-color:var(--accent,#e9c46a)}';
    document.head.appendChild(style);
  }

  window.ForgeScriptSuggestions = { build, render };
})();
