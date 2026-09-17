'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';

// 백엔드 SignupRequest와 동일한 규칙(shrimp-rules §5.2): 비밀번호 6~64자, 닉네임 2~30자.
const signupSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요').email('이메일 형식이 올바르지 않습니다'),
  password: z
    .string()
    .min(6, '비밀번호는 6자 이상이어야 합니다')
    .max(64, '비밀번호는 64자 이하여야 합니다'),
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다')
    .max(30, '닉네임은 30자 이하여야 합니다'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupFormValues) {
    setServerError(null);
    try {
      await apiFetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      router.push('/login');
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : '회원가입에 실패했습니다.');
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold">회원가입</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            {...register('email')}
          />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="nickname" className="text-sm font-medium">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            autoComplete="nickname"
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            {...register('nickname')}
          />
          {errors.nickname && <p className="text-destructive text-xs">{errors.nickname.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            {...register('password')}
          />
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-destructive text-sm">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '가입 중...' : '회원가입'}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          로그인
        </Link>
      </p>
    </>
  );
}
