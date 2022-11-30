import {
  Container,
  Container as pxContainer,
  DisplayObjectEvents,
  IPointData,
} from "pixi.js";
import { createEffect, JSX, onCleanup, splitProps } from "solid-js";
import { Events, EventTypes } from "./events";
import { Uses } from "./interfaces";
import { pixiChildren, useDiffChildren } from "./usePixiChildren";

export interface ContainerProps
  extends Partial<Omit<pxContainer, "children">>,
    Partial<Events> {
  children?: any;
  name: string;
  use: Uses<pxContainer>;
}

export function Sprite(props: ContainerProps): JSX.Element {
  const [ours, events, pixis] = splitProps(
    props,
    ["children", "name", "use"],
    EventTypes
  );
  let container = new Container();

  container.name = ours.name;

  createEffect(() => {
    const handlers: [keyof DisplayObjectEvents, any][] = Object.keys(
      events
    ).map((p) => {
      const handler = events[p as unknown as keyof Events];
      const n = p.split(":")[1] as keyof DisplayObjectEvents;
      container.on(n, handler as any);
      return [n, handler];
    });

    onCleanup(() => {
      handlers.forEach(([e, handler]) => container.off(e, handler));
    });
  });

  createEffect(() => {
    for (let key in pixis) {
      (container as any)[key] = (pixis as any)[key];
    }
  });

  const [, update] = useDiffChildren(container);
  const resolved = pixiChildren(ours.children);
  createEffect(() => {
    update(resolved());
  });

  createEffect(() => {
    if (props.use) {
      if (Array.isArray(props.use)) {
        props.use.forEach((fn) => fn(container));
      } else {
        props.use(container);
      }
    }
  });
  // Add the view to the DOM
  return container as unknown as JSX.Element;
}
