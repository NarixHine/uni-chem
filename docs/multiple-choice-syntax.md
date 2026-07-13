# 选择题 Markdown 语法

## 语法格式

```
||| one|some <答案选项>
Q
<题目内容，支持完整 Markdown>
Sol                          ← 可选
<解析内容，支持完整 Markdown>
A
<选项 A 内容，支持完整 Markdown>
B
...
|||
```

## 规则

| 元素             | 说明                                                            |
| -------------- | ------------------------------------------------------------- |
| \|\|\|         | 起始/结束分隔符，各占独立行                                                |
| `one` / `some` | `one` = 单选题（仅一个正确选项）；`some` = 不定项题（一个或多个正确选项）                 |
| 答案选项           | 紧跟模式后的字母组合，如 `A`、`BC`、`ACD`（大小写不敏感，自动转大写）                     |
| `Q`            | 题目标记，**必须**在独立行                                               |
| `Sol`          | 解析标记，**可选**，位于 `Q` 与 `A` 之间，在独立行；提交后显示；多使用化学图示，尽可能简洁地用文字，惜字如金 |
| `A`–`E`        | 选项标记，**必须**在独立行，按 A→B→C→D→E 顺序出现                              |
| 选项数量           | 2–5 个（A 到 E）                                                  |

## 标记顺序

```
Q → Sol → A → B → C → D → E
```

- Sol 是**可跳过的**：省略时 `Q` 的内容直接接 `A`
- 标记行必须**独占一行**（trim 后恰好等于标记文本）
- 标记按顺序匹配，题目正文中的 "A" 不会被误识别为选项

## 示例

**单选题（无解析）：**
```
||| one B
Q
下列分子中，极性最强的是？

A
$\text{CO}_2$（线性对称）
B
$\text{H}_2\text{O}$（V 形）
C
$\text{CH}_4$（正四面体）
|||
```

**不定项题（带解析）：**
```
||| some ACD
Q
下列哪些物质可以作为**路易斯酸**？

Sol
路易斯酸是电子对受体。$\text{BF}_3$ 的硼原子有空轨道，$\text{AlCl}_3$ 同理，$\text{Fe}^{3+}$ 也可接受电子对。

A
$\text{BF}_3$
B
$\text{NH}_3$
C
$\text{AlCl}_3$
D
$\text{Fe}^{3+}$
E
$\text{NaCl}$
|||
```

## 注意事项

1. 在解释时尽可能多地使用ChemDoodle图示来直观呈现机理
2. 尽量用化学式，少用中文
3. 禁止对中文使用斜体
4. 禁止使用分割线
5. 禁止显摆英文术语
6. 善用行内KaTeX语法表示化学式（如`$\text{H}_2\text{SO}_4$`，总是使用`\text`而非`\mathrm`）和符号；化学键应单独用`{-}` `{=}`表示，如`$\text{C}{=}\text{O}$`，不应与元素符号合并

---

## 化学结构图示语法

### 1. Molecular Geometry & Chain Layout

* **Standard Zig-Zag Backbone:** Draw acyclic carbon chains in a continuous, rhythmic zig-zag pattern with uniform bond lengths. Vertices should alternate pointing up and down cleanly.
* **Bond Angles:** Maintain uniform standard angles ($120^\circ$ for $sp^2$ systems like carbonyls; $120^\circ$ approximations in 2D for $sp^3$ chains). Avoid flat, overly squashed, or vertically elongated bonds.
* **Heteroatoms and Substituents:** Substituents at a vertex pointing "up" should point vertically upwards or symmetrically outwards.
    * Carbonyl ($\text{C=O}$) groups should cleanly bisect the interior angle of the chain backbone or point directly away from the vertex to maximize space.

### 2. Explicit Hydrogens in Mechanisms

* When a hydrogen must be explicitly drawn for a mechanism (e.g., deprotonation):
    * Extend the $\text{C-H}$ bond outward from the vertex, preserving the molecule's overall tetrahedral shape.
    * Ensure the $\text{H}$ label does not overlap with adjacent functional groups or lone pairs.

### 3. Lewis/Formal Charges & Lone Pairs

* **Formal Charges:** Place formal charges (e.g., $+$, $-$) where existing.
* **Lone Pairs:** Add lone pairs to assist explanation of, for example, reaction mechanisms and chemical qualities. Omit lone pairs if they are irrelevant to the context.

### 4. Curved Arrow Formalism (Electron Pushing)

* **Strict Origin:** Every curved arrow representing electron movement *must* originate exactly from a source of electrons: either the center of a lone pair or the exact midpoint of a covalent bond.
* **Strict Destination:** * If a bond is forming between two atoms, the arrowhead must point directly to the target atom.
    * If a new $\pi$-bond is forming adjacent to an existing single bond, the arrowhead must point directly to the center of the existing bond line.
    * If electrons are moving onto an atom as a lone pair, the arrowhead must point directly to that atom's nucleus/symbol.

### 5. Reaction Annotation

- **Explicit Catalyst**: If a reaction is catalyzed by a substance, point it out above the arrow shape in the overall reaction.

## JSON Schema Reference

The format is (a flavored) **ChemDoodle JSON**, the native data format for *ChemDoodle Web Components*.

### Root Object (`Content`)

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `m` | Array of Molecule | no | All molecules on the canvas. Omit if empty. |
| `s` | Array of Shape | no | All shapes: arrows, pushers, brackets. Omit if empty. |

### Molecule (`m[i]`)

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `a` | Array of Atom | yes | Atoms in this molecule. |
| `b` | Array of Bond | no | Bonds in this molecule. Omit if empty. |
| `i` | String | no | Unique molecule ID (needed if referenced by shapes). |

### Atom (`a[i]`)

| Key   | Type    | Default      | Description                                                                    |      |                      |
| ----- | ------- | ------------ | ------------------------------------------------------------------------------ | ---- | -------------------- |
| `x`   | Number  | **required** | X coordinate.                                                                  |      |                      |
| `y`   | Number  | **required** | Y coordinate.                                                                  |      |                      |
| `z`   | Number  | `0`          | Z coordinate (3D only).                                                        |      |                      |
| `l`   | String  | `"C"`        | Element label: `"H"`, `"C"`, `"N"`, `"O"`, `"Cl"`, `"Br"`, etc.                |      |                      |
| `c`   | Integer | `0`          | Formal charge (e.g. `-1`, `+1`).                                               |      |                      |
| `p`   | Integer | `0`          | **Number of lone pairs.** `2` for a neutral O with two lone pairs; `3` for O⁻. |      |                      |
| `r`   | Integer | `0`          | Number of radical electrons (unpaired).                                        |      |                      |
| `m`   | Integer | `-1`         | Isotope mass. `-1` = natural abundance.                                        |      |                      |
| `h`   | Integer | `-1`         | Implicit hydrogen count override. `-1` = auto-detect.                          |      |                      |
| `i`   | String  | —            | **Unique ID.** Required if the atom is referenced by a Pusher or VAP shape.    |      |                      |
| `s2`  | Object  | —            | Enhanced stereochemistry designation (`{"t":"abs"                              | "or" | "&", "g":<group>}`). |
| `q`   | Object  | —            | Query object for substructure searching.                                       |      |                      |
| `clr` | String  | —            | **Virtual property.** Custom color for this atom, e.g. `var(--chem-color)`.    |      |                      |

### Bond (`b[i]`)

| Key   | Type    | Default      | Description                                                                                   |
| ----- | ------- | ------------ | --------------------------------------------------------------------------------------------- |
| `b`   | Integer | **required** | Index of the starting atom in the molecule's `a` array (0-based).                             |
| `e`   | Integer | **required** | Index of the ending atom in the molecule's `a` array (0-based).                               |
| `o`   | Number  | `1`          | Bond order: `1` = single, `2` = double, `3` = triple, `1.5` = aromatic.                       |
| `s`   | String  | `"none"`     | Stereochemistry: `"protruding"` (wedge up), `"recessed"` (dashed down), `"ambiguous"` (wavy). |
| `i`   | String  | —            | Unique ID. Required if the bond is referenced by a Pusher.                                    |
| `clr` | String  | —            | **Virtual property.** Custom color for this bond, e.g. `var(--chem-color)`.                   |

### Pusher — Electron-Pushing Arrow (`s[i]`)

For mechanism arrows showing electron movement. **Every arrow must originate from a lone pair or bond, and point to an atom or bond.**

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `t` | String | **required** | Must be `"Pusher"`. |
| `o1` | String | **required** | **Source:** ID of the atom (lone pair) or bond where electrons come from. |
| `o2` | String | **required** | **Destination:** ID of the atom or bond where electrons go to. |
| `e` | Number | `1` | Number of electrons: `1` (radical/single electron), `2` (electron pair). Use `-1` for a **bond-forming** pusher (electrons moving from an atom to form a new bond). |
| `i` | String | — | Unique shape ID. |

### Line — Reaction Arrow (`s[i]`)

| Key        | Type   | Default      | Description                                                                                                                   |
| ---------- | ------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `t`        | String | **required** | Must be `"Line"`.                                                                                                             |
| `x1`, `y1` | Number | **required** | Start point coordinates.                                                                                                      |
| `x2`, `y2` | Number | **required** | End point coordinates.                                                                                                        |
| `a`        | String | —            | Arrow type. Omit for a plain line. Values: `"synthetic"` (→), `"retrosynthetic"` (⇒), `"resonance"` (↔), `"equilibrium"` (⇌). |
| `rs`       | Array  | —            | Atom IDs (one per reactant molecule) to auto-bind reaction components.                                                        |
| `ps`       | Array  | —            | Atom IDs (one per product molecule) to auto-bind reaction components.                                                         |
| `i`        | String | —            | Unique shape ID.                                                                                                              |

### Example: Nucleophilic Attack (Annotated)

```json
{
  "m": [{
    "a": [
      {"x": 50,  "y": 100, "i": "a0", "l": "O", "c": -1, "p": 3, "clr": "#E63946"},
      {"x": 120, "y": 70,  "i": "a1", "l": "C"},
      {"x": 120, "y": 130, "i": "a2", "l": "O", "p": 2},
      {"x": 180, "y": 100, "i": "a3", "l": "Cl"}
    ],
    "b": [
      {"b": 0, "e": 1, "i": "b0"},
      {"b": 1, "e": 2, "o": 2, "i": "b1", "clr": "#457B9D"},
      {"b": 1, "e": 3, "i": "b2"}
    ]
  }],
  "s": [
    {"t": "Pusher", "o1": "a0", "o2": "a1", "e": 2},
    {"t": "Pusher", "o1": "b1", "o2": "a2", "e": 2}
  ]
}
```

**What this represents:**

| Element | ID | Meaning |
|---------|-----|---------|
| Atom `a0` | O⁻, 3 lone pairs | Nucleophile attacking the carbonyl carbon |
| Atom `a1` | C | Carbonyl carbon (electrophilic center) |
| Atom `a2` | O, 2 lone pairs | Carbonyl oxygen accepting electrons from the π bond |
| Atom `a3` | Cl | Leaving group |
| Bond `b1` | C=O (order 2) | The carbonyl π bond |
| Pusher 1 | `a0→a1`, `e=2` | O⁻ lone pair attacks C, forming a new C–O bond |
| Pusher 2 | `b1→a2`, `e=2` | π electrons move onto O, becoming a lone pair |
