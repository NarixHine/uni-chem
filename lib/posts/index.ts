import { ALDOL_CONDENSATION_TEXT } from './texts/aldol-condensation'
import { CLAISEN_CONDENSATION_TEXT } from './texts/claisen-condensation'
import { ESTERIFICATION_TEXT } from './texts/esterification'
import { INDUCTIVE_EFFECT_TEXT } from './texts/inductive-effect'

export interface Post {
    slug: string
    title: string
    excerpt: string
    text?: string
}

const POSTS_LEVEL_EXAM: Post[] = [
    {
        slug: 'resonance',
        title: '共振理论',
        excerpt:
            '为什么苯环可以画成单双键交替的凯库勒式，也可以画成一个圈？重新建构对电子云和共价键的认知。',
    },
    {
        slug: 'directing-group',
        title: '苯环取代基定位效应',
        excerpt: '用共振理论解释高中阶段常见取代基的定位效应。',
    },
    {
        slug: 'inductive-effect',
        title: '诱导效应',
        excerpt: '除共振外，电负性差异是显著驱动电子偏移的另一重要因素。',
        text: INDUCTIVE_EFFECT_TEXT,
    },
    {
        slug: 'activating-group',
        title: '苯环取代基活化、钝化效应',
        excerpt: '苯环取代基的诱导效应影响苯环电子云密度，进而改变苯环发生反应的活性。',
    },
    {
        slug: 'lewis-theory',
        title: 'Arrhenius · Brønsted · Lewis 酸碱理论',
        excerpt:
            '如何定义酸碱？将酸碱的概念由电离氢离子、氢氧根离子的物质，扩展为电子对的供体与受体。',
    },
    {
        slug: 'esterification',
        title: '酯化反应',
        excerpt: '浓硫酸不仅是促进平衡正移的吸水剂，还通过增强羧基亲电性而催化亲核取代。',
        text: ESTERIFICATION_TEXT,
    },
    {
        slug: 'aldol-condensation',
        title: '羟醛缩合',
        excerpt: '由于羰基的吸电子效应，$α-\\text{H}$ 的酸性显著增强，从而易与作为路易斯碱的醇反应。',
        text: ALDOL_CONDENSATION_TEXT,
    },
    {
        slug: 'claisen-condensation',
        title: 'Claisen 缩合',
        excerpt: '与羟醛缩合类似。羧酸酯的 $α-\\text{H}$ 被强碱夺去后，先与另一羧酸酯发生亲核加成，再消去。',
        text: CLAISEN_CONDENSATION_TEXT,
    },
    {
        slug: 'grignard-reagent',
        title: '格氏试剂',
        excerpt:
            '格氏试剂 $\\text{RMgX}$ 中烃基带负电性，是强亲核试剂，可与醛、酮等羰基化合物发生加成反应。',
    },
    {
        slug: 'markovnikov-rule',
        title: '马氏规则',
        excerpt: '不对称烯烃与卤化氢加成时，氢加在含氢较多的碳上，卤素加在含氢较少的碳上。',
    },
    {
        slug: 'zaitsev-rule',
        title: '扎伊采夫规则',
        excerpt: '卤代烃消除时，产物倾向于生成取代基较多、更稳定的烯烃。',
    },
]

const POSTS_BEYOND_GAOKAO: Post[] = [
    {
        slug: 'hyperconjugation',
        title: '超共轭效应',
        excerpt: '$σ$ 键电子与相邻的空 $p$ 轨道或 $π$ 键发生部分重叠，使体系能量降低。',
    },
    {
        slug: 'chair-conformation',
        title: '环己烷优势构象',
        excerpt: '椅式构象中所有键处于交叉位，能量最低；大基团优先占据平伏键。',
    },
    {
        slug: 'chirality',
        title: '手性',
        excerpt: '手性分子与其镜像不能重合，存在对映异构体，又称旋光异构体。',
    },
    {
        slug: 'bond-order',
        title: '键级',
        excerpt: '键级反映两原子间共享电子对的数目，单键、双键、三键的键级分别为 1、2、3。',
    },
    {
        slug: 'aromaticity',
        title: '芳香性',
        excerpt:
            '满足 $4n+2$ 个 $π$ 电子且呈平面闭合共轭体系的环状分子，具有特殊稳定性，称芳香性。',
    },
    {
        slug: 'carbanion-carbocation-stability',
        title: '碳正离子与碳负离子的稳定性',
        excerpt: '碳正离子与碳负离子的稳定性受取代基的诱导效应与共振效应共同影响。',
    },
    {
        slug: 'acidity-basicity',
        title: '酸碱性强弱的比较',
        excerpt: '诱导与共振效应、共轭碱/酸的稳定性是判断酸/碱性强弱的关键依据。',
    },
    {
        slug: 'sn1-sn2-e1-e2',
        title: 'SN1/SN2/E1/E2 反应机理',
        excerpt: '亲核取代与消除反应的四种机理，受底物结构、试剂与溶剂等因素影响。',
    },
    {
        slug: 'radical-reactions',
        title: '自由基反应',
        excerpt: '自由基反应通过链引发、链增长、链终止三步进行，常见于烷烃卤代等反应。',
    },
]

export const posts: Post[] = [...POSTS_LEVEL_EXAM, ...POSTS_BEYOND_GAOKAO]

export interface PostSection {
    subtitle: string
    posts: Post[]
}

export const postSections: PostSection[] = [
    { subtitle: '等级考探微', posts: POSTS_LEVEL_EXAM },
    { subtitle: '走向大学', posts: POSTS_BEYOND_GAOKAO },
]
