import Visualizer from '@/components/visualizer'

const caffeine: CDContent = {
    m: [
        {
            i: 'hydroxide',
            a: [
                { x: 30, y: 60, i: 'oh_o', l: 'O', c: -1, p: 3 },
                { x: 30, y: 110, i: 'oh_h', l: 'H' },
            ],
            b: [{ b: 0, e: 1, i: 'b_oh' }],
        },
        {
            i: 'acetaldehyde_1',
            a: [
                { x: 120, y: 100, i: 'c_alpha', l: 'C' },
                { x: 120, y: 40, i: 'h_alpha', l: 'H' },
                { x: 172, y: 130, i: 'c_carbonyl1', l: 'C' },
                { x: 172, y: 190, i: 'o_carbonyl1', l: 'O', p: 2 },
                { x: 224, y: 100, i: 'h_aldehyde1', l: 'H' },
            ],
            b: [
                { b: 0, e: 1, i: 'b_ch' },
                { b: 0, e: 2, i: 'b_cc1' },
                { b: 2, e: 3, o: 2, i: 'b_co1' },
                { b: 2, e: 4, i: 'b_ch_ald1' },
            ],
        },
    ],
    s: [
        { t: 'Pusher', o1: 'oh_o', o2: 'h_alpha', e: 2 },
        { t: 'Pusher', o1: 'b_ch', o2: 'c_alpha', e: 2 },
    ],
}

export default function Home() {
    return (
        <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
            <h1>Caffeine — ChemDoodle Viewer</h1>
            <Visualizer width={500} mol={caffeine} />
        </main>
    )
}
