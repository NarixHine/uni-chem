export const INDUCTIVE_EFFECT_TEXT = `
  在有机化学中，由于不同原子的电负性存在差异，共用电子对会发生偏振。这种沿着 $σ$ 键传递的电子云偏振效应，被称为**诱导效应**。

  当碳链连接电负性较强的基团时，共用电子对会被拉向该基团，这一作用称为**吸电子诱导效应**（用 $-I$ 表示）。以 $\text{CH}_3\text{CH}_2\text{Cl}$ 为例：

  :::
  {
    "m": [{
      "a": [
        {"x": 50, "y": 100, "i": "a0", "l": "C"},
        {"x": 102, "y": 70, "i": "a1", "l": "C", "clr": "var(--chem-blue)"},
        {"x": 154, "y": 100, "i": "a2", "l": "Cl", "p": 3, "clr": "var(--chem-crimson)"}
      ],
      "b": [
        {"b": 0, "e": 1, "i": "b0", "clr": "var(--chem-indigo)"},
        {"b": 1, "e": 2, "i": "b1", "clr": "var(--chem-crimson)"}
      ]
    }]
  }
  :::

  在 $\text{CH}_3\text{CH}_2\text{Cl}$ 中，<ce style="color: var(--chem-crimson);">$\text{Cl}$ 原子</ce>的电负性显著大于碳。因此，<ce style="color: var(--chem-crimson);">$\text{C}-\text{Cl}$ 键</ce>的电子云明显偏向 <ce style="color: var(--chem-crimson);">$\text{Cl}$</ce>（带有部分负电荷 $δ^-$），导致<ce style="color: var(--chem-blue);">相邻碳原子</ce>电子云密度降低（带有部分正电荷 $δ^+$）。受此影响，该碳原子通过 <ce style="color: var(--chem-indigo);">$\text{C}-\text{C}$ 键</ce>较弱地牵引更远端碳原子的电子，使整个碳链的电子云发生同向偏移。

  常见吸电子基团按 $-I$ 效应由强到弱的顺序为：$-\text{NO}_2 > -\text{CN} > \text{C}=\text{O} > -\text{F} > -\text{Cl} > -\text{Br} > -\text{I}$ > $-\text{NH}_2$。

  与吸电子诱导效应相对应地，**给电子诱导效应**（用 $+I$ 表示）中，由于碳链连接电负性较弱的基团，共用电子对会被推向碳链。以乙基锂 $\text{CH}_3\text{CH}_2\text{Li}$ 为例：

  :::
  {
    "m": [{
      "a": [
        {"x": 50, "y": 100, "i": "a0", "l": "C"},
        {"x": 102, "y": 70, "i": "a1", "l": "C", "clr": "var(--chem-blue)"},
        {"x": 154, "y": 100, "i": "a2", "l": "Li", "clr": "var(--chem-amber)"}
      ],
      "b": [
        {"b": 0, "e": 1, "i": "b0", "clr": "var(--chem-indigo)"},
        {"b": 1, "e": 2, "i": "b1", "clr": "var(--chem-amber)"}
      ]
    }]
  }
  :::

  在 $\text{CH}_3\text{CH}_2\text{Li}$ 中，由于 <ce style="color: var(--chem-amber);">$\text{Li}$ 原子</ce>的电负性远小于碳，整个 <ce style="color: var(--chem-amber);">$\text{C}-\text{Li}$ 键</ce>的电子云被推向<ce style="color: var(--chem-blue);">相邻碳原子</ce>，使其带有部分负电荷（$δ^-$）。

  常见给电子基团按 $+I$ 效应由强到弱的顺序为：$-(\text{CH}_3)_3\text{C} > -(\text{CH}_3)_2\text{CH} > -\text{CH}_2\text{CH}_3 > -\text{CH}_3$。

  诱导效应有两个核心特征。第一，它仅仅通过 $σ$ 键传递，电子只发生极化，不发生转移。第二，随着碳链的延伸，这种偏振作用迅速减弱。

  通过诱导效应对电子云的影响，我们可以**判断反应进行难易和有机物稳定性**。

  亲电反应底物的电子云密度越大，反应越容易发生。例如，亲电芳香取代反应（$\text{S}_\text{E}\text{Ar}$）中，不同取代基对苯环活性有显著影响，详见[「苯环取代基活化、钝化效应」](/learn/activating-group)。

  酸性键（$\text{C}-\text{H}$ 键、$\text{O}-\text{H}$ 键等共价键）的极性越强，即电子云越远离 $\text{H}$，越容易电离出质子，详见[「酸碱性强弱比较」](/learn/acidity-basicity)。

  羰基是强吸电子基团，许多反应依靠碱夺取羰基的 $α-\text{H}$ 进行，详见[「羟醛缩合」](/learn/aldol-condensation) [「$\text{Claisen}$ 缩合」](/learn/claisen-condensation)。
  `
