import { createSignal, onCleanup } from 'solid-js';
import RelativeTime from './RelativeTime';

export default () => {
  const [stats, setStats] = createSignal<{ total_events: number, longest_absence: string, last_seen: string; } | undefined>(undefined);
  const numFmt = new Intl.NumberFormat(navigator.languages);

  const interval = setInterval(() => {
    fetch("http://localhost:8787/stats").then((res) => res.json()).then(setStats);
  }, 1000);
  onCleanup(() => clearInterval(interval));

  return (
    <main class="max-w-lg w-full">
      <header class="absolute left-0 top-0 min-w-full pt-8 px-8 flex items-center">
        {/* <IconCellularOff class={`w-6 h-6 transition-opacity duration-300 text-pink-400 dark:text-emerald-400 invert-0 ${state() === 1 ? "opacity-0" : "opacity-100"}`} title="disconnected" /> */}
      </header>
      <ul class="flex flex-col gap-y-8">
        <li class="flex items-center justify-between">
          <h3>last seen<sub>(ago)</sub></h3>
          <RelativeTime time={stats()?.last_seen ?? (new Date()).toISOString()} />
        </li>
        <li class="flex items-center justify-between">
          <h3>longest absence</h3>
        </li>
        <li class="flex items-center justify-between">
          <h3>total heartbeats</h3>
          <span class="text-3xl">
            {numFmt.format(stats()?.total_events ?? 0)
              .split(',')
              .map((s, i) => <>{i == 0 ? null : <sub>,</sub>}<span>{s}</span></>)}
          </span>
        </li>
      </ul>
      <footer class="absolute left-0 bottom-0 min-w-full pb-8 px-8 flex items-center justify-end">
        <ul class="flex gap-x-4 items-center justify-end">
          <li>
            <a href="https://github.com/drnfns/lastseen" class="text-sm hover:underline hover:text-f-high transition-colors">lastseen</a>
          </li>
        </ul>
      </footer>
    </main >
  );
};
