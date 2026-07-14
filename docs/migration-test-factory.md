# test-factory.ts 迁移计划

## 现状

- `src/renderer/assets/test-factory.ts` (~4300 行)
- 11 个动物的程序化绘制函数（OffscreenCanvas API）
- 每个动物：多部分层 + pose 模板 + override spritesheets + 表情变体
- 8 个动物有 eat/surprise/dance override
- 这是当前唯一的资产来源

## 迁移目标

- 从程序化工厂 → 文件式 pack (PNG + JSON manifests)
- 可维护：每个动物一个文件，而非 4300 行单体
- 可替换：file-backed packs 可随时替换 factory output

## 阶段计划

### Phase 1（当前）— Pack Contract + Loader 框架

已在 Phase 1 完成：
- [x] CharacterPack/ActionPack 类型定义
- [x] Pack loader 基础设施（pack-registry.ts）
- [x] IPC 桥接 + preload 扩展
- [x] AssetLoader 集成 pack source chain
- [x] 示例 pack 生成脚本（manifests + 目录结构）
- [ ] 设备上导出 factory PNG → pack（Phase 2 细化）

### Phase 2 — Factory Pack Source 包装

将 factory 包装为 PackSource 接口实现，不涉及文件 I/O：

```
FactoryPackSource implements PackSource {
  loadLayer(id, res) -> 调用 test-factory 的 drawing functions
  loadPose(id, res) -> 返回 pose template
}
```

变化：
- `AssetLoader` 的三个 source：`FileBackedPackSource → FactoryPackSource (new) → LegacyFactory (current)`
- FactoryPackSource 封装现有 ANIMAL_FACTORIES 调用
- 新增 `PackSource` 接口类型

### Phase 3 — test-factory.ts 拆分

按动物拆分：

```
src/renderer/assets/
  factories/
    index.ts              # ANIMAL_FACTORIES registry, shared helpers
    raccoon-factory.ts    # Raccoon draw functions (~350 lines)
    cat-factory.ts        # Cat draw functions
    fox-factory.ts         ...
    rabbit-factory.ts
    panda-factory.ts
    frog-factory.ts
    penguin-factory.ts
    mouse-factory.ts
    bear-factory.ts
    koala-factory.ts
    owl-factory.ts
    override-factory.ts   # Override spritesheets (eat/surprise/dance)
```

每步：
1. 从 test-factory.ts 中提取 shared helpers => factories/index.ts
2. 逐个提取动物函数到独立文件
3. 提取 override 到独立文件
4. 删除 test-factory.ts

### Phase 4 — Factory→File Export Tool

在 Electron 渲染器中添加开发工具：
- 遍历 ANIMAL_FACTORIES 全部输出
- 使用 OffscreenCanvas.convertToBlob() 导出为 PNG
- 通过 IPC 发送到 main process 写入 userData/packs/
- 自动生成 JSON pose/palette 文件

完成后，factory 代码可降级为"开发回退"并逐步废弃。

## 风险

- OffscreenCanvas 在 Node 中不可用 — 导出必须在 Electron 浏览器上下文中运行
- 每个动物的 pose 模板数据是运行时生成的 — 导出时需要序列化为 JSON
- PNG 文件尺寸：16x16 和 32x32 的已优化 PNG 非常小（单个通常 <500 字节）

## 验收标准

- test-factory.ts < 500 行（或者删除，完全由工厂模块替代）
- `FactoryPackSource` 通过 `PackSource` 接口无缝工作
- 生产运行时可通过 file-backed packs 完全替换 factory
- Factory 作为 dev-only fallback
