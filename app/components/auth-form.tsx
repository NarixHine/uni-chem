'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, TextField } from '@heroui/react'
import { authClient } from '@/lib/auth-client'
import Main from '@/components/main'
import cn from 'cnfast'

type Mode = 'sign-in' | 'sign-up'

export function AuthForm({ mode }: { mode: Mode }) {
    const router = useRouter()
    const isSignUp = mode === 'sign-up'

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setPending(true)

        const { error: resError } = isSignUp
            ? await authClient.signUp.email({ name, email, password })
            : await authClient.signIn.email({ email, password })

        setPending(false)

        if (resError) {
            setError(resError.message ?? 'Something went wrong.')
            return
        }

        router.push('/')
        router.refresh()
    }

    return (
        <Main className='flex flex-col justify-center w-full max-w-md'>
            <div className='mx-auto w-full'>
                <h1 className='font-serif text-[clamp(2rem,6vw,2.75rem)] leading-[1.1] tracking-tight'>
                    {isSignUp ? '创建账号' : '登录账号'}
                </h1>
                <p className='mt-2 text-[15px] leading-relaxed text-default-500'>
                    {isSignUp ? '注册解锁 AI、题库等更多功能。' : '继续有机化学的学习。'}
                </p>

                <form onSubmit={onSubmit} className='mt-5 flex flex-col gap-5'>
                    {isSignUp && (
                        <TextField
                            value={name}
                            onChange={setName}
                            isRequired
                            className={fieldClass}
                        >
                            <Label className={labelClass}>Name</Label>
                            <Input autoComplete='name' className={inputClass} />
                        </TextField>
                    )}
                    <TextField value={email} onChange={setEmail} isRequired className={fieldClass}>
                        <Label className={labelClass}>Email</Label>
                        <Input type='email' autoComplete='email' className={inputClass} />
                    </TextField>
                    <TextField
                        value={password}
                        onChange={setPassword}
                        isRequired
                        className={fieldClass}
                    >
                        <Label className={labelClass}>Password</Label>
                        <Input
                            type='password'
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            className={inputClass}
                        />
                    </TextField>

                    {error && (
                        <p className='text-sm text-danger' role='alert'>
                            {error}
                        </p>
                    )}

                    <Button type='submit' isPending={pending} className='mt-2 h-11 rounded-lg'>
                        {isSignUp ? '注册' : '登录'}
                    </Button>
                </form>

                <p className='mt-8 text-sm text-default-500'>
                    {isSignUp ? (
                        <>
                            已有账号？
                            <Link
                                href='/sign-in'
                                className='text-foreground underline underline-offset-4'
                            >
                                登录
                            </Link>
                        </>
                    ) : (
                        <>
                            没有账号？
                            <Link
                                href='/sign-up'
                                className='text-foreground underline underline-offset-4'
                            >
                                创建一个
                            </Link>
                        </>
                    )}
                </p>
            </div>
        </Main>
    )
}

const fieldClass = 'flex flex-col gap-1.5'
const labelClass = 'text-default-500 text-sm'
const inputClass = cn(
    'border-border border-b rounded-none px-0 bg-transparent shadow-none focus-visible:ring-0',
)
