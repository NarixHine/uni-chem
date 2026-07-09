export interface Post {
    slug: string
    title: string
    excerpt: string
}

export const posts: Post[] = [
    {
        slug: 'resonance',
        title: '共振理论',
        excerpt: '为什么苯环可以画成单双键交替的凯库勒式，也可以画成一个圈？重新建构对电子云和共价键的认知。',
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
    },
    {
        slug: 'aldol-condensation',
        title: '羟醛缩合',
        excerpt:
            '由于羰基的吸电子效应，α-氢的酸性显著增强，从而易与作为路易斯碱的醇反应。',
    },
]
