import {
  BaseTexture,
  DisplayObject,
  DisplayObjectEvents,
  IBaseTextureOptions,
  IPointData,
  Sprite as pxSprite,
  SpriteSource,
  Texture,
} from "pixi.js";
import { createEffect, JSX, onCleanup, splitProps } from "solid-js";
import { Events, EventTypes } from "./events";
import { TextureWithOptions, Transform, Uses } from "./interfaces";
import { pixiChildren, useDiffChildren } from "./usePixiChildren";
export interface SpriteProps
  extends Partial<Omit<pxSprite, "texture" | "children" | keyof Transform>>,
    Transform,
    Partial<Events> {
  children?: any;
  from?: SpriteSource;
  texture?: TextureWithOptions;
  textureOptions?: IBaseTextureOptions<any> | undefined;
  name: string;
  use?: Uses<pxSprite>;
}

export function Sprite(props: SpriteProps): JSX.Element {
  let sprite: pxSprite;
  const [ours, events, pixis] = splitProps(
    props,
    ["children", "texture", "from", "textureOptions", "name", "use"],
    EventTypes
  );

  if (!ours.from && !ours.texture) {
    sprite = new pxSprite(Texture.EMPTY);
  } else {
    sprite =
      ours.texture && ours.texture[0] instanceof Texture
        ? new pxSprite(ours.texture[0])
        : pxSprite.from(props.from!, props.textureOptions);
  }

  sprite.name = ours.name;

  createEffect(() => {
    if (ours.texture && ours.texture[0] instanceof BaseTexture)
      sprite.texture = new Texture(
        ours.texture[0],
        ...(ours.texture.slice(1) as any)
      );
  });

  createEffect(() => {
    const handlers: [keyof DisplayObjectEvents, any][] = Object.keys(
      events
    ).map((p) => {
      const handler = events[p as unknown as keyof Events];
      const n = p.split(":")[1] as keyof DisplayObjectEvents;
      sprite.on(n, handler as any);
      return [n, handler];
    });

    onCleanup(() => {
      handlers.forEach(([e, handler]) => sprite.off(e, handler));
    });
  });

  createEffect(() => {
    for (let key in pixis) {
      (sprite as any)[key] = (pixis as any)[key];
    }
  });

  const [, update] = useDiffChildren(sprite);
  const resolved = pixiChildren(ours.children);
  createEffect(() => {
    update(resolved());
  });

  createEffect(() => {
    if (props.use) {
      if (Array.isArray(props.use)) {
        props.use.forEach((fn) => fn(sprite));
      } else {
        props.use(sprite);
      }
    }
  });

  // Add the view to the DOM
  return sprite as unknown as JSX.Element;
}
