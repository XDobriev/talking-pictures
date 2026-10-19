import { motion } from 'framer-motion';
import { useState } from 'react';
import { SCENES } from '../data/scenes';
import { useStore } from '../game/store';
import { DEFAULT_SAVE, type SaveData } from '../platform';
import { CloseIcon } from './icons';

// Размеры — в пикселях холста 1920×1080. На телефоне 844×390 холст сжимается в 0,36 раза,
// поэтому мельче 40 px холста (≈ 14 CSS px) текст не делаем.

type SettingKey = keyof SaveData['settings'];

const TOGGLES: { key: SettingKey; title: string; hint: string }[] = [
  { key: 'voice', title: 'Голос рассказчика', hint: 'Задания и названия предметов' },
  { key: 'echoPause', title: 'Пауза «Скажи!»', hint: 'Время, чтобы ребёнок повторил слово вслух' },
  { key: 'sfx', title: 'Звуки', hint: 'Голоса зверей, шорох, «чпок»' },
  { key: 'music', title: 'Музыка', hint: 'Тихая мелодия на фоне' },
];

function Toggle({ on, onChange, label }: { on: boolean; onChange(v: boolean): void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onPointerDown={(e) => {
        if (!e.isPrimary) return;
        onChange(!on);
      }}
      className="relative h-[88px] w-[160px] shrink-0 rounded-full transition-colors"
      style={{ background: on ? 'var(--color-moss-deep)' : 'rgba(61,58,47,0.3)' }}
    >
      <motion.span
        className="absolute top-[9px] h-[70px] w-[70px] rounded-full bg-cream shadow"
        animate={{ left: on ? 81 : 9 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </button>
  );
}

export function ParentMenu({ onClose }: { onClose(): void }) {
  const { save, update } = useStore();
  const [tab, setTab] = useState<'settings' | 'talk' | 'about'>('talk');
  const [confirmReset, setConfirmReset] = useState(false);
  const totalLevels = SCENES.reduce((n, s) => n + s.levels.length, 0);

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center" data-testid="parent-menu">
      <div className="absolute inset-0 bg-scrim/70" />
      <motion.div
        className="paper relative flex h-[1010px] w-[1820px] overflow-hidden rounded-[56px]"
        style={{ boxShadow: '0 14px 0 0 var(--color-paper-edge), 0 40px 80px -20px rgba(0,0,0,0.6)' }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav className="flex w-[460px] shrink-0 flex-col gap-3 bg-paper-deep/70 px-8 py-12">
          <h2 className="mb-6 px-4 font-display text-[56px] leading-none">Для взрослых</h2>
          {(
            [
              ['talk', 'Поговорите'],
              ['settings', 'Настройки'],
              ['about', 'Об игре'],
            ] as const
          ).map(([id, title]) => (
            <button
              key={id}
              type="button"
              onPointerDown={() => setTab(id)}
              className="rounded-[28px] px-6 py-6 text-left text-[48px] font-bold transition-colors"
              style={{ background: tab === id ? 'var(--color-cream)' : 'transparent', color: tab === id ? 'var(--color-ink)' : 'var(--color-ink-soft)' }}
            >
              {title}
            </button>
          ))}
          <div className="mt-auto px-4 text-[40px] leading-snug text-ink-soft">
            Пройдено уровней: <b className="text-ink">{save.completed.length}</b> из {totalLevels}
            <br />
            Наклеек: <b className="text-ink">{save.stickers.length}</b>
          </div>
        </nav>

        <section className="relative flex-1 overflow-y-auto px-14 py-12">
          <button
            type="button"
            aria-label="закрыть"
            data-testid="parent-close"
            className="absolute right-6 top-6 h-[120px] w-[120px] rounded-full bg-paper-deep p-[30px] text-ink"
            onPointerDown={onClose}
          >
            <CloseIcon />
          </button>

          {tab === 'talk' && (
            <div className="max-w-[1100px]">
              <h3 className="font-display text-[60px] leading-tight">Вопросы для совместной игры</h3>
              <p className="mt-4 text-[42px] leading-snug text-ink-soft">
                Главная польза разглядывания — разговор со взрослым. Задайте ребёнку пару вопросов по картинке, дайте ответить своими словами и
                похвалите за попытку.
              </p>
              {SCENES.map((s) => (
                <div key={s.id} className="mt-10">
                  <div className="text-[42px] font-extrabold uppercase tracking-wide text-moss-deep">{s.title}</div>
                  <ul className="mt-3 flex flex-col gap-3">
                    {s.parentQuestions.map((q) => (
                      <li key={q} className="rounded-[24px] bg-cream px-8 py-6 text-[44px] leading-snug">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {tab === 'settings' && (
            <div className="max-w-[1100px]">
              <h3 className="font-display text-[60px] leading-tight">Настройки</h3>
              <div className="mt-6 flex flex-col gap-4">
                {TOGGLES.map((t) => (
                  <div key={t.key} className="flex items-center gap-8 rounded-[28px] bg-cream px-8 py-6">
                    <div className="flex-1">
                      <div className="text-[46px] font-bold leading-tight">{t.title}</div>
                      <div className="text-[40px] leading-snug text-ink-soft">{t.hint}</div>
                    </div>
                    <Toggle
                      label={t.title}
                      on={save.settings[t.key]}
                      onChange={(v) => update((s) => ({ ...s, settings: { ...s.settings, [t.key]: v } }))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-10 rounded-[28px] border-4 border-dashed border-berry/40 px-8 py-6">
                <div className="text-[44px] font-bold">Сбросить прогресс</div>
                <div className="text-[40px] leading-snug text-ink-soft">Наклейки и пройденные уровни будут удалены.</div>
                <button
                  type="button"
                  onPointerDown={() => {
                    if (!confirmReset) return setConfirmReset(true);
                    update(() => ({ ...DEFAULT_SAVE, settings: save.settings, tutorialDone: true }));
                    setConfirmReset(false);
                  }}
                  className="mt-5 rounded-full bg-berry px-10 py-5 text-[42px] font-bold text-paper"
                >
                  {confirmReset ? 'Точно сбросить?' : 'Сбросить'}
                </button>
              </div>
            </div>
          )}

          {tab === 'about' && (
            <div className="max-w-[1100px] text-[42px] leading-snug">
              <h3 className="font-display text-[60px] leading-tight">Об игре</h3>
              <p className="mt-4">
                «Говорящие картинки» — книжка-разглядывалка, которая разговаривает с ребёнком. Задания идут по ступеням развития речи:
              </p>
              <ol className="mt-4 list-decimal pl-14 text-ink-soft">
                <li>Кто это? — названия предметов и зверей</li>
                <li>Кто так говорит? — звукоподражание и слуховое внимание</li>
                <li>Кто что делает? — глаголы</li>
                <li>Какой? — цвет и размер</li>
                <li>Где? — предлоги: на, под, за, в</li>
                <li>Что чувствует? — эмоции и сочувствие</li>
              </ol>
              <p className="mt-4">
                После находки голос предлагает повторить слово вслух («Скажи: бе-лоч-ка!») и делает паузу. Микрофон не используется. В игре нет
                проигрышей, таймеров и покупок, доступных ребёнку.
              </p>
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
}
