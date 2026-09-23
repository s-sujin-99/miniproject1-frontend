'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      setServerError(getErrorMessage(e));
    }
  }

  return (
    <>
      <div>
        <p className="text-muted-foreground font-mono text-xs tracking-[0.2em]">GET STARTED</p>
        <h1 className="text-foreground mt-1 text-3xl font-black tracking-tight">회원가입</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-foreground text-xs font-bold tracking-wide">
            이메일
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-destructive text-xs">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="nickname" className="text-foreground text-xs font-bold tracking-wide">
            닉네임
          </label>
          <Input
            id="nickname"
            type="text"
            autoComplete="nickname"
            aria-invalid={!!errors.nickname}
            aria-describedby={errors.nickname ? 'nickname-error' : undefined}
            {...register('nickname')}
          />
          {errors.nickname && (
            <p id="nickname-error" className="text-destructive text-xs">
              {errors.nickname.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-foreground text-xs font-bold tracking-wide">
            비밀번호
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className="text-destructive text-xs">
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && (
          <p role="alert" className="text-destructive text-sm">
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '가입 중...' : '회원가입'}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-foreground font-bold underline underline-offset-4">
          로그인
        </Link>
      </p>
    </>
  );
}
