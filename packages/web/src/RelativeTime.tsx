import { createMemo, createSignal, For, onCleanup } from 'solid-js';

function calcRel(date1: Date, date2: Date) {
  const diff = Math.abs(date2.getTime() - date1.getTime());

  return [
    Math.floor(diff / (1000 * 60 * 60 * 24)),
    Math.floor(diff / (1000 * 60 * 60)) % 24,
    Math.floor(diff / (1000 * 60)) % 60,
    Math.floor(diff / 1000) % 60
  ].map((x) => x * Math.sign(diff));
}

export default (props: { time: string; compareTo?: string; }) => {
  const dateFmt = new Intl.DateTimeFormat(navigator.languages, { dateStyle: 'medium', timeStyle: 'medium' });

  const [now, setNow] = createSignal(new Date());
  const upd = setInterval(() => setNow(new Date()), 1000);
  onCleanup(() => clearInterval(upd));
  const formatted = createMemo(() => calcRel(new Date(props.time), now()));

  return (
    <span class="text-3xl" title={dateFmt.format(new Date(props.time))}>
      <For each={formatted()} fallback={<span>loading</span>}>
        {(it, i) => (<>
          <span>{it}</span>
          <sub class="[&:not(:last-child)]:mr-[1ch]">
            {i() == 0 ? "d" : i() == 1 ? "h" : i() == 2 ? "m" : "s"}
          </sub>
        </>)}
      </For>
    </span>
  );
};
