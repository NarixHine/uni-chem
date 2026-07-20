interface Problem {
    content: string
    type: 'one' | 'some'
    tag?: string[]
}

export const PROBLEMS: Problem[] = [
    {
        type: 'some',
        content: `||| some AB
    Q
    以下不属于 Lewis 碱的有：

    Sol
    * **A项（$\text{H}_2$）符合题意**：氢分子中仅含一个共价 $\\sigma$ 键，没有可以捐献的孤对电子或易极化的 $\\pi$ 电子对，常规条件下不属于 Lewis 碱。
    * **B项（$\text{Ca}^{2+}$）符合题意**：金属阳离子 $\text{Ca}^{2+}$ 拥有空轨道，能够接受电子对，属于典型的 Lewis 酸。
    * **C项（$\text{NH}_3$）不符合题意**：氨气分子中的氮原子含有一对孤对电子，可以作为电子对给予体，是经典的 Lewis 碱。
    * **D项（$\text{CN}^-$）不符合题意**：氰根离子中的碳原子和氮原子均含有孤对电子，带负电荷，容易捐献电子对，是优良的 Lewis 碱。

    因此，不属于 Lewis 碱的是 **A** 和 **B**。

    A
    $\\text{H}_2$
    B
    $\\text{Ca}^{2+}$
    C
    $\\text{NH}_3$
    D
    $\\text{CN}^-$
    |||`,
    },
]
