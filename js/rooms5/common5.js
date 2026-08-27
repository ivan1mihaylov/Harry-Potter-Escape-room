import { head, $, $$ } from '../rooms/common.js';

export function makeMysteryRoom(meta, steps) {
  return function mount(root, api) {
    const d = api.data;
    if (d.step == null) d.step = 0;
    api.saveData();

    const draw = () => {
      if (api.solved) {
        root.innerHTML = `${head(api)}<div class="panel mystery-done"><div class="mystery-sigil">${meta.rune}</div><p>Камерата е тиха. Руната вече е у теб.</p></div>`;
        return;
      }
      const step = steps[d.step];
      root.innerHTML = `${head(api)}
        <div class="panel mystery-panel">
          <div class="mystery-progress">${steps.map((_, i) => `<i class="${i < d.step ? 'past' : i === d.step ? 'now' : ''}"></i>`).join('')}</div>
          <p class="panel-title">${step.title}</p>
          <p class="mystery-clue">${step.clue}</p>
          <div class="mystery-options">${step.options.map((o, i) => `<button class="mystery-option" data-i="${i}"><span>${o.label}</span></button>`).join('')}</div>
          <p class="muted mystery-count">изпитание ${d.step + 1} от ${steps.length}</p>
        </div>`;
      $$('.mystery-option', root).forEach(b => b.addEventListener('click', () => {
        const o = step.options[+b.dataset.i];
        if (!o.ok) {
          b.classList.add('wrong'); b.disabled = true;
          api.fail(o.reason || 'Камерата отхвърля избора ти.');
          return;
        }
        b.classList.add('right'); api.sfx.chime(); api.fx.sparksFrom(b, { count: 20, color: '#b8a7ff' });
        d.step++; api.saveData();
        if (d.step >= steps.length) setTimeout(() => api.solve(meta.done), 500);
        else setTimeout(draw, 500);
      }));
    };
    draw();
  };
}

export function option(label, ok = false, reason = '') { return { label, ok, reason }; }
