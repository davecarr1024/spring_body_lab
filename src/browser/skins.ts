/** A renderer-owned skin can be swapped without changing the physics body recipe. */
export type SoftBodySkin = Readonly<{ id: string; texturePath: string; scale: number; stroke: string; particleFill: string }>;

export const softBodySkins = Object.freeze({
  moss: Object.freeze({ id: "moss", texturePath: "./assets/stylized-rock.png", scale: 72, stroke: "#d7f38d", particleFill: "#b8de70" }),
  bramble: Object.freeze({ id: "bramble", texturePath: "./assets/stone-wall.jpg", scale: 58, stroke: "#d1a576", particleFill: "#9d6d4c" }),
  lab: Object.freeze({ id: "lab", texturePath: "./assets/stylized-rock.png", scale: 64, stroke: "#8fc2ff", particleFill: "#86b1ff" }),
});

/** Stable ID prefixes let a scene compose independently skinned generated bodies. */
export function skinForBody(bodyId: string): SoftBodySkin {
  if (bodyId === "courier") return softBodySkins.moss;
  if (bodyId === "bramble" || bodyId === "run-wall") return softBodySkins.bramble;
  return softBodySkins.lab;
}
