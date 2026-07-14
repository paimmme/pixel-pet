# PixelPet - 程序化像素桌宠开发文档

> 一个本地运行的桌面像素宠物应用。用户选择动物和动作后，系统通过部件图层、姿态模板、调色板和必要覆盖帧，在运行时合成像素动画，并以透明置顶窗口显示在桌面上。

> 状态说明：本文档保留为历史 MVP 规格参考，部分内容已落后于当前代码。当前代码已包含多动物、多动作、16/32 分辨率、表情、饰品、Skill 系统、手势、活动感知、编舞、自动漫步和设置面板。新的产品方向见 `docs/product.md`，新的技术开发方案见 `docs/technical-development.md`。

本文档覆盖早期 MVP、核心架构、资产规范、实现细节、风险验证、测试发布和后续升级路线。

---

## 1. 产品目标

### 1.1 核心目标

PixelPet 的核心不是预先绘制“每个动物的每个动作整套动画”，而是建立一套可组合的像素动画生成管线：

```text
动物部件 + 动作姿态模板 + 调色板 + 可选覆盖帧 -> 合成动画 -> 桌面宠物
```

最终希望做到：

- 用户可以选择动物、动作、尺寸和外观主题。
- 动物和动作可以尽量复用，而不是为每个组合重复画整套 spritesheet。
- 应用完全本地运行，不依赖网络服务。
- 桌面窗口透明、置顶、可拖拽，并尽量不挡住用户正常操作。

### 1.2 范围控制原则

程序化组合的难点主要在资产和动作表达，不在 Canvas 本身。因此 MVP 必须先证明最小闭环，而不是一开始做大量动物和复杂动作。

MVP 只承诺：

- 1 个动物：`raccoon`
- 1 个分辨率：`32x32`
- 3 个动作：`idle`、`jump`、`wave`
- 透明置顶窗口
- 托盘菜单
- 拖拽移动
- 点击反应
- 运行时图层合成
- 覆盖帧机制可用

MVP 不承诺：

- 16x16 双精度
- 4 方向走路
- 多动物
- 饰品系统
- 多宠物同时显示
- 自动启动
- 社区资产包

这些功能放入后续升级路线。

### 1.3 目标用户

- 想要轻量桌面宠物的普通用户
- 对像素艺术和程序化生成感兴趣的开发者
- 用该项目展示 2D 渲染、工具链和桌面端能力的求职者

---

## 2. 技术选型

| 层级 | 选择 | 理由 |
|---|---|---|
| 桌面框架 | Electron | 透明窗口、系统托盘、跨平台打包和 IPC 成熟 |
| 渲染 | Canvas 2D | 32x32 像素动画足够轻量，便于像素级处理 |
| 语言 | TypeScript | 资产格式、IPC、状态机更适合强类型约束 |
| 构建 | electron-vite | 同时处理 main、preload、renderer 三个入口 |
| 打包 | electron-builder | 支持 macOS、Windows、Linux 常见发布格式 |
| 状态管理 | 自定义 Store | MVP 状态简单，不引入额外库 |

推荐依赖：

```json
{
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^22.0.0",
    "electron": "^43.0.0",
    "electron-builder": "^26.0.0",
    "electron-vite": "^4.0.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0"
  }
}
```

说明：

- 渲染运行时不引入 PIXI.js 或 WebGL，除非后续出现大量粒子、复杂变换或多宠物性能压力。
- Canvas 2D 禁用平滑插值，保证像素风格。
- `OffscreenCanvas` 可用于合成缓存；MVP 先在渲染进程中实现，后续再迁移到 Worker。

---

## 3. 里程碑

### 3.1 MVP 验收标准

MVP 完成时，必须满足：

1. 启动应用后，桌面出现一个透明背景的像素宠物窗口。
2. 宠物默认播放 `raccoon + idle` 动画。
3. 托盘菜单可以切换 `idle`、`jump`、`wave`。
4. 点击宠物非透明区域时触发一次反应动作。
5. 拖拽宠物可以移动窗口，并在退出后记住位置。
6. 透明区域不应长期阻挡下面窗口的鼠标操作。
7. 至少一个动作或部件实际使用覆盖帧，以验证 override 管线。
8. 打包后的应用可以正确加载 PNG 和 JSON 资产。

### 3.2 后续版本目标

| 版本 | 目标 |
|---|---|
| v0.1 MVP | 单动物、单分辨率、3 个动作、桌面基础交互 |
| v0.2 | 增加 16x16、猫、狐狸、更多调色板 |
| v0.3 | 增加 4 方向 walk 和自动漫步 |
| v0.4 | 饰品系统、选择面板、动作预览 |
| v0.5 | 多宠物、宠物间互动、行为调度 |
| v1.0 | 跨平台发布、设置页、资产包导入、稳定测试 |

---

## 4. 系统架构

### 4.1 进程模型

```text
Electron 主进程
  - 创建透明置顶窗口
  - 管理系统托盘
  - 保存窗口位置和用户设置
  - 处理窗口移动、点击穿透、退出
  - 通过 IPC 和渲染进程通信

Preload
  - 暴露安全的 electronAPI
  - 禁止渲染进程直接访问 Node.js

Renderer 渲染进程
  - 加载资产
  - 合成帧序列
  - 播放动画
  - 命中检测
  - UI 和托盘事件响应
```

### 4.2 模块结构

```text
src/
  main/
    index.ts
    window-manager.ts
    tray.ts
    settings.ts
    ipc-handlers.ts

  preload/
    index.ts

  renderer/
    index.html
    main.ts
    styles.css

    engine/
      animation-controller.ts
      compose-animation.ts
      frame-extractor.ts
      palette-swapper.ts
      sprite-compositor.ts
      types.ts

    assets/
      asset-loader.ts
      asset-cache.ts
      catalog.ts
      path-resolver.ts

    interaction/
      drag-handler.ts
      hit-test.ts
      mouse-pass-through.ts

    state/
      pet-state-machine.ts
      selection-store.ts

    ui/
      pet-canvas.ts
      selection-panel.ts

  shared/
    ipc-types.ts
    app-types.ts

resources/
  assets/
    animals/
    actions/
    palettes/
    icons/
```

### 4.3 资源路径约定

所有运行时资产统一放在：

```text
resources/assets/
```

不要同时使用 `src/assets` 和根目录 `assets` 表达运行时资产。这样可以减少开发环境和打包环境路径不一致的问题。

开发环境：

```text
renderer fetch('/assets/animals/raccoon/parts/body_32.png')
```

生产环境：

```text
electron-builder 将 resources/assets 打入 extraResources
主进程通过协议或静态服务暴露给 renderer
renderer 仍然使用统一逻辑加载资产
```

MVP 可以先使用 renderer public 目录映射资源；进入发布阶段前必须验证打包后的路径。

---

## 5. 核心数据结构

### 5.1 基础类型

```ts
export type PixelResolution = 16 | 32;

export type Direction = 'down' | 'left' | 'right' | 'up';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### 5.2 动物定义

```ts
export interface AnimalDef {
  id: string;
  name: string;
  resolutions: PixelResolution[];
  layers: LayerDef[];
  defaultPalette: string;
  hitArea: Rect;
}

export interface LayerDef {
  id: string;
  name: string;
  zIndex: number;
  anchor: Point;
  optional?: boolean;
}
```

### 5.3 动作定义

```ts
export interface ActionDef {
  id: string;
  name: string;
  frameCount: number;
  fps: number;
  loop: boolean;
  directions: Direction[] | null;
  poseTemplate: string;
}
```

说明：

- `directions: null` 表示无方向动作，如 `idle`、`jump`、`wave`。
- `directions: ['down', 'left', 'right', 'up']` 表示 4 方向动作，如后续的 `walk`。

### 5.4 姿态模板

```ts
export interface PoseTemplate {
  action: string;
  resolution: PixelResolution;
  frames?: PoseFrame[];
  directions?: Partial<Record<Direction, PoseFrame[]>>;
}

export interface PoseFrame {
  index: number;
  parts: Record<string, PartTransform>;
}

export interface PartTransform {
  dx?: number;
  dy?: number;
  rotation?: number;
  visible?: boolean;
  zIndex?: number;
  override?: OverrideRef;
}

export interface OverrideRef {
  layer: string;
  frame: number;
}
```

无方向动作示例：

```json
{
  "action": "wave",
  "resolution": 32,
  "frames": [
    {
      "index": 0,
      "parts": {
        "body": { "dy": 0 },
        "tail": { "dx": -1, "rotation": -6 },
        "front_arm": { "override": { "layer": "front_arm", "frame": 0 } }
      }
    }
  ]
}
```

方向动作示例：

```json
{
  "action": "walk",
  "resolution": 32,
  "directions": {
    "right": [
      {
        "index": 0,
        "parts": {
          "body": { "dx": 0 },
          "tail": { "dx": -1 }
        }
      }
    ],
    "left": []
  }
}
```

### 5.5 调色板

```ts
export type RGB = [number, number, number];
export type PaletteMap = Map<string, RGB>;

export interface PaletteDef {
  id: string;
  name: string;
  mappings: Array<{
    from: RGB;
    to: RGB;
  }>;
}
```

调色板只替换非透明像素的 RGB，保持 alpha 不变。

---

## 6. 资产规范

### 6.1 目录结构

```text
resources/assets/
  animals/
    raccoon/
      parts/
        shadow_32.png
        body_32.png
        tail_32.png
        ears_32.png
        eyes_32.png
        mouth_32.png
        front_arm_32.png
      overrides/
        wave/
          front_arm_32.png
        jump/
          body_32.png

  actions/
    idle/
      poses_32.json
    jump/
      poses_32.json
    wave/
      poses_32.json

  palettes/
    raccoon.json

  icons/
    tray-icon.png
    icon.png
```

### 6.2 图层规则

建议 MVP 图层：

| zIndex | layer | 说明 |
|---:|---|---|
| 0 | shadow | 阴影，可选 |
| 1 | tail | 尾巴 |
| 2 | body | 身体 |
| 3 | ears | 耳朵 |
| 4 | front_arm | 前肢，用于挥手 |
| 5 | eyes | 眼睛 |
| 6 | mouth | 嘴巴/鼻子 |

注意：

- 每个部件 PNG 的画布尺寸必须等于分辨率，例如 32x32。
- 部件可以只在局部绘制，但透明画布仍然要完整。
- 所有可换色部件应使用固定灰度基色，避免抗锯齿产生未登记颜色。
- 覆盖帧使用横向 spritesheet，宽度为 `frameCount * resolution`，高度为 `resolution`。

### 6.3 覆盖帧规则

覆盖帧用于解决姿态模板表达不了的形变，例如挥手前肢、跳跃压缩身体、尾巴弧线。

路径规则：

```text
resources/assets/animals/{animal}/overrides/{action}/{layer}_{resolution}.png
```

示例：

```text
resources/assets/animals/raccoon/overrides/wave/front_arm_32.png
```

合成时规则：

1. 当前帧的某个 layer 有 `override`，使用 override spritesheet 中对应帧。
2. 没有 `override`，使用基础部件。
3. override 仍参与 `dx`、`dy`、`rotation`、`zIndex`。
4. override 找不到时，开发环境抛错；生产环境回退基础部件并记录日志。

### 6.4 MVP 资产清单

MVP 至少需要：

```text
raccoon parts:
  shadow_32.png
  tail_32.png
  body_32.png
  ears_32.png
  front_arm_32.png
  eyes_32.png
  mouth_32.png

actions:
  idle/poses_32.json   4 frames
  jump/poses_32.json   6 frames
  wave/poses_32.json   4 frames

overrides:
  wave/front_arm_32.png
  jump/body_32.png

palette:
  raccoon.json
```

---

## 7. 合成引擎

### 7.1 合成流程

```text
选择 animal/action/resolution
  -> 读取 catalog
  -> 加载动物部件
  -> 加载动作姿态模板
  -> 加载调色板
  -> 按需加载覆盖帧
  -> 逐帧合成 ImageBitmap
  -> 缓存结果
  -> AnimationController 播放
```

### 7.2 合成缓存 key

```ts
export interface ComposeConfig {
  animal: string;
  action: string;
  resolution: PixelResolution;
  palette?: string;
  direction?: Direction;
}

export function createComposeCacheKey(config: ComposeConfig): string {
  return [
    config.animal,
    config.action,
    config.resolution,
    config.palette ?? 'default',
    config.direction ?? 'none'
  ].join(':');
}
```

缓存粒度是“一整套动画帧”，不是单个 PNG。切换动作时，如果缓存命中，直接播放。

### 7.3 合成伪代码

```ts
export async function composeAnimation(
  loader: AssetLoader,
  compositor: SpriteCompositor,
  config: ComposeConfig
): Promise<ImageBitmap[]> {
  const animal = getAnimal(config.animal);
  const action = getAction(config.action);
  const poseTemplate = await loader.loadPoseTemplate(action.id, config.resolution);
  const poseFrames = selectPoseFrames(poseTemplate, config.direction);

  assertPoseFrames(action, poseFrames);

  const parts = await loader.loadAnimalParts(
    animal.id,
    config.resolution,
    animal.layers
  );

  const overrideCache = await loader.loadOverridesForPose(
    animal.id,
    action.id,
    config.resolution,
    poseFrames
  );

  const palette = await loader.loadPalette(config.palette ?? animal.defaultPalette);
  const paletteMap = PaletteSwapper.compile(palette);

  const frames: ImageBitmap[] = [];

  for (let frameIndex = 0; frameIndex < poseFrames.length; frameIndex++) {
    const pose = poseFrames[frameIndex];

    const layers = animal.layers.map((layerDef) => {
      const transform = pose.parts[layerDef.id] ?? {};
      const overrideBitmap = resolveOverrideBitmap(
        overrideCache,
        transform.override,
        frameIndex
      );

      return {
        id: layerDef.id,
        bitmap: overrideBitmap ?? parts.get(layerDef.id),
        anchor: layerDef.anchor,
        zIndex: transform.zIndex ?? layerDef.zIndex,
        dx: transform.dx ?? 0,
        dy: transform.dy ?? 0,
        rotation: transform.rotation ?? 0,
        visible: transform.visible ?? true
      };
    }).filter(layer => layer.visible);

    frames.push(await compositor.compose(layers, paletteMap));
  }

  return frames;
}
```

### 7.4 SpriteCompositor 要点

```ts
export class SpriteCompositor {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;

  constructor(private resolution: PixelResolution) {
    this.canvas = new OffscreenCanvas(resolution, resolution);
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  async compose(layers: ComposedLayer[], palette?: PaletteMap): Promise<ImageBitmap> {
    this.ctx.clearRect(0, 0, this.resolution, this.resolution);

    for (const layer of [...layers].sort((a, b) => a.zIndex - b.zIndex)) {
      this.ctx.save();
      this.ctx.translate(layer.anchor.x, layer.anchor.y);
      this.ctx.rotate((layer.rotation * Math.PI) / 180);
      this.ctx.translate(-layer.anchor.x, -layer.anchor.y);
      this.ctx.drawImage(layer.bitmap, layer.dx, layer.dy);
      this.ctx.restore();
    }

    if (palette) {
      applyPalette(this.ctx, this.resolution, palette);
    }

    return this.canvas.transferToImageBitmap();
  }
}
```

### 7.5 调色板注意事项

- PNG 必须避免半透明抗锯齿，否则调色板匹配会漏色。
- 可以在资产校验脚本中扫描所有非透明颜色，确保都在 palette 源色集合内。
- 32x32 合成每帧最多 1024 像素，MVP 不需要过度优化。

---

## 8. 动画系统

### 8.1 AnimationController

职责：

- 按 fps 播放帧序列。
- 支持 `start`、`stop`、`setFrames`、`destroy`。
- 使用 `requestAnimationFrame`，按时间差决定是否进入下一帧。
- 非循环动作结束时触发 `onComplete`。

关键约束：

- 切换动作前不销毁基础资产缓存，只替换播放帧。
- 替换帧序列时重置 frame index。
- `drawFrame` 前应清空显示 Canvas，避免透明区域残留上一帧。

### 8.2 PetStateMachine

MVP 状态：

```ts
export enum PetState {
  Idle = 'idle',
  Acting = 'acting',
  Reacting = 'reacting',
  Dragging = 'dragging'
}
```

状态规则：

| 当前状态 | 事件 | 新状态 | 说明 |
|---|---|---|---|
| Idle | selectAction | Acting | 播放用户选择动作 |
| Acting | selectAction | Acting | 直接切换动作 |
| Idle/Acting | clickPet | Reacting | 播放一次 jump 或表情 |
| Reacting | animationComplete | previous | 回到之前状态 |
| Any | dragStart | Dragging | 暂停点击反应 |
| Dragging | dragEnd | previous | 回到拖拽前状态 |

睡眠、随机动作、自动漫步放到 v0.5。

---

## 9. 桌面交互

### 9.1 窗口配置

```ts
const win = new BrowserWindow({
  width: 128,
  height: 128,
  transparent: true,
  frame: false,
  alwaysOnTop: true,
  skipTaskbar: true,
  resizable: false,
  hasShadow: false,
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    nodeIntegration: false
  }
});
```

窗口尺寸建议 MVP 使用 128x128，而不是刚好 96x96。原因：

- 给点击命中和拖拽留出缓冲。
- 后续动作可能超出 32x32 原始画布边界。
- UI 调试时更容易观察。

实际宠物显示尺寸仍可为 96x96。

### 9.2 点击穿透策略

点击穿透是桌宠项目的关键风险，必须第一阶段验证。

推荐策略：

1. 默认窗口开启穿透，避免透明区域挡住桌面。
2. 渲染进程监听鼠标移动，基于当前 Canvas alpha 做命中检测。
3. 命中宠物非透明区域时，通过 IPC 关闭穿透。
4. 鼠标离开宠物区域或进入透明区域时，重新开启穿透。
5. 拖拽过程中强制关闭穿透，直到 mouseup。

IPC：

```ts
export interface ElectronAPI {
  setIgnoreMouseEvents(ignore: boolean, options?: { forward?: boolean }): void;
  getWindowBounds(): Promise<Rectangle>;
  moveWindow(x: number, y: number): void;
  saveState(state: SavedState): void;
}
```

注意：

- 不要在每一个 mousemove 都发送 IPC；只有命中状态变化时才发送。
- 拖拽期间不要做透明命中切换。
- Windows、macOS、Linux 的表现可能不同，MVP 至少先验证当前目标平台。

### 9.3 拖拽

拖拽只在命中宠物非透明区域时开始。

流程：

```text
mousedown on pet
  -> state = Dragging
  -> setIgnoreMouseEvents(false)
  -> 记录鼠标屏幕坐标和窗口坐标

mousemove
  -> IPC moveWindow

mouseup
  -> 保存窗口位置
  -> state 回到 previous
  -> 重新根据命中状态决定是否穿透
```

### 9.4 托盘菜单

MVP 托盘菜单：

```text
PixelPet
  动作
    空闲
    跳跃
    挥手
  重新居中
  退出
```

后续再加入动物、分辨率、主题、自动启动等设置。

---

## 10. 设置持久化

保存路径：

```ts
path.join(app.getPath('userData'), 'pet-state.json')
```

MVP 保存：

```ts
export interface SavedState {
  window: {
    x: number;
    y: number;
  };
  selection: {
    animal: string;
    action: string;
    resolution: PixelResolution;
    palette: string;
  };
}
```

要求：

- 读取失败时使用默认值。
- JSON 结构不合法时使用默认值。
- 保存失败时记录日志，但不阻止退出。
- 后续版本升级时加入 `version` 字段做迁移。

---

## 11. 构建与发布

### 11.1 开发环境加载

开发模式：

```ts
if (is.dev && process.env.ELECTRON_RENDERER_URL) {
  win.loadURL(process.env.ELECTRON_RENDERER_URL);
} else {
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
}
```

不要在主进程中只写死 `dist/renderer/index.html`，否则开发模式和打包模式容易不一致。

### 11.2 electron-builder

示例：

```yaml
appId: com.pixelpet.app
productName: PixelPet
directories:
  output: release
files:
  - dist/**/*
  - package.json
extraResources:
  - from: resources/assets
    to: assets
mac:
  target: [dmg, zip]
  icon: resources/assets/icons/icon.icns
win:
  target: [nsis, portable]
  icon: resources/assets/icons/icon.ico
linux:
  target: [AppImage, deb]
  icon: resources/assets/icons/icon.png
```

### 11.3 package scripts

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "typecheck": "tsc --noEmit",
    "dist": "npm run build && electron-builder",
    "lint:assets": "node scripts/validate-assets.js"
  }
}
```

---

## 12. 测试与验证

### 12.1 必测场景

MVP 必测：

- 应用启动无白屏。
- PNG 和 JSON 在开发环境可加载。
- PNG 和 JSON 在打包后可加载。
- idle 循环播放稳定。
- jump 非循环播放后能回到之前状态。
- wave 使用 override 帧。
- 点击透明区域不触发宠物交互。
- 点击非透明区域触发反应。
- 拖拽过程中窗口跟随鼠标。
- 退出后重启恢复位置。
- 托盘退出能正常关闭进程。

### 12.2 资产校验

建议提供脚本检查：

- 所有 catalog 中声明的 layer 都有 PNG。
- 所有 action 都有 `poses_32.json`。
- pose 中引用的 layer 必须存在。
- override 引用必须能找到对应 spritesheet。
- override frame index 不能越界。
- PNG 尺寸符合规则。
- 调色板源色覆盖所有非透明像素颜色。

### 12.3 性能目标

MVP 性能目标：

- 单次合成 6 帧动画小于 50ms。
- 播放时不重复合成同一动画。
- 常驻内存不需要严格优化，但切换动作不应无限增长。
- 销毁不再使用的 `ImageBitmap` 时调用 `close()`。

---

## 13. 开发计划

### Phase 0: 风险验证，1-2 天

目标：先证明桌面窗口可行。

任务：

- 创建 Electron 基础项目。
- 创建透明置顶窗口。
- 显示一个 32x32 测试 Canvas。
- 实现 alpha 命中检测。
- 实现点击穿透切换。
- 实现拖拽移动。
- 实现托盘退出。

验收：透明区域不挡鼠标，宠物区域可点击可拖拽。

### Phase 1: MVP 合成管线，3-5 天

任务：

- 定义 `AnimalDef`、`ActionDef`、`PoseTemplate`。
- 实现 AssetLoader。
- 实现 FrameExtractor。
- 实现 SpriteCompositor。
- 实现 PaletteSwapper。
- 实现 override 加载和合成。
- 制作 raccoon 基础部件和 raccoon palette。

验收：可以合成并显示 `raccoon + idle`。

### Phase 2: 动画和状态，3-4 天

任务：

- 实现 AnimationController。
- 实现 PetCanvas。
- 实现 PetStateMachine。
- 接入 `idle`、`jump`、`wave`。
- 点击宠物触发反应动作。

验收：三个动作都能播放，非循环动作结束后状态正确。

### Phase 3: 设置、托盘、打包，2-4 天

任务：

- 托盘动作菜单。
- 保存窗口位置和当前选择。
- 重新居中。
- 打包配置。
- 验证生产环境资源路径。

验收：打包后的应用可用。

### Phase 4: v0.2 内容扩展

任务：

- 增加 16x16 分辨率。
- 增加 cat 和 fox。
- 增加多套调色板。
- 增加选择面板。
- 增加资产校验脚本。

### Phase 5: v0.3 行为扩展

任务：

- 增加 4 方向 walk。
- 增加方向数据结构。
- 增加自动漫步。
- 增加屏幕边缘碰撞和转向。
- 增加空闲随机动作。

### Phase 6: v1.0 产品化

任务：

- 设置页。
- 自动启动开关。
- 多宠物。
- 饰品系统。
- 资产包导入。
- 崩溃日志和诊断信息。
- 跨平台发布测试。

---

## 14. 主要风险与应对

| 风险 | 等级 | 应对 |
|---|---:|---|
| 点击穿透和拖拽在不同平台表现不一致 | 高 | Phase 0 优先验证，必要时按平台分支处理 |
| 程序化动作看起来僵硬 | 高 | MVP 只做简单动作，复杂动作使用 override 帧 |
| 资源路径开发可用但打包后失效 | 高 | 早期加入打包验证，统一 assets 路径 |
| 调色板漏色导致部分像素不换色 | 中 | 资产校验脚本扫描颜色 |
| 状态机扩展后混乱 | 中 | MVP 状态少，后续引入事件驱动状态转换 |
| Electron 体积偏大 | 中 | MVP 接受，后续如有必要再评估 Tauri |
| 多宠物性能增长 | 低 | v1.0 前用缓存和 Worker 优化 |

---

## 15. 参考项目

| 项目 | 链接 | 借鉴点 |
|---|---|---|
| Clawd-on-Desk | https://github.com/rullerzhou-afk/clawd-on-desk | Electron 透明窗口、托盘、点击穿透 |
| Universal LPC Spritesheet Character Generator | https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator | 图层合成、调色板、资产目录 |
| BongoCat | https://github.com/ayangweb/BongoCat | 桌宠交互和轻量 UX |
| VPet | https://github.com/LorisYounger/VPet | 宠物状态和行为系统 |
| vscode-pets | https://github.com/tonybaloney/vscode-pets | 小型宠物状态机和动作组织 |

---

## 16. 当前推荐开工顺序

不要先画很多素材。推荐顺序：

1. 透明窗口 + 点击穿透 + 拖拽。
2. 单张 PNG 显示。
3. 多图层合成单帧。
4. 多帧动画播放。
5. override 帧接入。
6. 托盘动作切换。
7. 保存位置。
8. 打包验证。
9. 再扩展动物、动作和分辨率。

这个顺序可以最快暴露项目真正的技术风险，也能最快形成可展示的 MVP。
